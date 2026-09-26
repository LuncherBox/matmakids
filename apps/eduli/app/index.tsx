import { router } from 'expo-router';
import type { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { supabase } from '../src/lib/supabase';
import { listChildren } from '../src/services/children';
import { colors } from '../src/theme';
import type { Child } from '../src/types/models';

export default function HomeRoute() {
  const [session, setSession] = useState<Session | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) {
      setChildren([]);
      return;
    }

    setLoading(true);
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
      .finally(() => setLoading(false));
  }, [session]);

  if (loading) {
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
          <Text style={styles.brand}>Eduli</Text>
          <View style={styles.hero}>
            <Text style={styles.pill}>Dla dzieci 4-8 lat</Text>
            <Text style={styles.heroTitle}>Nauka, która daje dziecku satysfakcję.</Text>
            <Text style={styles.heroCopy}>
              Matematyka, logika, pamięć i podstawy kodowania w krótkich ćwiczeniach dopasowanych do poziomu dziecka.
            </Text>
            <Pressable style={styles.primary} onPress={() => router.push('/register')}>
              <Text style={styles.primaryText}>ZAŁÓŻ KONTO</Text>
            </Pressable>
            <Pressable style={styles.secondary} onPress={() => router.push('/login')}>
              <Text style={styles.secondaryText}>ZALOGUJ SIĘ</Text>
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
          <Pressable onPress={() => supabase.auth.signOut()}>
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
  brand: { color: colors.text, fontSize: 22, fontWeight: '900' },
  hero: { marginTop: 72, maxWidth: 620 },
  pill: { alignSelf: 'flex-start', backgroundColor: '#E8F3ED', color: colors.accentDark, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 8, fontWeight: '800' },
  heroTitle: { color: colors.text, fontSize: 48, lineHeight: 52, fontWeight: '900', marginTop: 20 },
  heroCopy: { color: colors.muted, fontSize: 19, lineHeight: 28, marginTop: 16, marginBottom: 28 },
  primary: { backgroundColor: colors.accent, borderRadius: 18, padding: 16, alignItems: 'center' },
  primaryText: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  secondary: { borderColor: colors.border, borderWidth: 2, borderRadius: 18, padding: 16, alignItems: 'center', marginTop: 10, backgroundColor: colors.card },
  secondaryText: { color: colors.text, fontSize: 17, fontWeight: '900' },
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
