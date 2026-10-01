import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from 'react-native';

import { TaskInteraction } from '../src/components/TaskInteraction';
import { buildBalancedDemoTasks } from '../src/domain/demo/session';
import {
  responsiveHeadingSize,
  screenHorizontalPadding
} from '../src/domain/layout/responsive';
import { activeTasks } from '../src/domain/tasks/bank';
import { colors } from '../src/theme';
import type { Task } from '../src/types/tasks';

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

function buildDemoTasks() {
  const pool = activeTasks().filter(
    (task) =>
      task.category !== 'memory' &&
      SUPPORTED_RENDERERS.has(task.renderer)
  );

  return buildBalancedDemoTasks(pool);
}

export default function DemoRoute() {
  const { width } = useWindowDimensions();
  const tasks = useMemo(() => buildDemoTasks(), []);
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [locked, setLocked] = useState(false);

  const task = tasks[index];
  const finished = index >= tasks.length;

  function handleCorrect() {
    if (locked) return;

    setLocked(true);
    setFeedback('Super!');

    setTimeout(() => {
      setIndex((current) => current + 1);
      setFeedback('');
      setLocked(false);
    }, 450);
  }

  function handleWrong() {
    if (locked) return;
    setFeedback('Spróbuj jeszcze raz');
  }

  if (finished) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <View style={styles.finishCard}>
            <Text style={styles.kicker}>GOTOWE</Text>
            <Text
              style={[
                styles.title,
                {
                  fontSize: responsiveHeadingSize(width, 38, 32),
                  lineHeight: responsiveHeadingSize(width, 42, 36)
                }
              ]}
            >
              To było 10 zadań
            </Text>
            <Text style={styles.copy}>
              Na koncie dziecka Eduli zapisuje postępy, misje i wyniki.
            </Text>

            <Pressable style={styles.primary} onPress={() => router.replace('/register')}>
              <Text style={styles.primaryText}>ZAŁÓŻ KONTO</Text>
            </Pressable>

            <Pressable onPress={() => router.replace('/')}>
              <Text style={styles.back}>Wróć na stronę startową</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!task) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.copy}>Nie udało się przygotować przykładowych zadań.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: screenHorizontalPadding(width) }
        ]}
      >
        <View style={styles.topbar}>
          <Pressable onPress={() => router.replace('/')}>
            <Text style={styles.exit}>WYJDŹ</Text>
          </Pressable>
          <Text style={styles.counter}>{index + 1}/10</Text>
        </View>

        <Text style={styles.demoLabel}>PRZYKŁADOWA SESJA</Text>

        <TaskInteraction
          task={task as Task}
          onCorrect={handleCorrect}
          onWrong={handleWrong}
          disabled={locked}
          showVisualHelp
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
  safe: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  content: { flexGrow: 1, width: '100%', maxWidth: 680, alignSelf: 'center', padding: 24 },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  exit: { color: colors.muted, fontWeight: '900' },
  counter: { color: colors.muted, fontWeight: '900' },
  demoLabel: { color: colors.accentDark, fontSize: 12, fontWeight: '900', marginBottom: 12 },
  feedback: { textAlign: 'center', fontSize: 18, fontWeight: '900', marginTop: 18 },
  good: { color: colors.accentDark },
  retry: { color: colors.danger },
  finishCard: { width: '100%', maxWidth: 560, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 28, padding: 28 },
  kicker: { color: colors.accentDark, fontSize: 12, fontWeight: '900' },
  title: { color: colors.text, fontSize: 38, lineHeight: 42, fontWeight: '900', marginTop: 10 },
  copy: { color: colors.muted, fontSize: 17, lineHeight: 24, marginTop: 12 },
  primary: { backgroundColor: colors.accent, borderRadius: 18, padding: 16, alignItems: 'center', marginTop: 24 },
  primaryText: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  back: { color: colors.muted, textAlign: 'center', fontWeight: '700', marginTop: 18 }
});
