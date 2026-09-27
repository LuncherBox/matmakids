import { router, useLocalSearchParams } from 'expo-router';
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View
} from 'react-native';

import { colors } from '../../../../src/theme';

export default function OnboardingMissionRoute() {
  const { childId } = useLocalSearchParams<{ childId: string }>();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.wrap}>
        <View style={styles.card}>
          <View style={styles.gobi}>
            <Text style={styles.gobiText}>G</Text>
          </View>

          <Text style={styles.kicker}>PIERWSZA MISJA</Text>
          <Text style={styles.title}>Gotowy na Gobiego?</Text>
          <Text style={styles.copy}>
            Czeka 10 zadań z typów, które już znasz. Zdobywaj punkty i pamiętaj,
            że po błędzie zawsze możesz spróbować jeszcze raz.
          </Text>

          <Pressable
            style={styles.primary}
            onPress={() =>
              router.replace({
                pathname: `/children/${childId}/mission`,
                params: { onboarding: '1' }
              })
            }
          >
            <Text style={styles.primaryText}>START MISJI</Text>
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
  wrap: { flex: 1, width: '100%', maxWidth: 620, alignSelf: 'center', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 28, padding: 28, alignItems: 'center' },
  gobi: { width: 86, height: 86, borderRadius: 43, backgroundColor: '#D9E8D9', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  gobiText: { color: colors.accentDark, fontSize: 34, fontWeight: '900' },
  kicker: { color: colors.accentDark, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  title: { color: colors.text, fontSize: 36, lineHeight: 40, fontWeight: '900', textAlign: 'center', marginTop: 8 },
  copy: { color: colors.muted, fontSize: 17, lineHeight: 25, textAlign: 'center', marginTop: 12 },
  primary: { width: '100%', backgroundColor: colors.accent, borderRadius: 18, padding: 17, alignItems: 'center', marginTop: 26 },
  primaryText: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  back: { color: colors.muted, fontWeight: '700', marginTop: 18 }
});
