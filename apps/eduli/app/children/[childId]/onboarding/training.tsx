import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
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
  responsiveHeadingSize,
  screenHorizontalPadding
} from '../../../../src/domain/layout/responsive';
import { MISSION_UNLOCK_SKILL_BANDS } from '../../../../src/domain/progression/model';
import { getProgressionState } from '../../../../src/services/progression';
import { setChildOnboardingStage } from '../../../../src/services/onboarding';
import { colors } from '../../../../src/theme';

const REQUIRED = MISSION_UNLOCK_SKILL_BANDS;

const CATEGORIES = [
  ['math', 'Matematyka'],
  ['logic', 'Logika'],
  ['coding', 'Kodowanie']
] as const;

export default function OnboardingTrainingRoute() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const { width } = useWindowDimensions();
  const [learnedCount, setLearnedCount] = useState(0);
  const [missionUnlocked, setMissionUnlocked] = useState(false);
  const [busy, setBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!childId) return;

      getProgressionState(childId)
        .then((progression) => {
          setLearnedCount(progression.learnedUnits);
          setMissionUnlocked(progression.missionUnlocked);
        })
        .catch((error) => console.error(error));
    }, [childId])
  );

  const complete = missionUnlocked;

  async function continueToMission() {
    if (!childId || !complete || busy) return;

    setBusy(true);

    try {
      await setChildOnboardingStage(childId, 'mission');
      router.replace(`/children/${childId}/onboarding/mission`);
    } catch (error) {
      console.error(error);
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: screenHorizontalPadding(width) }
        ]}
      >
        <Text style={styles.kicker}>TWÓJ PIERWSZY TRENING</Text>
        <Text
          style={[
            styles.title,
            {
              fontSize: responsiveHeadingSize(width, 38, 32),
              lineHeight: responsiveHeadingSize(width, 42, 36)
            }
          ]}
        >
          Poznaj {REQUIRED} typy zadań
        </Text>
        <Text style={styles.copy}>
          Każdy nowy typ zaczyna się od krótkiego treningu. Kiedy poznasz trzy,
          odblokujemy pierwszą misję z Gobim.
        </Text>

        <View style={styles.progressCard}>
          <Text style={styles.progressValue}>
            {Math.min(learnedCount, REQUIRED)}/{REQUIRED}
          </Text>
          <Text style={styles.progressLabel}>poznane typy zadań</Text>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(
                    100,
                    (learnedCount / REQUIRED) * 100
                  )}%`
                }
              ]}
            />
          </View>
        </View>

        {!complete ? (
          <>
            <Text style={styles.sectionTitle}>Wybierz, co chcesz poznać</Text>
            <View style={styles.categoryList}>
              {CATEGORIES.map(([key, label]) => (
                <Pressable
                  key={key}
                  style={styles.categoryCard}
                  onPress={() =>
                    router.push({
                      pathname: `/children/${childId}/practice/${key}`,
                      params: { returnTo: 'onboarding' }
                    })
                  }
                >
                  <Text style={styles.categoryTitle}>{label}</Text>
                  <Text style={styles.arrow}>›</Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : (
          <View style={styles.unlockedCard}>
            <Text style={styles.unlockedLabel}>MISJA ODBLOKOWANA</Text>
            <Text style={styles.unlockedTitle}>Gobi już czeka</Text>
            <Text style={styles.unlockedCopy}>
              Znasz już trzy typy zadań. Możesz przejść do pierwszej misji.
            </Text>

            <Pressable
              style={styles.primary}
              onPress={continueToMission}
              disabled={busy}
            >
              <Text style={styles.primaryText}>
                {busy ? 'CHWILA...' : 'PRZEJDŹ DO MISJI'}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, width: '100%', maxWidth: 680, alignSelf: 'center', padding: 24 },
  kicker: { color: colors.accentDark, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  title: { color: colors.text, fontSize: 38, lineHeight: 42, fontWeight: '900', marginTop: 8 },
  copy: { color: colors.muted, fontSize: 17, lineHeight: 24, marginTop: 10 },
  progressCard: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 22, padding: 20, marginTop: 24 },
  progressValue: { color: colors.text, fontSize: 34, fontWeight: '900' },
  progressLabel: { color: colors.muted, marginTop: 2 },
  progressTrack: { height: 9, borderRadius: 999, backgroundColor: '#E4E8E5', marginTop: 14, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: colors.accent },
  sectionTitle: { color: colors.text, fontSize: 22, fontWeight: '900', marginTop: 28, marginBottom: 12 },
  categoryList: { gap: 10 },
  categoryCard: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 20, padding: 19, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  categoryTitle: { color: colors.text, fontSize: 19, fontWeight: '900' },
  arrow: { color: colors.muted, fontSize: 30 },
  unlockedCard: { backgroundColor: '#FFF8E8', borderRadius: 24, padding: 22, marginTop: 26 },
  unlockedLabel: { color: '#9A741B', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  unlockedTitle: { color: colors.text, fontSize: 28, fontWeight: '900', marginTop: 7 },
  unlockedCopy: { color: colors.muted, fontSize: 16, lineHeight: 23, marginTop: 7 },
  primary: { backgroundColor: colors.accent, borderRadius: 18, padding: 16, alignItems: 'center', marginTop: 20 },
  primaryText: { color: '#FFF', fontSize: 17, fontWeight: '900' }
});
