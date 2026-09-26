import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../../../src/theme';

const CATEGORY_LABELS: Record<string, string> = {
  math: 'Matematyka',
  logic: 'Logika',
  coding: 'Kodowanie',
  memory: 'Pamięć'
};

export default function PracticeCategoryRoute() {
  const { childId, category } = useLocalSearchParams<{
    childId: string;
    category: string;
  }>();

  const label = CATEGORY_LABELS[category] ?? category;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.replace(`/children/${childId}/practice`)}>
          <Text style={styles.back}>← Wróć do kategorii</Text>
        </Pressable>

        <Text style={styles.kicker}>ĆWICZ</Text>
        <Text style={styles.title}>{label}</Text>
        <Text style={styles.copy}>
          Tutaj przeniesiemy listę typów zadań i treningów z obecnego silnika.
        </Text>

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Następny etap migracji</Text>
          <Text style={styles.noticeText}>
            Mechaniki, status „nowe / nauczone” i treningi będą korzystać z tego samego
            child_task_type_progress w Supabase.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, width: '100%', maxWidth: 680, alignSelf: 'center', padding: 24 },
  back: { color: colors.muted, fontWeight: '800', marginBottom: 24 },
  kicker: { color: colors.accentDark, fontSize: 12, fontWeight: '900' },
  title: { color: colors.text, fontSize: 40, fontWeight: '900', marginTop: 8 },
  copy: { color: colors.muted, fontSize: 17, lineHeight: 24, marginTop: 10 },
  notice: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 20, padding: 20, marginTop: 24 },
  noticeTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  noticeText: { color: colors.muted, lineHeight: 22, marginTop: 8 }
});
