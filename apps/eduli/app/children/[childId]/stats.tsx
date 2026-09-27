import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MECHANIC_LABELS } from '../../../src/domain/tasks/labels';
import { getChild } from '../../../src/services/children';
import { getChildStats, type ChildStats } from '../../../src/services/stats';
import { colors } from '../../../src/theme';

const CATEGORY_LABELS: Record<string, string> = {
  math: 'Matematyka',
  logic: 'Logika',
  coding: 'Kodowanie',
  memory: 'Pamięć'
};

export default function ChildStatsRoute() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const [childName, setChildName] = useState('');
  const [stats, setStats] = useState<ChildStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!childId) return;

    Promise.all([getChild(childId), getChildStats(childId)])
      .then(([child, nextStats]) => {
        setChildName(child.display_name);
        setStats(nextStats);
      })
      .catch((nextError) => {
        console.error(nextError);
        setError('Nie udało się wczytać statystyk.');
      });
  }, [childId]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.replace(`/children/${childId}`)}>
          <Text style={styles.back}>← Wróć do profilu</Text>
        </Pressable>

        <Text style={styles.kicker}>STATYSTYKI RODZICA</Text>
        <Text style={styles.title}>{childName || 'Statystyki'}</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!stats && !error ? <Text style={styles.meta}>Wczytuję dane...</Text> : null}

        {stats ? (
          <>
            <View style={styles.grid}>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{stats.completedMissions}</Text>
                <Text style={styles.metricLabel}>ukończone misje</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{stats.totalTasks}</Text>
                <Text style={styles.metricLabel}>wykonane zadania</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{stats.firstTryAccuracy}%</Text>
                <Text style={styles.metricLabel}>poprawnie za 1. razem</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{stats.hintsUsed}</Text>
                <Text style={styles.metricLabel}>użyte podpowiedzi</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{stats.activeDays}</Text>
                <Text style={styles.metricLabel}>dni aktywności</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{stats.streak}</Text>
                <Text style={styles.metricLabel}>dni z rzędu</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Historia misji</Text>
            <View style={styles.list}>
              {stats.recentMissions.length ? (
                stats.recentMissions.map((mission) => (
                  <View key={mission.id} style={styles.row}>
                    <View>
                      <Text style={styles.rowTitle}>
                        {new Date(mission.date).toLocaleDateString('pl-PL')}
                      </Text>
                      <Text style={styles.rowMeta}>
                        {mission.winner === 'child'
                          ? 'Wygrana'
                          : mission.winner === 'gobi'
                            ? 'Gobi wygrał'
                            : 'Remis'}
                      </Text>
                    </View>
                    <Text style={styles.rowValue}>
                      {mission.childPoints}:{mission.gobiPoints}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.meta}>Brak ukończonych misji.</Text>
              )}
            </View>

            <Text style={styles.sectionTitle}>Według kategorii</Text>
            <View style={styles.list}>
              {stats.categories.length ? (
                stats.categories.map((category) => (
                  <View key={category.category} style={styles.row}>
                    <View>
                      <Text style={styles.rowTitle}>
                        {CATEGORY_LABELS[category.category] ?? category.category}
                      </Text>
                      <Text style={styles.rowMeta}>{category.total} zadań</Text>
                    </View>
                    <Text style={styles.rowValue}>{category.accuracy}%</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.meta}>Brak danych z rozwiązanych zadań.</Text>
              )}
            </View>

            <Text style={styles.sectionTitle}>Według typu zadania</Text>
            <View style={styles.list}>
              {stats.mechanics.length ? (
                stats.mechanics.map((mechanic) => (
                  <View key={mechanic.taskType} style={styles.row}>
                    <View>
                      <Text style={styles.rowTitle}>
                        {MECHANIC_LABELS[mechanic.taskType] ?? mechanic.taskType}
                      </Text>
                      <Text style={styles.rowMeta}>{mechanic.total} zadań</Text>
                    </View>
                    <Text style={styles.rowValue}>{mechanic.accuracy}%</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.meta}>Brak danych z typów zadań.</Text>
              )}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, width: '100%', maxWidth: 760, alignSelf: 'center', padding: 24 },
  back: { color: colors.muted, fontWeight: '800', marginBottom: 24 },
  kicker: { color: colors.accentDark, fontSize: 12, fontWeight: '900' },
  title: { color: colors.text, fontSize: 40, fontWeight: '900', marginTop: 8, marginBottom: 22 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metric: { flexBasis: '48%', flexGrow: 1, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 18, padding: 18 },
  metricValue: { color: colors.text, fontSize: 30, fontWeight: '900' },
  metricLabel: { color: colors.muted, marginTop: 4, lineHeight: 19 },
  sectionTitle: { color: colors.text, fontSize: 24, fontWeight: '900', marginTop: 30, marginBottom: 12 },
  list: { gap: 10 },
  row: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  rowMeta: { color: colors.muted, marginTop: 3 },
  rowValue: { color: colors.accentDark, fontSize: 22, fontWeight: '900' },
  meta: { color: colors.muted },
  error: { color: colors.danger }
});
