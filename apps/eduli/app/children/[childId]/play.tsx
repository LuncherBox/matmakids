import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { getChild } from '../../../src/services/children';
import { getChildOnboardingState } from '../../../src/services/onboarding';
import { colors } from '../../../src/theme';

export default function ChildHandoffRoute() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const [name, setName] = useState('');
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    if (!childId) return;

    getChild(childId)
      .then((child) => setName(child.display_name))
      .catch((error) => console.error(error));
  }, [childId]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.wrap}>
        <View style={styles.card}>
          <Text style={styles.kicker}>TRYB DZIECKA</Text>
          <Text style={styles.title}>Czas na zabawę{name ? `, ${name}!` : '!'}</Text>
          <Text style={styles.copy}>
            Od tego momentu Eduli pokazuje tylko zadania, misje i wyniki dziecka.
          </Text>

          <Pressable
            style={styles.primary}
            disabled={opening}
            onPress={async () => {
              if (!childId || opening) return;

              setOpening(true);

              try {
                const onboarding = await getChildOnboardingState(childId);

                if (!onboarding.schemaReady || onboarding.completed) {
                  router.replace(`/children/${childId}/home`);
                  return;
                }

                if (onboarding.stage === 'training') {
                  router.replace(`/children/${childId}/onboarding/training`);
                  return;
                }

                if (onboarding.stage === 'mission') {
                  router.replace(`/children/${childId}/onboarding/mission`);
                  return;
                }

                router.replace(`/children/${childId}/onboarding`);
              } catch (error) {
                console.error(error);
                router.replace(`/children/${childId}/home`);
              }
            }}
          >
            <Text style={styles.primaryText}>
              {opening ? 'CHWILA...' : 'ZACZYNAMY'}
            </Text>
          </Pressable>

          <Pressable onPress={() => router.replace(`/children/${childId}`)}>
            <Text style={styles.back}>Wróć do profilu rodzica</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  wrap: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  card: { width: '100%', maxWidth: 560, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 28, padding: 28, alignItems: 'center' },
  kicker: { color: colors.accentDark, fontSize: 12, fontWeight: '900' },
  title: { color: colors.text, fontSize: 40, lineHeight: 44, textAlign: 'center', fontWeight: '900', marginTop: 12 },
  copy: { color: colors.muted, textAlign: 'center', fontSize: 17, lineHeight: 24, marginTop: 12, marginBottom: 28 },
  primary: { width: '100%', backgroundColor: colors.accent, borderRadius: 18, padding: 17, alignItems: 'center' },
  primaryText: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  back: { color: colors.muted, textAlign: 'center', fontWeight: '700', marginTop: 18 }
});
