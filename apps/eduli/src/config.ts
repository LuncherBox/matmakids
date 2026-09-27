const CURRENT_SUPABASE_URL =
  'https://cvxfvmneyoiupdjurvrc.supabase.co';

const CURRENT_SUPABASE_PUBLISHABLE_KEY =
  'sb_publishable_eBZHz7ZqlXp4NmpFtaKnWA_qDgVeVhA';

export const config = {
  // Both values are public browser/mobile client configuration.
  // Environment variables can override them per deployment without changing code.
  supabaseUrl:
    process.env.EXPO_PUBLIC_SUPABASE_URL ?? CURRENT_SUPABASE_URL,
  supabasePublishableKey:
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    CURRENT_SUPABASE_PUBLISHABLE_KEY,
  appUrl: process.env.EXPO_PUBLIC_APP_URL ?? ''
};
