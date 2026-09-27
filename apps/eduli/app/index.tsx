import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../src/providers/AuthProvider';
import { logout } from '../src/services/auth';
import { listChildren } from '../src/services/children';
import { colors } from '../src/theme';
import type { Child } from '../src/types/models';

export default function HomeRoute() {
  const { session, loading: authLoading } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [childrenLoading, setChildrenLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session) {
      setChildren([]);
      return;
    }

    setChildrenLoading(true);
    listChildren()
      .then((data) => {
        setError('');
        setChildren(data);
      })
      .catch((nextError) => {
        console.error(nextError);
        setError('Nie udało się wczytać profili dzieci.');
        setChildren([]);
      })
      .finally(() => setChildrenLoading(false));
  }, [session]);

  if (authLoading || (session && childrenLoading)) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.accentDark} />
      </View>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.publicContent}>
          <View style={styles.publicTopbar}>
            <Text style={styles.brand}>Eduli</Text>
            <Pressable onPress={() => router.push('/login')}>
              <Text style={styles.publicTopLogin}>Zaloguj się</Text>
            </Pressable>
          </View>

          <View style={styles.hero}>
            <Text style={styles.pill}>Dla dzieci 4-8 lat</Text>
            <Text style={styles.heroTitle}>
              Krótkie ćwiczenia. Widoczny postęp.
            </Text>
            <Text style={styles.heroCopy}>
              Eduli pomaga ćwiczyć matematykę, logikę, pamięć i podstawy kodowania.
              Dziecko poznaje nowe typy zadań, trenuje je i odblokowuje misje z Gobim.
            </Text>

            <Pressable style={styles.primary} onPress={() => router.push('/demo')}>
              <Text style={styles.primaryText}>WYPRÓBUJ 10 ZADAŃ</Text>
            </Pressable>
            <Pressable style={styles.secondary} onPress={() => router.push('/register')}>
              <Text style={styles.secondaryText}>ZAŁÓŻ KONTO</Text>
            </Pressable>
            <Pressable style={styles.loginTextButton} onPress={() => router.push('/login')}>
              <Text style={styles.loginText}>Masz konto? Zaloguj się</Text>
            </Pressable>
          </View>

          <View style={styles.publicSection}>
            <Text style={styles.sectionKicker}>CO ĆWICZYMY</Text>
            <Text style={styles.sectionTitle}>Różne umiejętności w jednej aplikacji</Text>

            <View style={styles.publicCardGrid}>
              {[
                ['+', 'Matematyka', 'Liczenie, dodawanie, odejmowanie i liczby.'],
                ['◇', 'Logika', 'Sekwencje, wzory, sudoku i zależności.'],
                ['→', 'Kodowanie', 'Komendy, trasy i myślenie krok po kroku.'],
                ['●', 'Pamięć', 'Obrazki, położenie, pary i krótkie sekwencje.']
              ].map(([icon, title, copy]) => (
                <View key={title} style={styles.publicInfoCard}>
                  <View style={styles.publicIcon}>
                    <Text style={styles.publicIconText}>{icon}</Text>
                  </View>
                  <Text style={styles.publicCardTitle}>{title}</Text>
                  <Text style={styles.publicCardCopy}>{copy}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.publicSection}>
            <Text style={styles.sectionKicker}>PRZYKŁADOWE ZADANIA</Text>
            <Text style={styles.sectionTitle}>Jedno zadanie na ekranie</Text>

            <View style={styles.exampleList}>
              <View style={styles.exampleCard}>
                <Text style={styles.exampleLabel}>MATEMATYKA</Text>
                <Text style={styles.exampleTask}>7 + 5 = ?</Text>
                <Text style={styles.exampleCopy}>Policz i wybierz wynik.</Text>
              </View>

              <View style={styles.exampleCard}>
                <Text style={styles.exampleLabel}>LOGIKA</Text>
                <Text style={styles.exampleTask}>🔵 🟡 🔵 🟡 ?</Text>
                <Text style={styles.exampleCopy}>Co powinno być dalej?</Text>
              </View>

              <View style={styles.exampleCard}>
                <Text style={styles.exampleLabel}>KODOWANIE</Text>
                <Text style={styles.exampleTask}>↑ → ↑ → ?</Text>
                <Text style={styles.exampleCopy}>Znajdź kolejną komendę.</Text>
              </View>
            </View>
          </View>

          <View style={styles.gobiCard}>
            <View style={styles.gobiBadge}>
              <Text style={styles.gobiBadgeText}>G</Text>
            </View>
            <View style={styles.gobiCopyWrap}>
              <Text style={styles.sectionKicker}>POZNAJ GOBIEGO</Text>
              <Text style={styles.gobiTitle}>Nauka prowadzi do wyzwania</Text>
              <Text style={styles.publicCardCopy}>
                Po poznaniu kolejnych umiejętności dziecko odblokowuje misję.
                W 10 zadaniach zdobywa punkty i mierzy się z Gobim.
              </Text>
            </View>
          </View>

          <View style={styles.publicSection}>
            <Text style={styles.sectionKicker}>JAK TO DZIAŁA</Text>
            <View style={styles.steps}>
              {[
                ['1', 'Poznaj', 'Krótki trening pokazuje nowy typ zadania.'],
                ['2', 'Ćwicz', 'Dziecko wraca do poznanych mechanik i je utrwala.'],
                ['3', 'Misja', 'Po odblokowaniu czeka 10-zadaniowy pojedynek z Gobim.']
              ].map(([number, title, copy]) => (
                <View key={number} style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{number}</Text>
                  </View>
                  <View style={styles.stepCopy}>
                    <Text style={styles.publicCardTitle}>{title}</Text>
                    <Text style={styles.publicCardCopy}>{copy}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.publicBottomCta}>
            <Text style={styles.sectionTitle}>Sprawdź Eduli bez zakładania konta</Text>
            <Text style={styles.publicCardCopy}>
              Przejdź 10 przykładowych zadań. Wyniki wersji demonstracyjnej nie są zapisywane.
            </Text>
            <Pressable style={styles.primary} onPress={() => router.push('/demo')}>
              <Text style={styles.primaryText}>ZACZNIJ</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topbar}>
          <Text style={styles.brand}>Eduli</Text>
          <Pressable onPress={() => logout()}>
            <Text style={styles.logout}>Wyloguj</Text>
          </Pressable>
        </View>

        <Text style={styles.title}>Twoje dzieci</Text>
        <Text style={styles.subtitle}>Profile pobrane z obecnego backendu Supabase.</Text>

        <View style={styles.parentActions}>
          <Pressable style={styles.primary} onPress={() => router.push('/children/new')}>
            <Text style={styles.primaryText}>DODAJ DZIECKO</Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={() => router.push('/children/join')}>
            <Text style={styles.secondaryText}>DOŁĄCZ KODEM</Text>
          </Pressable>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.list}>
          {children.map((child) => (
            <Pressable
              key={child.id}
              style={styles.card}
              onPress={() => router.push(`/children/${child.id}`)}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{child.display_name.slice(0, 1).toUpperCase()}</Text>
              </View>
              <View style={styles.cardCopy}>
                <Text style={styles.childName}>{child.display_name}</Text>
                <Text style={styles.meta}>{child.birth_date ?? 'Brak daty urodzenia'}</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </Pressable>
          ))}
        </View>

        {!error && children.length === 0 ? (
          <Text style={styles.subtitle}>Nie masz jeszcze profilu dziecka.</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  publicContent: { flexGrow: 1, width: '100%', maxWidth: 760, alignSelf: 'center', padding: 24 },
  content: { flexGrow: 1, width: '100%', maxWidth: 760, alignSelf: 'center', padding: 24 },
  publicTopbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  publicTopLogin: { color: colors.text, fontWeight: '900' },
  publicSection: { marginTop: 52 },
  sectionKicker: { color: colors.accentDark, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  sectionTitle: { color: colors.text, fontSize: 30, lineHeight: 34, fontWeight: '900', marginTop: 7, marginBottom: 18 },
  publicCardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  publicInfoCard: { flexGrow: 1, flexBasis: 250, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 20, padding: 18 },
  publicIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#E8F3ED', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  publicIconText: { color: colors.accentDark, fontSize: 22, fontWeight: '900' },
  publicCardTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  publicCardCopy: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 5 },
  exampleList: { gap: 10 },
  exampleCard: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 20, padding: 20 },
  exampleLabel: { color: colors.accentDark, fontSize: 11, fontWeight: '900' },
  exampleTask: { color: colors.text, fontSize: 30, fontWeight: '900', marginTop: 10 },
  exampleCopy: { color: colors.muted, marginTop: 6 },
  gobiCard: { flexDirection: 'row', alignItems: 'center', gap: 18, backgroundColor: '#FFF8E8', borderRadius: 24, padding: 22, marginTop: 52 },
  gobiBadge: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#D9E8D9', alignItems: 'center', justifyContent: 'center' },
  gobiBadgeText: { color: colors.accentDark, fontSize: 30, fontWeight: '900' },
  gobiCopyWrap: { flex: 1 },
  gobiTitle: { color: colors.text, fontSize: 24, lineHeight: 28, fontWeight: '900', marginTop: 5 },
  steps: { gap: 10 },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, backgroundColor: '#F2F4F1', borderRadius: 19, padding: 18 },
  stepNumber: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { color: '#FFF', fontWeight: '900' },
  stepCopy: { flex: 1 },
  publicBottomCta: { marginTop: 52, marginBottom: 28, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 24, padding: 22 },
  brand: { color: colors.text, fontSize: 22, fontWeight: '900' },
  hero: { marginTop: 72, maxWidth: 620 },
  pill: { alignSelf: 'flex-start', backgroundColor: '#E8F3ED', color: colors.accentDark, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 8, fontWeight: '800' },
  heroTitle: { color: colors.text, fontSize: 48, lineHeight: 52, fontWeight: '900', marginTop: 20 },
  heroCopy: { color: colors.muted, fontSize: 19, lineHeight: 28, marginTop: 16, marginBottom: 28 },
  primary: { backgroundColor: colors.accent, borderRadius: 18, padding: 16, alignItems: 'center' },
  primaryText: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  secondary: { borderColor: colors.border, borderWidth: 2, borderRadius: 18, padding: 16, alignItems: 'center', marginTop: 10, backgroundColor: colors.card },
  secondaryText: { color: colors.text, fontSize: 17, fontWeight: '900' },
  loginTextButton: { alignItems: 'center', padding: 12, marginTop: 4 },
  loginText: { color: colors.muted, fontSize: 15, fontWeight: '800' },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logout: { color: colors.muted, fontWeight: '700' },
  title: { color: colors.text, fontSize: 42, fontWeight: '900', marginTop: 48 },
  subtitle: { color: colors.muted, fontSize: 17, lineHeight: 24, marginTop: 8, marginBottom: 24 },
  parentActions: { gap: 10, marginBottom: 24 },
  list: { gap: 10 },
  card: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#E8F3ED', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.accentDark, fontWeight: '900', fontSize: 22 },
  cardCopy: { flex: 1, marginLeft: 16 },
  childName: { color: colors.text, fontWeight: '900', fontSize: 19 },
  meta: { color: colors.muted, marginTop: 3 },
  arrow: { color: colors.muted, fontSize: 30 },
  error: { color: colors.danger, marginBottom: 16 }
});
