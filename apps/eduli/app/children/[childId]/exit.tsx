import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../../src/theme';

export default function ChildExitRoute() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [holding, setHolding] = useState(false);

  function cancelHold() {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    setHolding(false);
  }

  function startHold() {
    cancelHold();
    setHolding(true);

    holdTimer.current = setTimeout(() => {
      holdTimer.current = null;
      setHolding(false);
      router.replace(`/children/${childId}`);
    }, 1200);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.wrap}>
        <View style={styles.card}>
          <Text style={styles.kicker}>POWRÓT DO RODZICA</Text>
          <Text style={styles.title}>To miejsce jest dla dorosłych</Text>
          <Text style={styles.copy}>
            Przytrzymaj przycisk przez chwilę, żeby wrócić do profilu rodzica.
          </Text>

          <Pressable
            style={[
              styles.parentButton,
              holding ? styles.parentButtonHolding : null
            ]}
            onPressIn={startHold}
            onPressOut={cancelHold}
          >
            <Text style={styles.parentButtonText}>
              {holding ? 'TRZYMAJ...' : 'PRZYTRZYMAJ, ABY WRÓCIĆ'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.replace(`/children/${childId}/home`)}
          >
            <Text style={styles.back}>Wróć do Eduli</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background
  },
  wrap: {
    flex: 1,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    justifyContent: 'center',
    padding: 24
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
  title: {
    color: colors.text,
    fontSize: 32,
    lineHeight: 37,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 10
  },
  copy: {
    color: colors.muted,
    fontSize: 17,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: 12
  },
  parentButton: {
    width: '100%',
    backgroundColor: colors.text,
    borderRadius: 18,
    padding: 17,
    alignItems: 'center',
    marginTop: 26
  },
  parentButtonHolding: {
    opacity: 0.78
  },
  parentButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900'
  },
  back: {
    color: colors.muted,
    fontWeight: '800',
    marginTop: 18
  }
});
