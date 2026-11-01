import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import {
  responsiveHeadingSize,
  screenHorizontalPadding
} from '../../../src/domain/layout/responsive';
import { MECHANIC_LABELS } from '../../../src/domain/tasks/labels';
import { getChild } from '../../../src/services/children';
import { getMechanicProgress } from '../../../src/services/progress';
import { colors } from '../../../src/theme';
import type { Child } from '../../../src/types/models';

export default function ParentChildProfileRoute() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const { width } = useWindowDimensions();
  const [child, setChild] = useState<Child | null>(null);
  const [learnedTypes, setLearnedTypes] = useState<string[]>([]);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (!childId) return;

      setError('');

      Promise.all([
        getChild(childId),
        getMechanicProgress(childId)
      ])
        .then(([nextChild, rows]) => {
          setChild(nextChild);
          setLearnedTypes(
            [...new Set(
              rows
                .filter((row) => row.training_status === 'learned')
                .map((row) => row.task_type)
            )].sort()
          );
        })
        .catch((nextError) => {
          console.error(nextError);
          setError('Nie udało się wczytać profilu dziecka.');
        });
    }, [childId])
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: screenHorizontalPadding(width) }
        ]}
      >
        <Pressable onPress={() => router.replace('/')}>
          <Text style={styles.back}>← Wróć do dzieci</Text>
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!child && !error ? <Text style={styles.meta}>Wczytuję profil...</Text> : null}

        {child ? (
          <View style={styles.card}>
            <Text style={styles.kicker}>PROFIL DZIECKA - WIDOK RODZICA</Text>
            <Text
              style={[
                styles.title,
                { fontSize: responsiveHeadingSize(width, 40, 32) }
              ]}
            >
              {child.display_name}
            </Text>
            <Text style={styles.meta}>Data urodzenia: {child.birth_date ?? 'brak'}</Text>
            <Text style={styles.meta}>Kod dziecka: {child.share_code ?? 'brak'}</Text>

            <View style={styles.progressDebug}>
              <Text style={styles.progressDebugTitle}>
                Poznane typy: {learnedTypes.length}/3
              </Text>
              {learnedTypes.length ? (
                learnedTypes.map((taskType) => (
                  <Text key={taskType} style={styles.progressDebugItem}>
                    ✓ {MECHANIC_LABELS[taskType] ?? taskType}
                  </Text>
                ))
              ) : (
                <Text style={styles.progressDebugEmpty}>
                  Brak typów zapisanych jako poznane.
                </Text>
              )}
            </View>

            <View style={styles.actions}>
              <Pressable
                style={styles.primary}
                onPress={() => router.push(`/children/${child.id}/play`)}
              >
                <Text style={styles.primaryText}>PRZEKAŻ TELEFON DZIECKU</Text>
              </Pressable>
              <Pressable
                style={styles.secondary}
                onPress={() => router.push(`/children/${child.id}/stats`)}
              >
                <Text style={styles.secondaryText}>STATYSTYKI</Text>
              </Pressable>
              <Pressable
                style={styles.secondary}
                onPress={() => router.push(`/children/${child.id}/report`)}
              >
                <Text style={styles.secondaryText}>RAPORT</Text>
              </Pressable>
              <Pressable
                style={styles.secondary}
                onPress={() => router.push(`/children/${child.id}/edit`)}
              >
                <Text style={styles.secondaryText}>EDYTUJ PROFIL</Text>
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
  progressDebug: {
    marginTop: 22,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#F6F7F5',
    padding: 16
  },
  progressDebugTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900'
  },
  progressDebugItem: {
    color: colors.text,
    marginTop: 8,
    fontWeight: '700'
  },
  progressDebugEmpty: {
    color: colors.muted,
    marginTop: 8
  },
  actions: { gap: 10, marginTop: 28 },
  primary: { backgroundColor: colors.accent, borderRadius: 18, padding: 16, alignItems: 'center' },
  primaryText: { color: '#FFF', fontSize: 17, fontWeight: '900' },
  secondary: { borderColor: colors.border, borderWidth: 2, borderRadius: 18, padding: 14, alignItems: 'center', backgroundColor: colors.card },
  secondaryText: { color: colors.text, fontSize: 16, fontWeight: '900' },
  error: { color: colors.danger }
});
