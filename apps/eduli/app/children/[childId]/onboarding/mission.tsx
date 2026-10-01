import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
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
import { getChild } from '../../../../src/services/children';
import { getProgressionState } from '../../../../src/services/progression';
import { colors } from '../../../../src/theme';

const REQUIRED = MISSION_UNLOCK_SKILL_BANDS;

export default function OnboardingMissionRoute() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const { width } = useWindowDimensions();
  const [name, setName] = useState('');
  const [learnedCount, setLearnedCount] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!childId) return;

    Promise.all([getChild(childId), getProgressionState(childId)])
      .then(([child, progression]) => {
        setName(child.display_name);
        setLearnedCount(progression.learnedUnits);
        setUnlocked(progression.missionUnlocked);
      })
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));
  }, [childId]);


  return (
    <SafeAreaView style={styles.safe}>
      <View
        style={[
          styles.wrap,
          { paddingHorizontal: screenHorizontalPadding(width) }
        ]}
      >
        <View style={styles.card}>
          <Text style={styles.kicker}>PIERWSZA MISJA</Text>

          <View style={styles.gobi}>
            <Text style={styles.gobiText}>G</Text>
          </View>

          <Text
            style={[
              styles.title,
              {
                fontSize: responsiveHeadingSize(width, 34, 30),
                lineHeight: responsiveHeadingSize(width, 39, 34)
              }
            ]}
          >
            {name ? `${name}, Gobi już czeka!` : 'Gobi już czeka!'}
          </Text>

          <Text style={styles.copy}>
            Przed Tobą 10 zadań z poznanych typów. Za każdą odpowiedź możesz
            zdobyć punkty. Jeśli czegoś nie wiesz, możesz skorzystać z podpowiedzi.
          </Text>

          <View style={styles.rules}>
            <View style={styles.rule}>
              <Text style={styles.ruleValue}>10</Text>
              <Text style={styles.ruleLabel}>zadań w misji</Text>
            </View>
            <View style={styles.rule}>
              <Text style={styles.ruleValue}>2</Text>
              <Text style={styles.ruleLabel}>punkty za idealną odpowiedź</Text>
            </View>
            <View style={styles.rule}>
              <Text style={styles.ruleValue}>1</Text>
              <Text style={styles.ruleLabel}>moneta za podpowiedź</Text>
            </View>
          </View>

          {!loading && !unlocked ? (
            <Text style={styles.warning}>
              Najpierw poznaj jeszcze {Math.max(0, REQUIRED - learnedCount)}
              {REQUIRED - learnedCount === 1 ? ' typ zadania.' : ' typy zadań.'}
            </Text>
          ) : null}

          <Pressable
            style={[
              styles.primary,
              !unlocked || loading ? styles.primaryDisabled : null
            ]}
            disabled={!unlocked || loading}
            onPress={() =>
              router.replace({
                pathname: `/children/${childId}/mission`,
                params: { onboarding: '1' }
              })
            }
          >
            <Text style={styles.primaryText}>
              {loading ? 'CHWILA...' : 'ZACZYNAM PIERWSZĄ MISJĘ'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() =>
              router.replace(`/children/${childId}/onboarding/training`)
            }
          >
            <Text style={styles.back}>Wróć do treningu</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  wrap: {
    flex: 1,
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    padding: 24,
    justifyContent: 'center'
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 28,
    padding: 28,
    alignItems: 'center'
  },
  kicker: {
    color: colors.accentDark,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1
  },
  gobi: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#D9E8D9',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20
  },
  gobiText: {
    color: colors.accentDark,
    fontSize: 34,
    fontWeight: '900'
  },
  title: {
    color: colors.text,
    fontSize: 34,
    lineHeight: 39,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 18
  },
  copy: {
    color: colors.muted,
    fontSize: 17,
    lineHeight: 25,
    textAlign: 'center',
    marginTop: 12
  },
  rules: {
    width: '100%',
    gap: 10,
    marginTop: 24
  },
  rule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F5F7F5',
    borderRadius: 16,
    padding: 14
  },
  ruleValue: {
    minWidth: 34,
    color: colors.text,
    fontSize: 24,
    fontWeight: '900'
  },
  ruleLabel: {
    flex: 1,
    color: colors.muted,
    fontSize: 15,
    lineHeight: 20
  },
  warning: {
    color: colors.danger,
    textAlign: 'center',
    fontWeight: '800',
    marginTop: 18
  },
  primary: {
    width: '100%',
    backgroundColor: colors.accent,
    borderRadius: 18,
    padding: 17,
    alignItems: 'center',
    marginTop: 24
  },
  primaryDisabled: {
    opacity: 0.45
  },
  primaryText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '900'
  },
  back: {
    color: colors.muted,
    textAlign: 'center',
    fontWeight: '700',
    marginTop: 18
  }
});
