import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';

import { supabase } from '../src/lib/supabase';
import { colors } from '../src/theme';

export default function RegisterRoute() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    const emailValue = email.trim();

    if (!emailValue || password.length < 6) {
      setStatus('Podaj email i hasło mające co najmniej 6 znaków.');
      return;
    }

    if (password !== repeatPassword) {
      setStatus('Hasła nie są takie same.');
      return;
    }

    setBusy(true);
    setStatus('');

    const { data, error } = await supabase.auth.signUp({
      email: emailValue,
      password,
      options: {
        emailRedirectTo: window.location.origin
      }
    });

    setBusy(false);

    if (error) {
      setStatus(error.message || 'Nie udało się utworzyć konta.');
      return;
    }

    if (!data.session) {
      setStatus('Konto utworzone. Sprawdź email i potwierdź adres, a potem się zaloguj.');
      return;
    }

    router.replace('/');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.wrap}>
        <View style={styles.card}>
          <Text style={styles.brand}>Eduli</Text>
          <Text style={styles.title}>Załóż konto</Text>
          <Text style={styles.subtitle}>Utwórz konto rodzica.</Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            style={styles.input}
          />

          <Text style={styles.label}>Hasło</Text>
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
            <Text style={styles.primaryText}>{busy ? 'TWORZENIE...' : 'ZAŁÓŻ KONTO'}</Text>
          </Pressable>

          <Pressable onPress={() => router.replace('/login')}>
            <Text style={styles.link}>Masz już konto? Zaloguj się</Text>
          </Pressable>

          <Pressable onPress={() => router.replace('/')}>
            <Text style={styles.back}>Wróć</Text>
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
  subtitle: { color: colors.muted, fontSize: 17, marginTop: 6, marginBottom: 24 },
  label: { color: colors.muted, fontWeight: '800', marginTop: 10, marginBottom: 6 },
  input: { minHeight: 54, borderColor: colors.border, borderWidth: 2, borderRadius: 18, paddingHorizontal: 16, fontSize: 17, color: colors.text, backgroundColor: '#FFF' },
  status: { color: colors.muted, marginTop: 10, lineHeight: 20 },
  primary: { backgroundColor: colors.accent, borderRadius: 18, padding: 16, alignItems: 'center', marginTop: 24 },
  primaryText: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  link: { color: colors.text, textAlign: 'center', fontWeight: '800', marginTop: 20 },
  back: { color: colors.muted, textAlign: 'center', fontWeight: '700', marginTop: 14 }
});
