import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getChild } from '../../../src/services/children';
import { getMechanicProgress } from '../../../src/services/progress';
import { getChildStats, type ChildStats } from '../../../src/services/stats';
import { colors } from '../../../src/theme';

export default function ChildHomeRoute() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const [name, setName] = useState('');
  const [stats, setStats] = useState<ChildStats | null>(null);
  const [learnedCount, setLearnedCount] = useState(0);

  useEffect(() => {
    if (!childId) return;

    Promise.all([
      getChild(childId),
      getChildStats(childId),
      getMechanicProgress(childId)
    ])
      .then(([child, childStats, progress]) => {
        setName(child.display_name);
        setStats(childStats);
        setLearnedCount(
          progress.filter((item) => item.training_status === 'learned').length
        );
      })
      .catch((error) => console.error(error));
  }, [childId]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topbar}>
          <Text style={styles.brand}>Eduli</Text>
          <Pressable onPress={() => router.replace(`/children/${childId}`)}>
            <Text style={styles.exit}>Do rodzica</Text>
          </Pressable>
        </View>

        <Text style={styles.title}>Cześć{name ? `, ${name}!` : '!'}</Text>
        <Text style={styles.subtitle}>Co dzisiaj robimy?</Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{stats?.totalPoints ?? 0}</Text>
            <Text style={styles.statLabel}>punkty</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{stats?.completedMissions ?? 0}</Text>
            <Text style={styles.statLabel}>misje</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{stats?.streak ?? 0}</Text>
            <Text style={styles.statLabel}>dni z rzędu</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={[
              styles.primary,
              learnedCount < 3 ? styles.primaryLocked : null
            ]}
            disabled={learnedCount < 3}
            onPress={() => router.push(`/children/${childId}/mission`)}
          >
            <Text style={styles.primaryTitle}>
              {learnedCount < 3 ? 'MISJA ZABLOKOWANA' : 'POKONAJ GOBIEGO'}
            </Text>
            <Text style={styles.primaryCopy}>
              {learnedCount < 3
                ? `Poznaj jeszcze ${3 - learnedCount} ${3 - learnedCount === 1 ? 'typ zadania' : 'typy zadań'}`
                : 'Misja z mieszanymi zadaniami'}
            </Text>
          </Pressable>

          <Pressable
            style={styles.card}
            onPress={() => router.push(`/children/${childId}/practice`)}
          >
            <Text style={styles.cardTitle}>ĆWICZ</Text>
            <Text style={styles.cardCopy}>Wybierz kategorię i trenuj</Text>
          </Pressable>

          <Pressable
            style={styles.card}
            onPress={() => router.push(`/children/${childId}/results`)}
          >
            <Text style={styles.cardTitle}>MOJE WYNIKI</Text>
            <Text style={styles.cardCopy}>Punkty, misje i prosty postęp</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, width: '100%', maxWidth: 680, alignSelf: 'center', padding: 24 },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { color: colors.text, fontSize: 22, fontWeight: '900' },
  exit: { color: colors.muted, fontWeight: '800' },
  title: { color: colors.text, fontSize: 42, fontWeight: '900', marginTop: 42 },
  subtitle: { color: colors.muted, fontSize: 18, marginTop: 6 },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 24 },
  stat: { flex: 1, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 18, padding: 16, alignItems: 'center' },
  statValue: { color: colors.text, fontSize: 26, fontWeight: '900' },
  statLabel: { color: colors.muted, marginTop: 3 },
  actions: { gap: 12, marginTop: 28 },
  primary: { backgroundColor: colors.accent, borderRadius: 22, padding: 22 },
  primaryLocked: { backgroundColor: '#B8C1BD' },
  primaryTitle: { color: '#FFF', fontSize: 22, fontWeight: '900' },
  primaryCopy: { color: '#FFF', opacity: 0.9, marginTop: 4 },
  card: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 22, padding: 22 },
  cardTitle: { color: colors.text, fontSize: 20, fontWeight: '900' },
  cardCopy: { color: colors.muted, marginTop: 4 }
});
