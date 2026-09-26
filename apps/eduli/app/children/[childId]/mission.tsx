import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../../src/theme';

export default function MissionRoute() {
  const { childId } = useLocalSearchParams<{ childId: string }>();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.wrap}>
        <View style={styles.card}>
          <Text style={styles.kicker}>MISJA Z GOBIM</Text>
          <Text style={styles.title}>Silnik misji jest następny</Text>
          <Text style={styles.copy}>
            Routing i tryb dziecka są już rozdzielone. Teraz przenosimy punktację,
            podpowiedzi, zapis sesji i 10 zadań z obecnego prototypu.
          </Text>

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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  wrap: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  card: { width: '100%', maxWidth: 560, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 28, padding: 28 },
  kicker: { color: colors.accentDark, fontSize: 12, fontWeight: '900' },
  title: { color: colors.text, fontSize: 36, lineHeight: 40, fontWeight: '900', marginTop: 10 },
  copy: { color: colors.muted, fontSize: 17, lineHeight: 24, marginTop: 12 },
  secondary: { borderColor: colors.border, borderWidth: 2, borderRadius: 18, padding: 15, alignItems: 'center', marginTop: 28 },
  secondaryText: { color: colors.text, fontWeight: '900' }
});
