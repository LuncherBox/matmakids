import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';

import { supabase } from '../src/lib/supabase';
import { colors } from '../src/theme';

export default function NewPasswordRoute() {
  const params = useLocalSearchParams<{ code?: string; error?: string; error_code?: string }>();
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;

    async function prepareRecovery() {
      if (params.error || params.error_code) {
        if (active) {
          setInvalid(true);
          setReady(true);
        }
        return;
      }

      if (params.code) {
        const { error } = await supabase.auth.exchangeCodeForSession(params.code);

        if (active) {
          setInvalid(Boolean(error));
          setReady(true);
        }
        return;
      }

      const { data } = await supabase.auth.getSession();

      if (active) {
        setInvalid(!data.session);
        setReady(true);
      }
    }

    prepareRecovery();

    return () => {
      active = false;
    };
  }, [params.code, params.error, params.error_code]);

  async function submit() {
    if (password.length < 6) {
      setStatus('Hasło musi mieć co najmniej 6 znaków.');
      return;
    }

    if (password !== repeatPassword) {
      setStatus('Hasła nie są takie same.');
      return;
    }

    setBusy(true);
    setStatus('');

    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);

    if (error) {
      setStatus('Nie udało się zmienić hasła. Link mógł wygasnąć.');
      return;
    }

    await supabase.auth.signOut();
    router.replace('/login?passwordChanged=1');
  }

  if (!ready) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.wrap}>
          <Text style={styles.subtitle}>Sprawdzam link...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (invalid) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.wrap}>
          <View style={styles.card}>
            <Text style={styles.brand}>Eduli</Text>
            <Text style={styles.title}>Link wygasł</Text>
            <Text style={styles.subtitle}>Link do zmiany hasła jest nieprawidłowy lub wygasł.</Text>
            <Pressable style={styles.primary} onPress={() => router.replace('/reset-password')}>
              <Text style={styles.primaryText}>WYŚLIJ NOWY LINK</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.wrap}>
        <View style={styles.card}>
          <Text style={styles.brand}>Eduli</Text>
          <Text style={styles.title}>Ustaw nowe hasło</Text>
          <Text style={styles.subtitle}>Wpisz nowe hasło do swojego konta.</Text>

          <Text style={styles.label}>Nowe hasło</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            style={styles.input}
          />

          <Text style={styles.label}>Powtórz hasło</Text>
          <TextInput
            value={repeatPassword}
            onChangeText={setRepeatPassword}
            secureTextEntry
            autoComplete="new-password"
            style={styles.input}
          />

          {status ? <Text style={styles.status}>{status}</Text> : null}

          <Pressable style={styles.primary} onPress={submit} disabled={busy}>
            <Text style={styles.primaryText}>{busy ? 'ZAPISYWANIE...' : 'ZAPISZ NOWE HASŁO'}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  wrap: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  card: { width: '100%', maxWidth: 520, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 26, padding: 24 },
  brand: { color: colors.muted, fontWeight: '800' },
  title: { color: colors.text, fontSize: 38, fontWeight: '900', marginTop: 16 },
  subtitle: { color: colors.muted, fontSize: 17, lineHeight: 24, marginTop: 6, marginBottom: 24 },
  label: { color: colors.muted, fontWeight: '800', marginTop: 10, marginBottom: 6 },
  input: { minHeight: 54, borderColor: colors.border, borderWidth: 2, borderRadius: 18, paddingHorizontal: 16, fontSize: 17, color: colors.text, backgroundColor: '#FFF' },
  status: { color: colors.muted, marginTop: 10, lineHeight: 20 },
  primary: { backgroundColor: colors.accent, borderRadius: 18, padding: 16, alignItems: 'center', marginTop: 24 },
  primaryText: { color: '#FFF', fontSize: 18, fontWeight: '900' }
});
