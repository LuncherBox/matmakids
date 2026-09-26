import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { supabase } from '../../../src/lib/supabase';
import { colors } from '../../../src/theme';
import type { Child } from '../../../src/types/models';

export default function ParentChildProfileRoute() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const [child, setChild] = useState<Child | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!childId) return;

    supabase
      .from('children')
      .select('id, display_name, birth_date, share_code, gobi_level, created_at')
      .eq('id', childId)
      .single()
      .then(({ data, error: nextError }) => {
        if (nextError) {
          setError('Nie udało się wczytać profilu dziecka.');
          return;
        }

        setChild(data as Child);
      });
  }, [childId]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.replace('/')}>
          <Text style={styles.back}>← Wróć do dzieci</Text>
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!child && !error ? <Text style={styles.meta}>Wczytuję profil...</Text> : null}

        {child ? (
          <View style={styles.card}>
            <Text style={styles.kicker}>PROFIL DZIECKA - WIDOK RODZICA</Text>
            <Text style={styles.title}>{child.display_name}</Text>
            <Text style={styles.meta}>Data urodzenia: {child.birth_date ?? 'brak'}</Text>
            <Text style={styles.meta}>Kod dziecka: {child.share_code ?? 'brak'}</Text>

            <View style={styles.actions}>
              <Pressable style={styles.primary}>
                <Text style={styles.primaryText}>PRZEKAŻ TELEFON DZIECKU</Text>
              </Pressable>
              <Pressable style={styles.secondary}>
                <Text style={styles.secondaryText}>STATYSTYKI</Text>
              </Pressable>
              <Pressable style={styles.secondary}>
                <Text style={styles.secondaryText}>RAPORT</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, width: '100%', maxWidth: 760, alignSelf: 'center', padding: 24 },
  back: { color: colors.muted, fontWeight: '800', marginBottom: 24 },
  card: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 26, padding: 24 },
  kicker: { color: colors.accentDark, fontSize: 12, fontWeight: '900' },
  title: { color: colors.text, fontSize: 40, fontWeight: '900', marginTop: 10 },
  meta: { color: colors.muted, fontSize: 16, marginTop: 8 },
  actions: { gap: 10, marginTop: 28 },
  primary: { backgroundColor: colors.accent, borderRadius: 18, padding: 16, alignItems: 'center' },
  primaryText: { color: '#FFF', fontSize: 17, fontWeight: '900' },
  secondary: { borderColor: colors.border, borderWidth: 2, borderRadius: 18, padding: 14, alignItems: 'center', backgroundColor: colors.card },
  secondaryText: { color: colors.text, fontSize: 16, fontWeight: '900' },
  error: { color: colors.danger }
});
