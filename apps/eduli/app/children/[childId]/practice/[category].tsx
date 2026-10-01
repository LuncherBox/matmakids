import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from 'react-native';

import {
  shuffled,
  taskMechanicId,
  tasksForCategory,
  tasksForMechanic
} from '../../../../src/domain/tasks/bank';
import {
  CATEGORY_LABELS,
  MECHANIC_LABELS
} from '../../../../src/domain/tasks/labels';
import {
  highestAvailableBandAtOrBelow,
  isSkillBandLearned,
  tasksAtOrBelowDifficultyBand,
  tasksForDifficultyBand,
  type SkillBandProgress
} from '../../../../src/domain/progression/model';
import { TaskInteraction } from '../../../../src/components/TaskInteraction';
import {
  getMechanicProgress,
  markMechanicLearned
} from '../../../../src/services/progress';
import {
  getSkillBandState,
  markSkillBandLearned,
  recordSkillBandTaskResult
} from '../../../../src/services/progression';
import {
  responsiveHeadingSize,
  screenHorizontalPadding
} from '../../../../src/domain/layout/responsive';
import { colors } from '../../../../src/theme';
import type { Task } from '../../../../src/types/tasks';

const SUPPORTED_RENDERERS = new Set([
  'equation_with_dots',
  'missing_number_equation',
  'number_sequence',
  'number_comparison',
  'visual_sequence',
  'command_pattern',
  'command_grid_plan',
  'sudoku_grid',
  'color_grid_copy',
  'visual_search',
  'symbol_code',
  'binary_grid_copy',
  'image_memory',
  'location_memory_grid',
  'sequence_memory',
  'number_memory',
  'pair_memory'
]);

