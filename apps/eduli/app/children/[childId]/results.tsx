import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getChild } from '../../../src/services/children';
import { getChildStats, type ChildStats } from '../../../src/services/stats';
import { colors } from '../../../src/theme';

export default function ChildResultsRoute() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const [name, setName] = useState('');
  const [stats, setStats] = useState<ChildStats | null>(null);

  useEffect(() => {
    if (!childId) return;

    Promise.all([getChild(childId), getChildStats(childId)])
      .then(([child, nextStats]) => {
        setName(child.display_name);
        setStats(nextStats);
      })
      .catch((error) => console.error(error));
  }, [childId]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.replace(`/children/${childId}/home`)}>
          <Text style={styles.back}>← Wróć</Text>
        </Pressable>

        <Text style={styles.title}>Moje wyniki{name ? `, ${name}` : ''}</Text>

        <View style={styles.grid}>
          <View style={styles.card}>
            <Text style={styles.value}>{stats?.totalPoints ?? 0}</Text>
            <Text style={styles.label}>punkty</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.value}>{stats?.completedMissions ?? 0}</Text>
            <Text style={styles.label}>misje</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.value}>{stats?.streak ?? 0}</Text>
            <Text style={styles.label}>dni z rzędu</Text>
          </View>
        </View>

        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>Twój postęp</Text>
          <Text style={styles.progressText}>
            {stats?.totalTasks
              ? `${stats.firstTryAccuracy}% zadań udało Ci się zrobić dobrze za pierwszym razem.`
              : 'Rozwiąż pierwsze zadania, a tutaj pojawi się Twój postęp.'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, width: '100%', maxWidth: 680, alignSelf: 'center', padding: 24 },
  back: { color: colors.muted, fontWeight: '800', marginBottom: 24 },
  title: { color: colors.text, fontSize: 38, fontWeight: '900', marginBottom: 24 },
  grid: { flexDirection: 'row', gap: 10 },
  card: { flex: 1, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 20, padding: 18, alignItems: 'center' },
  value: { color: colors.text, fontSize: 30, fontWeight: '900' },
  label: { color: colors.muted, marginTop: 4 },
  progressCard: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 20, padding: 20, marginTop: 18 },
  progressTitle: { color: colors.text, fontSize: 20, fontWeight: '900' },
  progressText: { color: colors.muted, fontSize: 16, lineHeight: 23, marginTop: 8 }
});
