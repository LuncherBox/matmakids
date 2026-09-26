import 'react-native-url-polyfill/auto';
import 'expo-sqlite/localStorage/install';

import { createClient } from '@supabase/supabase-js';

import { config } from '../config';

export const supabase = createClient(
  config.supabaseUrl,
  config.supabasePublishableKey,
  {
    auth: {
      storage: localStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    }
  }
);
