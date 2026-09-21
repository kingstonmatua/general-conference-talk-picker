import type { Session, User } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { supabase } from '@/lib/supabase';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  /** Whether the sign-in sheet should currently be shown. */
  promptVisible: boolean;
  /** Show the sign-in sheet — call this before any action that needs auth. */
  promptSignIn: () => void;
  dismissPrompt: () => void;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  /** Emails a password-reset link that opens the web reset page (see src/app/reset-password.tsx). */
  requestPasswordReset: (email: string) => Promise<{ error: string | null }>;
  /** Sets a new password for the current (recovery) session. */
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  /** From auth user_metadata — no separate profiles table, just this field. */
  avatarUrl: string | null;
  /** Uploads to the "avatars" Storage bucket, then saves the public URL onto user_metadata. */
  updateAvatar: (localUri: string) => Promise<{ error: string | null }>;
  /** Permanently deletes the signed-in user's account and all their data (see delete_own_account() in schema.sql). */
  deleteAccount: () => Promise<{ error: string | null }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [promptVisible, setPromptVisible] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  const promptSignIn = useCallback(() => setPromptVisible(true), []);
  const dismissPrompt = useCallback(() => setPromptVisible(false), []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    // Always the web page, even when requested from the native app — the
    // emailed link opens in the browser, so no deep-link setup is needed.
    // This URL must be in Supabase → Authentication → URL Configuration → Redirect URLs.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://gctalkpicker.app/reset-password',
    });
    return { error: error?.message ?? null };
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const updateAvatar = useCallback(async (localUri: string) => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return { error: 'Not signed in' };

    try {
      // React Native has no Blob-from-file-path shortcut — fetching the
      // local file URI and reading its arrayBuffer is the standard way
      // to get bytes Supabase Storage's upload() will accept here.
      const response = await fetch(localUri);
      const arrayBuffer = await response.arrayBuffer();
      const path = `${userId}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, arrayBuffer, { contentType: 'image/jpeg', upsert: true });
      if (uploadError) return { error: uploadError.message };

      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(path);
      // Cache-busted so the new photo shows immediately — same path as
      // the old photo, and image caches (both device and CDN) would
      // otherwise keep serving the previous one at that exact URL.
      const avatarUrl = `${publicUrlData.publicUrl}?updated=${Date.now()}`;

      const { error: updateError } = await supabase.auth.updateUser({ data: { avatar_url: avatarUrl } });
      if (updateError) return { error: updateError.message };

      return { error: null };
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Upload failed' };
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (userId) {
      // Storage doesn't allow deleting the metadata row via raw SQL (the
      // RPC used to try this and always failed) — has to go through the
      // Storage API, which also frees the underlying file. Ignore errors
      // here: a missing avatar file shouldn't block account deletion.
      await supabase.storage.from('avatars').remove([`${userId}.jpg`]);
    }

    const { error } = await supabase.rpc('delete_own_account');
    if (error) return { error: error.message };
    // The row backing this session no longer exists server-side; clear the
    // local session too so the app doesn't keep treating the client as
    // signed in off a stale (but not-yet-expired) token.
    await supabase.auth.signOut();
    return { error: null };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      promptVisible,
      promptSignIn,
      dismissPrompt,
      signIn,
      signUp,
      signOut,
      requestPasswordReset,
      updatePassword,
      avatarUrl: (session?.user?.user_metadata?.avatar_url as string | undefined) ?? null,
      updateAvatar,
      deleteAccount,
    }),
    [session, loading, promptVisible, promptSignIn, dismissPrompt, signIn, signUp, signOut, requestPasswordReset, updatePassword, updateAvatar, deleteAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
