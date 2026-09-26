import { config } from '../config';
import { supabase } from '../lib/supabase';

export function loginWithPassword(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export function registerWithPassword(email: string, password: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: config.appUrl ? { emailRedirectTo: config.appUrl } : undefined
  });
}

export function logout() {
  return supabase.auth.signOut();
}

export function readSession() {
  return supabase.auth.getSession();
}

export function requestPasswordReset(email: string) {
  if (!config.appUrl) throw new Error('Missing EXPO_PUBLIC_APP_URL.');

  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${config.appUrl}/new-password`
  });
}

export function startGoogleLogin() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: config.appUrl ? { redirectTo: config.appUrl } : undefined
  });
}
