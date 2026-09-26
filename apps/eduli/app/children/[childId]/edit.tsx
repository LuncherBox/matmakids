import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  EDULI_AGE_ERROR,
  isEligibleEduliBirthDate
} from '../../../src/domain/children/age';
import { getChild, updateChildProfile } from '../../../src/services/children';
import { colors } from '../../../src/theme';

export default function EditChildRoute() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!childId) return;

    getChild(childId)
      .then((child) => {
        setName(child.display_name);
        setBirthDate(child.birth_date ?? '');
      })
      .catch((error) => {
        console.error(error);
        setStatus('Nie udało się wczytać profilu dziecka.');
      })
      .finally(() => setLoading(false));
  }, [childId]);

  async function submit() {
    if (!childId) return;

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
      await updateChildProfile(childId, displayName, birthDate);
      router.replace(`/children/${childId}`);
    } catch (error) {
      console.error(error);
      setStatus('Nie udało się zapisać zmian.');
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.wrap}>
        <View style={styles.card}>
          <Text style={styles.brand}>Eduli</Text>
          <Text style={styles.title}>Edytuj profil</Text>

          {loading ? <Text style={styles.status}>Wczytuję profil...</Text> : null}

          {!loading ? (
            <>
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
                <Text style={styles.primaryText}>{busy ? 'ZAPISYWANIE...' : 'ZAPISZ ZMIANY'}</Text>
              </Pressable>
            </>
          ) : null}

          <Pressable onPress={() => router.replace(`/children/${childId}`)}>
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
