import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';

import { config } from '../src/config';
import { supabase } from '../src/lib/supabase';
import { colors } from '../src/theme';

export default function ResetPasswordRoute() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    const emailValue = email.trim();

    if (!emailValue) {
      setStatus('Wpisz adres email.');
      return;
    }

    if (!config.appUrl) {
      setStatus('Reset hasła nie jest jeszcze skonfigurowany dla tego środowiska.');
      return;
    }

    setBusy(true);
    setStatus('');

    const { error } = await supabase.auth.resetPasswordForEmail(emailValue, {
      redirectTo: `${config.appUrl}/new-password`
    });

    setBusy(false);

    if (error) {
      setStatus('Nie udało się wysłać wiadomości.');
      return;
    }

    setStatus('Wysłaliśmy link do zmiany hasła na podany email.');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.wrap}>
        <View style={styles.card}>
          <Text style={styles.brand}>Eduli</Text>
          <Text style={styles.title}>Zresetuj hasło</Text>
          <Text style={styles.subtitle}>Podaj adres email przypisany do konta.</Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            style={styles.input}
          />

          {status ? <Text style={styles.status}>{status}</Text> : null}

          <Pressable style={styles.primary} onPress={submit} disabled={busy}>
            <Text style={styles.primaryText}>{busy ? 'WYSYŁANIE...' : 'WYŚLIJ LINK'}</Text>
          </Pressable>

          <Pressable onPress={() => router.replace('/login')}>
            <Text style={styles.back}>Wróć do logowania</Text>
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
  back: { color: colors.muted, textAlign: 'center', fontWeight: '700', marginTop: 18 }
});
