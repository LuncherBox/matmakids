import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';

import { joinChildByCode } from '../../src/services/children';
import { colors } from '../../src/theme';

export default function JoinChildRoute() {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    const shareCode = code.trim().replace(/\s+/g, '').toUpperCase();

    if (!shareCode) {
      setStatus('Wpisz kod profilu dziecka.');
      return;
    }

    setBusy(true);
    setStatus('');

    try {
      const child = await joinChildByCode(shareCode);
      router.replace(`/children/${child.id}`);
    } catch (error) {
      console.error(error);
      setStatus('Nie znaleziono profilu z takim kodem.');
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.wrap}>
        <View style={styles.card}>
          <Text style={styles.brand}>Eduli</Text>
          <Text style={styles.title}>Dołącz dziecko</Text>
          <Text style={styles.subtitle}>Wpisz kod otrzymany od osoby, która utworzyła profil.</Text>

          <Text style={styles.label}>Kod dziecka</Text>
          <TextInput
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
            placeholder="np. K7M4PQ2X"
            style={styles.input}
          />

          {status ? <Text style={styles.status}>{status}</Text> : null}

          <Pressable style={styles.primary} onPress={submit} disabled={busy}>
            <Text style={styles.primaryText}>{busy ? 'ŁĄCZENIE...' : 'DOŁĄCZ PROFIL'}</Text>
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
  subtitle: { color: colors.muted, fontSize: 17, lineHeight: 24, marginTop: 6, marginBottom: 24 },
  label: { color: colors.muted, fontWeight: '800', marginTop: 10, marginBottom: 6 },
  input: { minHeight: 54, borderColor: colors.border, borderWidth: 2, borderRadius: 18, paddingHorizontal: 16, fontSize: 17, color: colors.text, backgroundColor: '#FFF' },
  status: { color: colors.muted, marginTop: 10, lineHeight: 20 },
  primary: { backgroundColor: colors.accent, borderRadius: 18, padding: 16, alignItems: 'center', marginTop: 24 },
  primaryText: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  back: { color: colors.muted, textAlign: 'center', fontWeight: '700', marginTop: 18 }
});
