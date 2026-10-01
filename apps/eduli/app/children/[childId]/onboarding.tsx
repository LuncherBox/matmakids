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
} from '../../../src/domain/layout/responsive';
import { getChild } from '../../../src/services/children';
import { setChildOnboardingStage } from '../../../src/services/onboarding';
import { colors } from '../../../src/theme';

const STEPS = [
  {
    kicker: 'WITAJ W EDULI',
    title: 'Tutaj ćwiczysz i zdobywasz nowe umiejętności',
    copy: 'Zadania są krótkie. Jeśli czegoś jeszcze nie znasz, najpierw pokażemy Ci, jak to działa.'
  },
  {
    kicker: 'POZNAJ GOBIEGO',
    title: 'Gobi czeka na Twoje misje',
    copy: 'Najpierw poznajesz nowe zadania i ćwiczysz. Potem możesz zmierzyć się z Gobim.'
  },
  {
    kicker: 'JAK DZIAŁAJĄ ZADANIA',
    title: 'Jedno zadanie na ekranie',
    copy: 'Wybierasz albo układasz odpowiedź i sprawdzasz wynik. Jeśli się pomylisz, możesz spróbować ponownie.'
  },
  {
    kicker: 'MISJA',
    title: 'W misji czeka 10 zadań',
    copy: 'Za dobre odpowiedzi zdobywasz punkty. Podpowiedź może pomóc, ale kosztuje jedną z możliwych do zdobycia monet.'
  }
];

export default function ChildOnboardingRoute() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const { width } = useWindowDimensions();
  const [name, setName] = useState('');
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!childId) return;

    getChild(childId)
      .then((child) => setName(child.display_name))
      .catch((error) => console.error(error));
  }, [childId]);

  const current = STEPS[step];
  const last = step === STEPS.length - 1;

  async function next() {
    if (!last) {
      setStep((currentStep) => currentStep + 1);
      return;
    }

    if (!childId || busy) return;

    setBusy(true);

    try {
      await setChildOnboardingStage(childId, 'training');
      router.replace(`/children/${childId}/onboarding/training`);
    } catch (error) {
      console.error(error);
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View
        style={[
          styles.wrap,
          { paddingHorizontal: screenHorizontalPadding(width) }
        ]}
      >
        <View style={styles.progress}>
          {STEPS.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index <= step ? styles.progressDotActive : null
              ]}
            />
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.kicker}>{current.kicker}</Text>

          {step === 0 && name ? (
            <Text style={styles.name}>Cześć, {name}!</Text>
          ) : null}

          {step === 1 ? (
            <View style={styles.gobi}>
              <Text style={styles.gobiText}>G</Text>
            </View>
          ) : null}

          <Text
            style={[
              styles.title,
              {
                fontSize: responsiveHeadingSize(width, 34, 30),
                lineHeight: responsiveHeadingSize(width, 39, 34)
              }
            ]}
          >
            {current.title}
          </Text>
          <Text style={styles.copy}>{current.copy}</Text>

          <Pressable style={styles.primary} onPress={next} disabled={busy}>
            <Text style={styles.primaryText}>
              {last ? (busy ? 'CHWILA...' : 'CZAS NA TRENING') : 'DALEJ'}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  wrap: { flex: 1, width: '100%', maxWidth: 620, alignSelf: 'center', padding: 24, justifyContent: 'center' },
  progress: { flexDirection: 'row', gap: 7, alignSelf: 'center', marginBottom: 18 },
  progressDot: { width: 28, height: 6, borderRadius: 3, backgroundColor: '#DDE2DE' },
  progressDotActive: { backgroundColor: colors.accent },
  card: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 28, padding: 28, alignItems: 'center' },
  kicker: { color: colors.accentDark, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  name: { color: colors.text, fontSize: 22, fontWeight: '900', marginTop: 16 },
  gobi: { width: 78, height: 78, borderRadius: 39, backgroundColor: '#D9E8D9', alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  gobiText: { color: colors.accentDark, fontSize: 32, fontWeight: '900' },
  title: { color: colors.text, fontSize: 34, lineHeight: 39, fontWeight: '900', textAlign: 'center', marginTop: 18 },
  copy: { color: colors.muted, fontSize: 17, lineHeight: 25, textAlign: 'center', marginTop: 12 },
  primary: { width: '100%', backgroundColor: colors.accent, borderRadius: 18, padding: 17, alignItems: 'center', marginTop: 28 },
  primaryText: { color: '#FFF', fontSize: 17, fontWeight: '900' }
});
