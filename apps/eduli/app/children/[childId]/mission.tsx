import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';

import {
  initialMissionTaskState,
  registerFirstMissionError,
  scoreMissionSuccess,
  useMissionHint,
  type MissionTaskState
} from '../../../src/domain/mission/scoring';
import {
  activeTasks,
  shuffled,
  taskMechanicId,
  tasksByIds
} from '../../../src/domain/tasks/bank';
import { TaskInteraction } from '../../../src/components/TaskInteraction';
import { getChild } from '../../../src/services/children';
import { setChildOnboardingStage } from '../../../src/services/onboarding';
import { getLearnedMechanics } from '../../../src/services/progress';
import { getProgressionState } from '../../../src/services/progression';
import {
  clearMissionSnapshot,
  readMissionSnapshot,
  saveMissionSnapshot
} from '../../../src/services/missionSnapshot';
import {
  abandonMission,
  finishMission,
  recalculateMissionTotals,
  getRecentTaskIds,
  isMissionSessionActive,
  saveMissionAnswer,
  startMissionSession,
  updateMissionTotals
} from '../../../src/services/sessions';
import { colors } from '../../../src/theme';
import type { Child } from '../../../src/types/models';
import type { Task } from '../../../src/types/tasks';

const SESSION_SIZE = 10;
const MISSION_UNLOCK_MECHANICS = 3;

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

type Totals = {
  correctFirstTry: number;
  mistakes: number;
  childPoints: number;
  gobiPoints: number;
};

const EMPTY_TOTALS: Totals = {
  correctFirstTry: 0,
  mistakes: 0,
  childPoints: 0,
  gobiPoints: 0
};

function buildMissionTasks(
  learnedMechanics: Set<string>,
  recentTaskIds: Set<string>
) {
  const allowed = activeTasks().filter(
    (task) =>
      task.category !== 'memory' &&
      learnedMechanics.has(taskMechanicId(task)) &&
      SUPPORTED_RENDERERS.has(task.renderer)
  );

  if (allowed.length < SESSION_SIZE) return [];

  const fresh = shuffled(
    allowed.filter((task) => !recentTaskIds.has(task.id))
  );
  const recent = shuffled(
    allowed.filter((task) => recentTaskIds.has(task.id))
  );

  return [...fresh, ...recent].slice(0, SESSION_SIZE);
}

