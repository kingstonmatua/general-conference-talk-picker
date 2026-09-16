import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

/**
 * Same Supabase project V1 uses (see `app/config.js`, sibling worktree) —
 * V1 and V2 share one user base. The anon/publishable key is safe to embed
 * client-side by design; Row Level Security on every table (see
 * `supabase/schema.sql`) is what actually enforces access control.
 */
const SUPABASE_URL = 'https://vxqxlzefhzieuvadetqa.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_bhZgTQwgZvkEFx7wLrJO5Q_X7BpmYNe';

// Expo Router's web build server-renders the initial page in Node, where
// there's no `window`/localStorage — AsyncStorage's web shim reaches for
// `window` and crashes the whole render if used there. Only use real
// storage in an actual runtime (native app, or a real browser tab); fall
// back to a no-op during that Node prerender pass.
const isServerRender = Platform.OS === 'web' && typeof window === 'undefined';
const authStorage = isServerRender
  ? {
      getItem: async () => null,
      setItem: async () => {},
      removeItem: async () => {},
    }
  : AsyncStorage;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
