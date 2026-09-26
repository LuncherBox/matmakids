import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';

import { loginWithPassword, startGoogleLogin } from '../src/services/auth';
import { colors } from '../src/theme';

export default function LoginRoute() {
  const params = useLocalSearchParams<{ passwordChanged?: string }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!email.trim() || !password) {
      setStatus('Wpisz email i hasło.');
      return;
    }

    setBusy(true);
    setStatus('');

    const { error } = await loginWithPassword(email.trim(), password);

    setBusy(false);

    if (error) {
      setStatus('Nie udało się zalogować. Sprawdź email i hasło.');
      return;
    }

    router.replace('/');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.wrap}>
        <View style={styles.card}>
          <Text style={styles.brand}>Eduli</Text>
          <Text style={styles.title}>Zaloguj się</Text>
          <Text style={styles.subtitle}>Zaloguj się jako rodzic.</Text>

          {Platform.OS === 'web' ? (
            <Pressable
              style={styles.google}
              onPress={async () => {
                setStatus('');
                const { error } = await startGoogleLogin();
                if (error) setStatus('Nie udało się uruchomić logowania Google.');
              }}
            >
              <Text style={styles.googleText}>Kontynuuj z Google</Text>
            </Pressable>
          ) : null}

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
            autoComplete="current-password"
            style={styles.input}
          />

          {params.passwordChanged === '1' ? (
            <Text style={styles.success}>Hasło zostało zmienione</Text>
          ) : null}
          {status ? <Text style={styles.error}>{status}</Text> : null}

          <Pressable style={styles.primary} onPress={submit} disabled={busy}>
            <Text style={styles.primaryText}>{busy ? 'LOGOWANIE...' : 'ZALOGUJ SIĘ'}</Text>
          </Pressable>

          <Pressable onPress={() => router.push('/reset-password')}>
            <Text style={styles.link}>Nie pamiętasz hasła?</Text>
          </Pressable>

          <Pressable onPress={() => router.push('/register')}>
            <Text style={styles.link}>Nie masz konta? Załóż konto</Text>
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
  google: { borderColor: colors.border, borderWidth: 2, borderRadius: 18, padding: 15, alignItems: 'center', marginBottom: 14 },
  googleText: { color: colors.text, fontWeight: '900' },
  label: { color: colors.muted, fontWeight: '800', marginTop: 10, marginBottom: 6 },
  input: { minHeight: 54, borderColor: colors.border, borderWidth: 2, borderRadius: 18, paddingHorizontal: 16, fontSize: 17, color: colors.text, backgroundColor: '#FFF' },
  error: { color: colors.danger, marginTop: 10 },
  success: { color: colors.accentDark, marginTop: 10, fontWeight: '800' },
  primary: { backgroundColor: colors.accent, borderRadius: 18, padding: 16, alignItems: 'center', marginTop: 24 },
  primaryText: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  link: { color: colors.text, textAlign: 'center', fontWeight: '800', marginTop: 16 },
  back: { color: colors.muted, textAlign: 'center', fontWeight: '700', marginTop: 14 }
});