export default function MissionRoute() {
  const { childId, onboarding } = useLocalSearchParams<{
    childId: string;
    onboarding?: string;
  }>();

  const [child, setChild] = useState<Child | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [taskState, setTaskState] = useState<MissionTaskState>(
    initialMissionTaskState()
  );
  const [totals, setTotals] = useState<Totals>(EMPTY_TOTALS);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(true);
  const [finished, setFinished] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  useEffect(() => {
    if (!childId) return;

    let active = true;

    async function start() {
      try {
        const nextChild = await getChild(childId);

        if (!active) return;

        const snapshot = readMissionSnapshot(childId);

        if (snapshot) {
          const [restoredTasks, sessionStillActive] = await Promise.all([
            Promise.resolve(tasksByIds(snapshot.taskIds)),
            isMissionSessionActive(snapshot.sessionId, childId)
          ]);

          if (
            sessionStillActive &&
            restoredTasks.length === snapshot.taskIds.length &&
            snapshot.index >= 0 &&
            snapshot.index < restoredTasks.length
          ) {
            setChild(nextChild);
            setTasks(restoredTasks);
            setSessionId(snapshot.sessionId);
            setIndex(snapshot.index);
            setTotals(snapshot.totals);
            setTaskState(snapshot.taskState);
            setStarting(false);
            return;
          }

          clearMissionSnapshot();
        }

        const [learnedRows, recentTaskIds, progression] = await Promise.all([
          getLearnedMechanics(childId),
          getRecentTaskIds(childId),
          getProgressionState(childId)
        ]);

        if (!active) return;

        const learned = new Set(learnedRows.map((row) => row.task_type));

        if (!progression.missionUnlocked) {
          setError(
            `Misja jest jeszcze zablokowana. Poznaj ${MISSION_UNLOCK_MECHANICS} jednostki treningowe.`
          );
          setStarting(false);
          return;
        }

        const nextTasks = buildMissionTasks(learned, recentTaskIds);

        if (nextTasks.length < SESSION_SIZE) {
          setError(
            'Poznane zadania są jeszcze przenoszone do nowego silnika. Wybierz Ćwicz albo spróbuj ponownie później.'
          );
          setStarting(false);
          return;
        }

        const nextSessionId = await startMissionSession(
          childId,
          nextTasks.length,
          Number(nextChild.gobi_level) || 1
        );

        if (!active) return;

        setChild(nextChild);
        setTasks(nextTasks);
        setSessionId(nextSessionId);
        setStarting(false);
      } catch (nextError) {
        console.error(nextError);
        if (active) {
          setError('Nie udało się rozpocząć misji.');
          setStarting(false);
        }
      }
    }

    start();

    return () => {
      active = false;
    };
  }, [childId]);

  useEffect(() => {
    if (
      !sessionId ||
      !childId ||
      !tasks.length ||
      finished ||
      feedback === 'Super!'
    ) {
      return;
    }

    saveMissionSnapshot({
      childId,
      sessionId,
      taskIds: tasks.map((item) => item.id),
      index,
      totals,
      taskState
    });
  }, [
    childId,
    sessionId,
    tasks,
    index,
    totals,
    taskState,
    finished,
    feedback
  ]);

  const task = tasks[index];

  function handleWrongAnswer() {
    if (!task || !sessionId || finished) return;

    const nextAttempts = taskState.attempts + 1;
    const firstError = !taskState.hadError;
    const nextState = {
      ...registerFirstMissionError({
        ...taskState,
        attempts: nextAttempts
      }),
      usedGuidedHelp: true
    };

    setTaskState(nextState);
    setFeedback('Spróbuj jeszcze raz');

    if (firstError) {
      setTotals((current) => ({
        ...current,
        mistakes: current.mistakes + 1,
        gobiPoints:
          current.gobiPoints + (nextState.gobiPoint - taskState.gobiPoint)
      }));
    }
  }

  async function handleCorrectAnswer() {
    if (!task || !sessionId || finished) return;

    const finalTaskState = {
      ...taskState,
      attempts: taskState.attempts + 1
    };

    const score = scoreMissionSuccess(finalTaskState);

    setFeedback('Super!');

    let nextTotals: Totals;

    try {
      await saveMissionAnswer({
        sessionId,
        taskId: task.id,
        taskType: taskMechanicId(task),
        category: task.category,
        attempts: finalTaskState.attempts,
        correctFirstTry: score.correctFirstTry,
        usedHint: finalTaskState.usedHint,
        usedGuidedHelp: finalTaskState.usedGuidedHelp,
        pointsChild: score.childPoints,
        pointsGobi: finalTaskState.gobiPoint
      });

      nextTotals = await recalculateMissionTotals(sessionId);

      await updateMissionTotals({
        sessionId,
        ...nextTotals
      });
    } catch (nextError) {
      console.error(nextError);
      setError('Nie udało się zapisać wyniku zadania.');
      return;
    }

    setTotals(nextTotals);

    if (index + 1 >= tasks.length) {
      try {
        const nextWinner = await finishMission({
          sessionId,
          ...nextTotals
        });
        if (onboarding === '1') {
          try {
            await setChildOnboardingStage(childId, 'completed');
          } catch (onboardingError) {
            console.error(
              'Nie udało się zapisać zakończenia onboardingu.',
              onboardingError
            );
          }
        }

        setWinner(nextWinner);
        clearMissionSnapshot();
        setFinished(true);
      } catch (nextError) {
        console.error(nextError);
        setError('Nie udało się zakończyć misji.');
      }
      return;
    }

    const nextTaskState = initialMissionTaskState();

    saveMissionSnapshot({
      childId,
      sessionId,
      taskIds: tasks.map((item) => item.id),
      index: index + 1,
      totals: nextTotals,
      taskState: nextTaskState
    });

    setTimeout(() => {
      setIndex((current) => current + 1);
      setTaskState(nextTaskState);
      setFeedback('');
    }, 450);
  }

  function useHint() {
    if (!task || taskState.usedHint || taskState.hadError) return;

    const nextState = useMissionHint(taskState, Number(child?.gobi_level) || 1);
    const gobiDelta = nextState.gobiPoint - taskState.gobiPoint;

    setTaskState(nextState);
    setTotals((current) => ({
      ...current,
      gobiPoints: current.gobiPoints + gobiDelta
    }));
  }

  async function exitMission() {
    if (sessionId && !finished) {
      try {
        await abandonMission(sessionId, totals);
      } catch (nextError) {
        console.error(nextError);
      }
    }

    clearMissionSnapshot();

    if (onboarding === '1') {
      router.replace(`/children/${childId}/onboarding/mission`);
      return;
    }

    router.replace(`/children/${childId}/home`);
  }

  if (starting) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.loading}>Przygotowuję 10 zadań...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <View style={styles.card}>
            <Text style={styles.title}>Misja</Text>
            <Text style={styles.copy}>{error}</Text>
            <Pressable
              style={styles.secondary}
              onPress={() => router.replace(`/children/${childId}/home`)}
            >
              <Text style={styles.secondaryText}>WRÓĆ</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (finished) {
    const resultTitle =
      winner === 'child'
        ? 'Wygrywasz!'
        : winner === 'gobi'
          ? 'Gobi wygrywa tę rundę'
          : 'Remis!';

    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <View style={styles.card}>
            <Text style={styles.kicker}>MISJA ZAKOŃCZONA</Text>
            <Text style={styles.title}>{resultTitle}</Text>

            <View style={styles.finalScore}>
              <View style={styles.finalPlayer}>
                <Text style={styles.finalLabel}>{child?.display_name ?? 'Ty'}</Text>
                <Text style={styles.finalValue}>{totals.childPoints}</Text>
              </View>
              <Text style={styles.colon}>:</Text>
              <View style={styles.finalPlayer}>
                <Text style={styles.finalLabel}>Gobi</Text>
                <Text style={styles.finalValue}>{totals.gobiPoints}</Text>
              </View>
            </View>

            <Pressable
              style={styles.primary}
              onPress={() => router.replace(`/children/${childId}/home`)}
            >
              <Text style={styles.primaryText}>WRÓĆ DO DOMU</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!task) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topbar}>
          <Pressable onPress={exitMission}>
            <Text style={styles.exit}>WYJDŹ</Text>
          </Pressable>

          <Text style={styles.counter}>
            {index + 1}/{tasks.length}
          </Text>
        </View>

        <View style={styles.scorebar}>
          <View>
            <Text style={styles.scoreLabel}>{child?.display_name ?? 'Ty'}</Text>
            <Text style={styles.score}>{totals.childPoints}</Text>
          </View>
          <View>
            <Text style={styles.scoreLabel}>Gobi</Text>
            <Text style={styles.score}>{totals.gobiPoints}</Text>
          </View>
        </View>

        <View style={styles.potentialRow}>
          <Text style={styles.potentialLabel}>Do zdobycia w tym zadaniu</Text>
          <Text style={styles.potentialValue}>
            {taskState.usedHint || taskState.hadError ? '●' : '● ●'}
          </Text>
        </View>

        {(
          task.renderer === 'equation_with_dots' ||
          task.renderer === 'missing_number_equation'
        ) && !taskState.hadError ? (
          <Pressable
            style={[
              styles.hintButton,
              taskState.usedHint ? styles.hintButtonUsed : null
            ]}
            disabled={taskState.usedHint}
            onPress={useHint}
          >
            <Text style={styles.hintButtonText}>
              {taskState.usedHint ? 'PODPOWIEDŹ UŻYTA' : 'PODPOWIEDŹ  •  1 MONETA'}
            </Text>
          </Pressable>
        ) : null}

        {task.renderer === 'missing_number_equation' &&
        (taskState.usedHint || taskState.hadError) ? (
          <View style={styles.helpPanel}>
            <Text style={styles.helpText}>
              Spójrz na wynik i policz, jakiej liczby brakuje.
            </Text>
          </View>
        ) : null}

        <TaskInteraction
          task={task}
          onCorrect={handleCorrectAnswer}
          onWrong={handleWrongAnswer}
          disabled={feedback === 'Super!'}
          showVisualHelp={
            task.renderer !== 'equation_with_dots' ||
            taskState.usedHint ||
            taskState.hadError
          }
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

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background
  },
  centered: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    padding: 24
  },
  loading: {
    color: colors.muted,
    fontSize: 18,
    fontWeight: '800'
  },
  topbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  exit: {
    color: colors.muted,
    fontWeight: '900'
  },
  counter: {
    color: colors.muted,
    fontWeight: '900'
  },
  scorebar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 22,
    marginBottom: 18
  },
  scoreLabel: {
    color: colors.muted,
    fontWeight: '800'
  },
  score: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900'
  },
  taskCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 24,
    padding: 22
  },
  instruction: {
    color: colors.muted,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center'
  },
  question: {
    color: colors.text,
    fontSize: 38,
    lineHeight: 46,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 18,
    marginBottom: 24
  },
  options: {
    gap: 10
  },
  option: {
    minHeight: 58,
    borderColor: colors.border,
    borderWidth: 2,
    borderRadius: 18,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12
  },
  optionText: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900'
  },
  potentialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4
  },
  potentialLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800'
  },
  potentialValue: {
    color: '#D5A72E',
    fontSize: 18,
    letterSpacing: 3
  },
  hintButton: {
    borderColor: '#D5A72E',
    borderWidth: 2,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#FFF9E8'
  },
  hintButtonUsed: {
    opacity: 0.6
  },
  hintButtonText: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 14
  },
  helpPanel: {
    backgroundColor: '#F6F7F5',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12
  },
  helpText: {
    color: colors.text,
    textAlign: 'center',
    fontWeight: '800',
    lineHeight: 20
  },
  feedback: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 18
  },
  good: {
    color: colors.accentDark
  },
  retry: {
    color: colors.danger
  },
  card: {
    width: '100%',
    maxWidth: 560,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 28,
    padding: 28
  },
  kicker: {
    color: colors.accentDark,
    fontSize: 12,
    fontWeight: '900'
  },
  title: {
    color: colors.text,
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '900',
    marginTop: 10
  },
  copy: {
    color: colors.muted,
    fontSize: 17,
    lineHeight: 24,
    marginTop: 12
  },
  primary: {
    backgroundColor: colors.accent,
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    marginTop: 24
  },
  primaryText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900'
  },
  secondary: {
    borderColor: colors.border,
    borderWidth: 2,
    borderRadius: 18,
    padding: 15,
    alignItems: 'center',
    marginTop: 24
  },
  secondaryText: {
    color: colors.text,
    fontWeight: '900'
  },
  finalScore: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 18,
    marginTop: 28
  },
  finalPlayer: {
    alignItems: 'center'
  },
  finalLabel: {
    color: colors.muted,
    fontWeight: '800'
  },
  finalValue: {
    color: colors.text,
    fontSize: 50,
    fontWeight: '900'
  },
  colon: {
    color: colors.muted,
    fontSize: 34,
    fontWeight: '900',
    marginBottom: 5
  }
});
