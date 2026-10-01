import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { getChild } from '../../../src/services/children';
import { getChildStats, type ChildStats } from '../../../src/services/stats';
import { MECHANIC_LABELS } from '../../../src/domain/tasks/labels';
import {
  responsiveHeadingSize,
  screenHorizontalPadding
} from '../../../src/domain/layout/responsive';
import { colors } from '../../../src/theme';

const CATEGORY_LABELS: Record<string, string> = {
  math: 'Matematyka',
  logic: 'Logika',
  coding: 'Kodowanie',
  memory: 'Pamięć'
};

export default function ChildReportRoute() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const { width } = useWindowDimensions();
  const [childName, setChildName] = useState('');
  const [stats, setStats] = useState<ChildStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!childId) return;

    Promise.all([getChild(childId), getChildStats(childId)])
      .then(([child, nextStats]) => {
        setChildName(child.display_name);
        setStats(nextStats);
      })
      .catch((nextError) => {
        console.error(nextError);
        setError('Nie udało się przygotować raportu.');
      });
  }, [childId]);

  const insights = useMemo(() => {
    if (!stats) return null;

    const eligibleCategories = stats.categories.filter((item) => item.total >= 5);
    const sortedCategories = [...eligibleCategories].sort(
      (a, b) => b.accuracy - a.accuracy
    );

    const eligibleMechanics = stats.mechanics.filter((item) => item.total >= 3);
    const sortedMechanics = [...eligibleMechanics].sort(
      (a, b) => b.accuracy - a.accuracy
    );

    return {
      strongest: sortedCategories[0] ?? null,
      weakest:
        sortedCategories.length > 1
          ? sortedCategories[sortedCategories.length - 1]
          : null,
      strongestMechanic: sortedMechanics[0] ?? null,
      weakestMechanic:
        sortedMechanics.length > 1
          ? sortedMechanics[sortedMechanics.length - 1]
          : null
    };
  }, [stats]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: screenHorizontalPadding(width) }
        ]}
      >
        <Pressable onPress={() => router.replace(`/children/${childId}`)}>
          <Text style={styles.back}>← Wróć do profilu</Text>
        </Pressable>

        <Text style={styles.kicker}>RAPORT EDUKACYJNY</Text>
        <Text
          style={[
            styles.title,
            { fontSize: responsiveHeadingSize(width, 40, 32) }
          ]}
        >
          {childName || 'Raport'}
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!stats && !error ? <Text style={styles.meta}>Analizuję wyniki...</Text> : null}

        {stats ? (
          <>
            <View style={styles.summary}>
              <Text style={styles.summaryTitle}>Na podstawie dotychczasowej aktywności</Text>
              <Text style={styles.summaryText}>
                {stats.totalTasks
                  ? `Eduli ma już dane z ${stats.totalTasks} wykonanych zadań.`
                  : 'Nie ma jeszcze wystarczających danych z rozwiązanych zadań.'}
              </Text>
            </View>

            {insights?.strongest ? (
              <View style={styles.insights}>
                <View style={styles.insightCard}>
                  <Text style={styles.insightLabel}>Mocny obszar</Text>
                  <Text style={styles.insightTitle}>
                    {CATEGORY_LABELS[insights.strongest.category] ?? insights.strongest.category}
                  </Text>
                  <Text style={styles.insightText}>
                    {insights.strongest.accuracy}% odpowiedzi poprawnych za pierwszym razem.
                  </Text>
                </View>

                {insights.weakest ? (
                  <View style={styles.insightCard}>
                    <Text style={styles.insightLabel}>Obszar do dalszego ćwiczenia</Text>
                    <Text style={styles.insightTitle}>
                      {CATEGORY_LABELS[insights.weakest.category] ?? insights.weakest.category}
                    </Text>
                    <Text style={styles.insightText}>
                      {insights.weakest.accuracy}% odpowiedzi poprawnych za pierwszym razem.
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : (
              <View style={styles.notice}>
                <Text style={styles.noticeText}>
                  Potrzebujemy co najmniej 5 zadań w kategorii, żeby wskazywać mocniejsze i słabsze obszary.
                </Text>
              </View>
            )}

            {insights?.strongestMechanic || insights?.weakestMechanic ? (
              <>
                <Text style={styles.sectionTitle}>Typy zadań</Text>
                <View style={styles.insights}>
                  {insights.strongestMechanic ? (
                    <View style={styles.insightCard}>
                      <Text style={styles.insightLabel}>Najlepiej opanowane</Text>
                      <Text style={styles.insightTitle}>
                        {MECHANIC_LABELS[insights.strongestMechanic.taskType] ??
                          insights.strongestMechanic.taskType}
                      </Text>
                      <Text style={styles.insightText}>
                        {insights.strongestMechanic.accuracy}% poprawnie za pierwszym razem
                        przy {insights.strongestMechanic.total} zadaniach.
                      </Text>
                    </View>
                  ) : null}

                  {insights.weakestMechanic ? (
                    <View style={styles.insightCard}>
                      <Text style={styles.insightLabel}>Warto poćwiczyć</Text>
                      <Text style={styles.insightTitle}>
                        {MECHANIC_LABELS[insights.weakestMechanic.taskType] ??
                          insights.weakestMechanic.taskType}
                      </Text>
                      <Text style={styles.insightText}>
                        {insights.weakestMechanic.accuracy}% poprawnie za pierwszym razem
                        przy {insights.weakestMechanic.total} zadaniach.
                      </Text>
                    </View>
                  ) : null}
                </View>
              </>
            ) : null}

            <Text style={styles.sectionTitle}>Kategorie</Text>
            <View style={styles.list}>
              {stats.categories.map((category) => (
                <View key={category.category} style={styles.row}>
                  <View style={styles.rowCopy}>
                    <Text style={styles.rowTitle}>
                      {CATEGORY_LABELS[category.category] ?? category.category}
                    </Text>
                    <Text style={styles.rowMeta}>{category.total} zadań</Text>
                  </View>
                  <Text style={styles.rowValue}>{category.accuracy}%</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, width: '100%', maxWidth: 760, alignSelf: 'center', padding: 24 },
  back: { color: colors.muted, fontWeight: '800', marginBottom: 24 },
  kicker: { color: colors.accentDark, fontSize: 12, fontWeight: '900' },
  title: { color: colors.text, fontSize: 40, fontWeight: '900', marginTop: 8, marginBottom: 22 },
  summary: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 20, padding: 18 },
  summaryTitle: { color: colors.text, fontWeight: '900', fontSize: 18 },
  summaryText: { color: colors.muted, lineHeight: 21, marginTop: 6 },
  insights: { gap: 10, marginTop: 16 },
  insightCard: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 20, padding: 18 },
  insightLabel: { color: colors.accentDark, fontSize: 12, fontWeight: '900' },
  insightTitle: { color: colors.text, fontSize: 23, fontWeight: '900', marginTop: 6 },
  insightText: { color: colors.muted, marginTop: 4 },
  notice: { backgroundColor: '#FFF8E8', borderRadius: 18, padding: 16, marginTop: 16 },
  noticeText: { color: colors.text, lineHeight: 21 },
  sectionTitle: { color: colors.text, fontSize: 24, fontWeight: '900', marginTop: 30, marginBottom: 12 },
  list: { gap: 10 },
  row: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  rowCopy: { flex: 1, minWidth: 0 },
  rowTitle: { color: colors.text, fontSize: 17, fontWeight: '900', flexShrink: 1 },
  rowMeta: { color: colors.muted, marginTop: 3 },
  rowValue: { color: colors.accentDark, fontSize: 22, fontWeight: '900', flexShrink: 0 },
  meta: { color: colors.muted },
  error: { color: colors.danger }
});
