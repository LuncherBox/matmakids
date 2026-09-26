import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../../src/theme';

const CATEGORIES = [
  { key: 'math', label: 'Matematyka' },
  { key: 'logic', label: 'Logika' },
  { key: 'coding', label: 'Kodowanie' },
  { key: 'memory', label: 'Pamięć' }
];

export default function PracticeRoute() {
  const { childId } = useLocalSearchParams<{ childId: string }>();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.replace(`/children/${childId}/home`)}>
          <Text style={styles.back}>← Wróć</Text>
        </Pressable>

        <Text style={styles.title}>Ćwicz</Text>
        <Text style={styles.subtitle}>Wybierz kategorię.</Text>

        <View style={styles.list}>
          {CATEGORIES.map((category) => (
            <Pressable
              key={category.key}
              style={styles.card}
              onPress={() =>
                router.push(`/children/${childId}/practice/${category.key}`)
              }
            >
              <Text style={styles.cardTitle}>{category.label}</Text>
              <Text style={styles.arrow}>›</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, width: '100%', maxWidth: 680, alignSelf: 'center', padding: 24 },
  back: { color: colors.muted, fontWeight: '800', marginBottom: 24 },
  title: { color: colors.text, fontSize: 40, fontWeight: '900' },
  subtitle: { color: colors.muted, fontSize: 17, marginTop: 6, marginBottom: 24 },
  list: { gap: 10 },
  card: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { color: colors.text, fontSize: 19, fontWeight: '900' },
  arrow: { color: colors.muted, fontSize: 30 }
});
