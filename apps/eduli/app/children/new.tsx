import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  EDULI_AGE_ERROR,
  isEligibleEduliBirthDate
} from '../../src/domain/children/age';
import { createChild } from '../../src/services/children';
import { colors } from '../../src/theme';

export default function NewChildRoute() {
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    const displayName = name.trim();

    if (!displayName) {
      setStatus('Wpisz imię lub pseudonim.');
      return;
    }

    if (!isEligibleEduliBirthDate(birthDate)) {
      setStatus(EDULI_AGE_ERROR);
      return;
    }

    setBusy(true);
    setStatus('');

    try {
      const child = await createChild(displayName, birthDate);
      router.replace(`/children/${child.id}`);
    } catch (error) {
      console.error(error);
      setStatus('Nie udało się utworzyć profilu.');
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.wrap}>
        <View style={styles.card}>
          <Text style={styles.brand}>Eduli</Text>
          <Text style={styles.title}>Dodaj dziecko</Text>

          <Text style={styles.label}>Imię lub pseudonim</Text>
          <TextInput value={name} onChangeText={setName} style={styles.input} />

          <Text style={styles.label}>Data urodzenia</Text>
          <TextInput
            value={birthDate}
            onChangeText={setBirthDate}
            placeholder="RRRR-MM-DD"
            autoCapitalize="none"
            style={styles.input}
          />

          {status ? <Text style={styles.status}>{status}</Text> : null}

          <Pressable style={styles.primary} onPress={submit} disabled={busy}>
            <Text style={styles.primaryText}>{busy ? 'TWORZENIE...' : 'UTWÓRZ PROFIL'}</Text>
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
  title: { color: colors.text, fontSize: 38, fontWeight: '900', marginTop: 16, marginBottom: 18 },
  label: { color: colors.muted, fontWeight: '800', marginTop: 10, marginBottom: 6 },
  input: { minHeight: 54, borderColor: colors.border, borderWidth: 2, borderRadius: 18, paddingHorizontal: 16, fontSize: 17, color: colors.text, backgroundColor: '#FFF' },
  status: { color: colors.muted, marginTop: 10, lineHeight: 20 },
  primary: { backgroundColor: colors.accent, borderRadius: 18, padding: 16, alignItems: 'center', marginTop: 24 },
  primaryText: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  back: { color: colors.muted, textAlign: 'center', fontWeight: '700', marginTop: 18 }
});
