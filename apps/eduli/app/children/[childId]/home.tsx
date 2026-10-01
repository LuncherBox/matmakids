import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { getChild } from '../../../src/services/children';
import { getProgressionState } from '../../../src/services/progression';
import { getChildStats, type ChildStats } from '../../../src/services/stats';
import {
  isCompactPhone,
  responsiveHeadingSize,
  screenHorizontalPadding
} from '../../../src/domain/layout/responsive';
import { colors } from '../../../src/theme';

export default function ChildHomeRoute() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const { width } = useWindowDimensions();
  const compact = isCompactPhone(width);
  const [name, setName] = useState('');
  const [stats, setStats] = useState<ChildStats | null>(null);
  const [learnedCount, setLearnedCount] = useState(0);
  const [missionUnlocked, setMissionUnlocked] = useState(false);

  useEffect(() => {
    if (!childId) return;

    Promise.all([
      getChild(childId),
      getChildStats(childId),
      getProgressionState(childId)
    ])
      .then(([child, childStats, progression]) => {
        setName(child.display_name);
        setStats(childStats);
        setLearnedCount(progression.learnedUnits);
        setMissionUnlocked(progression.missionUnlocked);
      })
      .catch((error) => console.error(error));
  }, [childId]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: screenHorizontalPadding(width) }
        ]}
      >
        <View style={styles.topbar}>
          <Text style={styles.brand}>Eduli</Text>
          <Pressable onPress={() => router.push(`/children/${childId}/exit`)}>
            <Text style={styles.exit}>Do rodzica</Text>
          </Pressable>
        </View>

        <Text
          style={[
            styles.title,
            { fontSize: responsiveHeadingSize(width, 42, 34) }
          ]}
        >
          Cześć{name ? `, ${name}!` : '!'}
        </Text>
        <Text style={styles.subtitle}>Co dzisiaj robimy?</Text>

        <View
          style={[
            styles.statsRow,
            compact ? styles.statsRowCompact : null
          ]}
        >
          <View style={[styles.stat, compact ? styles.statCompact : null]}>
            <Text style={styles.statValue}>{stats?.totalPoints ?? 0}</Text>
            <Text style={styles.statLabel}>punkty</Text>
          </View>
          <View style={[styles.stat, compact ? styles.statCompact : null]}>
            <Text style={styles.statValue}>{stats?.completedMissions ?? 0}</Text>
            <Text style={styles.statLabel}>misje</Text>
          </View>
          <View style={[styles.stat, compact ? styles.statCompact : null]}>
            <Text style={styles.statValue}>{stats?.streak ?? 0}</Text>
            <Text style={styles.statLabel}>dni z rzędu</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={[
              styles.primary,
              !missionUnlocked ? styles.primaryLocked : null
            ]}
            disabled={!missionUnlocked}
            onPress={() => router.push(`/children/${childId}/mission`)}
          >
            <Text style={styles.primaryTitle}>
              {!missionUnlocked ? 'MISJA ZABLOKOWANA' : 'POKONAJ GOBIEGO'}
            </Text>
            <Text style={styles.primaryCopy}>
              {!missionUnlocked
                ? `Poznaj jeszcze ${Math.max(0, 3 - learnedCount)} ${Math.max(0, 3 - learnedCount) === 1 ? 'typ zadania' : 'typy zadań'}`
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
  statsRowCompact: { flexWrap: 'wrap' },
  stat: { flex: 1, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 18, padding: 16, alignItems: 'center' },
  statCompact: { flexBasis: '47%', minWidth: 120 },
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