export default function PracticeCategoryRoute() {
  const { width } = useWindowDimensions();
  const { childId, category, returnTo } = useLocalSearchParams<{
    childId: string;
    category: string;
    returnTo?: string;
  }>();

  const [learned, setLearned] = useState<Set<string>>(new Set());
  const [skillBandRows, setSkillBandRows] = useState<SkillBandProgress[]>([]);
  const [skillSchemaReady, setSkillSchemaReady] = useState(false);
  const [progressionLevel, setProgressionLevel] = useState<number | null>(null);
  const [selectedMechanic, setSelectedMechanic] = useState<string | null>(null);
  const [activeBand, setActiveBand] = useState<number | null>(null);
  const [sessionWasLearned, setSessionWasLearned] = useState(false);
  const [trainingTasks, setTrainingTasks] = useState<Task[]>([]);
  const [trainingIndex, setTrainingIndex] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [taskHadError, setTaskHadError] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!childId) return;

    Promise.all([
      getMechanicProgress(childId),
      getSkillBandState(childId)
    ])
      .then(([rows, bandState]) => {
        setLearned(
          new Set(
            rows
              .filter((row) => row.training_status === 'learned')
              .map((row) => row.task_type)
          )
        );
        setSkillSchemaReady(bandState.schemaReady);
        setProgressionLevel(bandState.progressionLevel);
        setSkillBandRows(bandState.rows);
      })
      .catch((error) => console.error(error));
  }, [childId]);

  const mechanics = useMemo(() => {
    const categoryTasks = tasksForCategory(category).filter((task) =>
      SUPPORTED_RENDERERS.has(task.renderer)
    );

    const ids = new Set(categoryTasks.map(taskMechanicId));

    if (!skillSchemaReady || progressionLevel == null) {
      return [...ids];
    }

    return [...ids].filter((mechanicId) => {
      const candidates = categoryTasks.filter(
        (task) => taskMechanicId(task) === mechanicId
      );

      return (
        highestAvailableBandAtOrBelow(candidates, progressionLevel) != null
      );
    });
  }, [category, progressionLevel, skillSchemaReady]);

  const task = trainingTasks[trainingIndex];

  function startMechanic(mechanicId: string) {
    const candidates = tasksForMechanic(mechanicId).filter((item) =>
      SUPPORTED_RENDERERS.has(item.renderer)
    );

    if (skillSchemaReady && progressionLevel != null) {
      const targetBand = highestAvailableBandAtOrBelow(
        candidates,
        progressionLevel
      );

      if (targetBand == null) return;

      const bandLearned = isSkillBandLearned(
        skillBandRows,
        mechanicId,
        targetBand
      );
      const pool = bandLearned
        ? tasksAtOrBelowDifficultyBand(candidates, targetBand)
        : tasksForDifficultyBand(candidates, targetBand);
      const count = bandLearned ? 5 : 2;

      setSelectedMechanic(mechanicId);
      setActiveBand(targetBand);
      setSessionWasLearned(bandLearned);
      setTrainingTasks(shuffled(pool).slice(0, count));
      setTrainingIndex(0);
      setFeedback('');
      setFinished(false);
      return;
    }

    const isLearned = learned.has(mechanicId);
    const count = isLearned ? 5 : 2;

    setSelectedMechanic(mechanicId);
    setActiveBand(null);
    setSessionWasLearned(isLearned);
    setTrainingTasks(shuffled(candidates).slice(0, count));
    setTrainingIndex(0);
    setFeedback('');
    setTaskHadError(false);
    setFinished(false);
  }

  function handleWrongAnswer() {
    setTaskHadError(true);
    setFeedback('Spróbuj jeszcze raz');
  }

  async function handleCorrectAnswer() {
    if (!task || !selectedMechanic) return;

    setFeedback('Super!');

    if (
      sessionWasLearned &&
      skillSchemaReady &&
      activeBand != null
    ) {
      try {
        await recordSkillBandTaskResult({
          childId,
          taskType: selectedMechanic,
          difficultyBand: activeBand,
          correctFirstTry: !taskHadError,
          usedHint: false,
          usedGuidedHelp: taskHadError
        });
      } catch (error) {
        console.error(error);
      }
    }

    if (trainingIndex + 1 >= trainingTasks.length) {
      if (!sessionWasLearned) {
        try {
          if (
            skillSchemaReady &&
            progressionLevel != null &&
            activeBand != null
          ) {
            const saved = await markSkillBandLearned({
              childId,
              taskType: selectedMechanic,
              difficultyBand: activeBand,
              progressionLevel
            });

            if (saved) {
              setSkillBandRows((current) => [
                ...current.filter(
                  (row) =>
                    !(
                      row.task_type === selectedMechanic &&
                      row.difficulty_band === activeBand
                    )
                ),
                {
                  child_id: childId,
                  task_type: selectedMechanic,
                  difficulty_band: activeBand,
                  training_status: 'learned',
                  unlocked_level: progressionLevel,
                  training_attempts: 1,
                  successful_tasks: 0,
                  first_try_tasks: 0,
                  hint_tasks: 0,
                  guided_help_tasks: 0,
                  learned_at: new Date().toISOString()
                }
              ]);
            }
          }

          if (!learned.has(selectedMechanic)) {
            await markMechanicLearned(childId, selectedMechanic);
            setLearned((current) =>
              new Set([...current, selectedMechanic])
            );
          }
        } catch (error) {
          console.error(error);
        }
      }

      setFinished(true);
      return;
    }

    setTimeout(() => {
      setTrainingIndex((current) => current + 1);
      setFeedback('');
      setTaskHadError(false);
    }, 400);
  }

  if (selectedMechanic && finished) {
    const wasLearned = sessionWasLearned;

    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <View style={styles.finishCard}>
            <Text style={styles.kicker}>GOTOWE</Text>
            <Text style={styles.title}>
              {wasLearned ? 'Dobra robota!' : 'Już umiesz!'}
            </Text>
            <Text style={styles.copy}>
              {MECHANIC_LABELS[selectedMechanic] ?? selectedMechanic} jest gotowe do dalszego ćwiczenia i misji.
            </Text>

            {returnTo === 'onboarding' ? (
              <Pressable
                style={styles.primary}
                onPress={() =>
                  router.replace(
                    `/children/${childId}/onboarding/training`
                  )
                }
              >
                <Text style={styles.primaryText}>DALEJ</Text>
              </Pressable>
            ) : (
              <>
                <Pressable
                  style={styles.primary}
                  onPress={() => startMechanic(selectedMechanic)}
                >
                  <Text style={styles.primaryText}>POĆWICZ JESZCZE</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setSelectedMechanic(null);
                    setFinished(false);
                  }}
                >
                  <Text style={styles.back}>Wróć do listy</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (selectedMechanic && task) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: screenHorizontalPadding(width) }
        ]}
      >
          <View style={styles.topbar}>
            <Pressable onPress={() => setSelectedMechanic(null)}>
              <Text style={styles.back}>← Wróć</Text>
            </Pressable>
            <Text style={styles.counter}>
              {trainingIndex + 1}/{trainingTasks.length}
            </Text>
          </View>

          <Text style={styles.modeLabel}>
            {sessionWasLearned ? 'ĆWICZENIE' : 'TRENING'}
            {activeBand != null ? `  •  POZIOM ${activeBand}` : ''}
          </Text>
          <Text style={styles.mechanicTitle}>
            {MECHANIC_LABELS[selectedMechanic] ?? selectedMechanic}
          </Text>

          <TaskInteraction
            task={task}
            onCorrect={handleCorrectAnswer}
            onWrong={handleWrongAnswer}
            disabled={feedback === 'Super!'}
          />

          {feedback ? (
            <Text
              style={[
                styles.feedback,
                feedback === 'Super!' ? styles.good : styles.retry
              ]}
            >
              {feedback}
            </Text>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    );
  }

  const label = CATEGORY_LABELS[category] ?? category;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: screenHorizontalPadding(width) }
        ]}
      >
        <Pressable
          onPress={() =>
            returnTo === 'onboarding'
              ? router.replace(`/children/${childId}/onboarding/training`)
              : router.replace(`/children/${childId}/practice`)
          }
        >
          <Text style={styles.back}>
            {returnTo === 'onboarding' ? '← Wróć do treningu' : '← Wróć do kategorii'}
          </Text>
        </Pressable>

        <Text style={styles.kicker}>ĆWICZ</Text>
        <Text
          style={[
            styles.title,
            { fontSize: responsiveHeadingSize(width, 40, 32) }
          ]}
        >
          {label}
        </Text>
        <Text style={styles.copy}>
          Nowy typ zaczyna się od krótkiego treningu. Poznane typy możesz ćwiczyć ponownie.
        </Text>

        <View style={styles.list}>
          {mechanics.map((mechanicId) => {
            const candidates = tasksForMechanic(mechanicId).filter((item) =>
              SUPPORTED_RENDERERS.has(item.renderer)
            );
            const targetBand =
              skillSchemaReady && progressionLevel != null
                ? highestAvailableBandAtOrBelow(
                    candidates,
                    progressionLevel
                  )
                : null;
            const isLearned =
              targetBand != null
                ? isSkillBandLearned(
                    skillBandRows,
                    mechanicId,
                    targetBand
                  )
                : learned.has(mechanicId);

            return (
              <Pressable
                key={mechanicId}
                style={styles.mechanicCard}
                onPress={() => startMechanic(mechanicId)}
              >
                <View style={styles.mechanicCopy}>
                  <Text style={styles.mechanicName}>
                    {MECHANIC_LABELS[mechanicId] ?? mechanicId}
                  </Text>
                  <Text style={styles.mechanicStatus}>
                    {targetBand != null
                      ? isLearned
                        ? `✓ Poziom ${targetBand} poznany`
                        : `POZIOM ${targetBand} - krótki trening`
                      : isLearned
                        ? '✓ Poznane'
                        : 'NOWE - najpierw krótki trening'}
                  </Text>
                </View>
                <Text style={styles.arrow}>›</Text>
              </Pressable>
            );
          })}

          {!mechanics.length ? (
            <Text style={styles.copy}>
              {skillSchemaReady && progressionLevel === 0
                ? 'Treści dla Poziomu 0 nie są jeszcze dodane do banku zadań.'
                : 'Ta kategoria jest jeszcze przenoszona do nowego silnika.'}
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, width: '100%', maxWidth: 680, alignSelf: 'center', padding: 24 },
  centered: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  back: { color: colors.muted, fontWeight: '800', marginTop: 18 },
  counter: { color: colors.muted, fontWeight: '900' },
  kicker: { color: colors.accentDark, fontSize: 12, fontWeight: '900' },
  title: { color: colors.text, fontSize: 40, fontWeight: '900', marginTop: 8 },
  copy: { color: colors.muted, fontSize: 17, lineHeight: 24, marginTop: 10 },
  list: { gap: 10, marginTop: 24 },
  mechanicCard: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  mechanicCopy: { flex: 1, minWidth: 0 },
  mechanicName: { color: colors.text, fontSize: 18, fontWeight: '900', flexShrink: 1 },
  mechanicStatus: { color: colors.muted, marginTop: 4, fontSize: 13 },
  arrow: { color: colors.muted, fontSize: 28, flexShrink: 0 },
  modeLabel: { color: colors.accentDark, fontSize: 12, fontWeight: '900', marginTop: 28 },
  mechanicTitle: { color: colors.text, fontSize: 30, fontWeight: '900', marginTop: 6, marginBottom: 18 },
  taskCard: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 24, padding: 22 },
  instruction: { color: colors.muted, fontSize: 16, fontWeight: '800', textAlign: 'center' },
  question: { color: colors.text, fontSize: 38, lineHeight: 46, fontWeight: '900', textAlign: 'center', marginTop: 18, marginBottom: 24 },
  options: { gap: 10 },
  option: { minHeight: 58, borderColor: colors.border, borderWidth: 2, borderRadius: 18, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', padding: 12 },
  optionText: { color: colors.text, fontSize: 22, fontWeight: '900' },
  feedback: { textAlign: 'center', fontSize: 18, fontWeight: '900', marginTop: 18 },
  good: { color: colors.accentDark },
  retry: { color: colors.danger },
  finishCard: { width: '100%', maxWidth: 560, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 26, padding: 26 },
  primary: { backgroundColor: colors.accent, borderRadius: 18, padding: 16, alignItems: 'center', marginTop: 24 },
  primaryText: { color: '#FFF', fontSize: 18, fontWeight: '900' }
});
