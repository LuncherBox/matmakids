import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
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
import { TaskInteraction } from '../../../../src/components/TaskInteraction';
import {
  getMechanicProgress,
  markMechanicLearned
} from '../../../../src/services/progress';
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
  'binary_grid_copy'
]);

export default function PracticeCategoryRoute() {
  const { childId, category } = useLocalSearchParams<{
    childId: string;
    category: string;
  }>();

  const [learned, setLearned] = useState<Set<string>>(new Set());
  const [selectedMechanic, setSelectedMechanic] = useState<string | null>(null);
  const [trainingTasks, setTrainingTasks] = useState<Task[]>([]);
  const [trainingIndex, setTrainingIndex] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!childId) return;

    getMechanicProgress(childId)
      .then((rows) => {
        setLearned(
          new Set(
            rows
              .filter((row) => row.training_status === 'learned')
              .map((row) => row.task_type)
          )
        );
      })
      .catch((error) => console.error(error));
  }, [childId]);

  const mechanics = useMemo(() => {
    const ids = new Set(
      tasksForCategory(category)
        .filter((task) => SUPPORTED_RENDERERS.has(task.renderer))
        .map(taskMechanicId)
    );

    return [...ids];
  }, [category]);

  const task = trainingTasks[trainingIndex];

  function startMechanic(mechanicId: string) {
    const candidates = tasksForMechanic(mechanicId).filter(
      (item) =>
        SUPPORTED_RENDERERS.has(item.renderer)
    );

    const isLearned = learned.has(mechanicId);
    const count = isLearned ? 5 : 2;

    setSelectedMechanic(mechanicId);
    setTrainingTasks(shuffled(candidates).slice(0, count));
    setTrainingIndex(0);
    setFeedback('');
    setFinished(false);
  }

  function handleWrongAnswer() {
    setFeedback('Spróbuj jeszcze raz');
  }

  async function handleCorrectAnswer() {
    if (!task || !selectedMechanic) return;

    setFeedback('Super!');

    if (trainingIndex + 1 >= trainingTasks.length) {
      if (!learned.has(selectedMechanic)) {
        try {
          await markMechanicLearned(childId, selectedMechanic);
          setLearned((current) => new Set([...current, selectedMechanic]));
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
    }, 400);
  }

  if (selectedMechanic && finished) {
    const wasLearned = learned.has(selectedMechanic);

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
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (selectedMechanic && task) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.topbar}>
            <Pressable onPress={() => setSelectedMechanic(null)}>
              <Text style={styles.back}>← Wróć</Text>
            </Pressable>
            <Text style={styles.counter}>
              {trainingIndex + 1}/{trainingTasks.length}
            </Text>
          </View>

          <Text style={styles.modeLabel}>
            {learned.has(selectedMechanic) ? 'ĆWICZENIE' : 'TRENING'}
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
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.replace(`/children/${childId}/practice`)}>
          <Text style={styles.back}>← Wróć do kategorii</Text>
        </Pressable>

        <Text style={styles.kicker}>ĆWICZ</Text>
        <Text style={styles.title}>{label}</Text>
        <Text style={styles.copy}>
          Nowy typ zaczyna się od krótkiego treningu. Poznane typy możesz ćwiczyć ponownie.
        </Text>

        <View style={styles.list}>
          {mechanics.map((mechanicId) => {
            const isLearned = learned.has(mechanicId);

            return (
              <Pressable
                key={mechanicId}
                style={styles.mechanicCard}
                onPress={() => startMechanic(mechanicId)}
              >
                <View>
                  <Text style={styles.mechanicName}>
                    {MECHANIC_LABELS[mechanicId] ?? mechanicId}
                  </Text>
                  <Text style={styles.mechanicStatus}>
                    {isLearned ? '✓ Poznane' : 'NOWE - najpierw krótki trening'}
                  </Text>
                </View>
                <Text style={styles.arrow}>›</Text>
              </Pressable>
            );
          })}

          {!mechanics.length ? (
            <Text style={styles.copy}>
              Ta kategoria jest jeszcze przenoszona do nowego silnika.
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
  mechanicCard: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mechanicName: { color: colors.text, fontSize: 18, fontWeight: '900' },
  mechanicStatus: { color: colors.muted, marginTop: 4, fontSize: 13 },
  arrow: { color: colors.muted, fontSize: 28 },
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
