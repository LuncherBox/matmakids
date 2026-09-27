import { router, Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AuthProvider, useAuth } from '../src/providers/AuthProvider';
import { colors } from '../src/theme';

const PUBLIC_ROUTES = new Set([
  '/',
  '/login',
  '/register',
  '/reset-password',
  '/new-password',
  '/demo'
]);

function AppNavigator() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    const publicRoute = PUBLIC_ROUTES.has(pathname);

    if (!user && !publicRoute) {
      router.replace('/login');
      return;
    }

    if (user && (pathname === '/login' || pathname === '/register')) {
      router.replace('/');
    }
  }, [loading, pathname, user]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.accentDark} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background
  }
});
