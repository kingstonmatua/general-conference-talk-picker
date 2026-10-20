import type { PostgrestError } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';

/**
 * Social Update 1 (see SOCIAL_PLAN.md): the signed-in user's username,
 * their friends and friend requests, invite links and the friends
 * leaderboard. Everything goes through the RPCs in supabase/social.sql —
 * the tables are never written directly.
 *
 * Every action returns `{ error }` where error is already friendly copy
 * (see friendlyError below), ready to show in the UI as-is.
 */

export type SocialProfile = {
  userId: string;
  username: string;
  avatarUrl: string | null;
  /** null until the first change after the username was created. */
  usernameChangedAt: string | null;
};

/** Where another person stands relative to me. */
export type Relationship = 'none' | 'friend' | 'incoming' | 'outgoing';

export type Person = { userId: string; username: string; avatarUrl: string | null };

export type SearchResult = Person & { relationship: Relationship };

export type Friendship = Person & {
  state: Exclude<Relationship, 'none'>;
  /** When they became friends, or when the request was sent. */
  since: string;
};

export type LeaderboardRow = Person & {
  isMe: boolean;
  talksAllTime: number;
  talksThisWeek: number;
  talksThisMonth: number;
  currentStreak: number;
  longestStreak: number;
};

type Result<T = void> = { error: string | null; data?: T };

type SocialContextValue = {
  /** True until the first profile lookup finishes for a signed-in user. */
  loading: boolean;
  /** null = guest, or signed in but no username picked yet. */
  profile: SocialProfile | null;
  /** Signed in but hasn't picked a username — the Social tab shows setup. */
  needsProfile: boolean;
  /** When the username can next be changed; null = it can be changed now. */
  nextUsernameChangeAt: Date | null;
  setUsername: (username: string) => Promise<Result>;

  friends: Friendship[];
  incomingRequests: Friendship[];
  outgoingRequests: Friendship[];
  refreshFriendships: () => Promise<void>;
  searchProfiles: (query: string) => Promise<Result<SearchResult[]>>;
  /** Returns the new relationship: 'friend' if they had already asked you. */
  sendFriendRequest: (userId: string) => Promise<Result<Relationship>>;
  respondToRequest: (userId: string, accept: boolean) => Promise<Result>;
  cancelRequest: (userId: string) => Promise<Result>;
  removeFriend: (userId: string) => Promise<Result>;

  /** The user's reusable invite link (created on first call). */
  getInviteLink: () => Promise<Result<string>>;
  /** Replaces the invite link, so old shared links stop working. */
  regenerateInviteLink: () => Promise<Result<string>>;
  /** Who an invite belongs to — works for guests too, for the invite page. */
  getInviteOwner: (token: string) => Promise<Result<Person | null>>;
  /** Accepting an invite makes you friends straight away. */
  redeemInvite: (token: string) => Promise<Result<Person>>;

  leaderboard: LeaderboardRow[];
  refreshLeaderboard: () => Promise<void>;
};

const INVITE_BASE_URL = 'https://gctalkpicker.app/invite/';
const USERNAME_CHANGE_DAYS = 90;

const FRIENDLY_ERRORS: Record<string, string> = {
  username_invalid:
    'Usernames are 3–20 characters: lowercase letters, numbers, _ and . (no ".." and no "." at the start or end).',
  username_not_allowed: "That username isn't available. Try another one.",
  username_taken: 'That username is already taken.',
  profile_required: 'Pick a username first.',
  cannot_friend_self: "You can't add yourself.",
  user_not_found: "We couldn't find that person.",
  request_not_found: 'That request is no longer there.',
  invite_not_found: "This invite link doesn't work anymore. Ask your friend for a new one.",
  own_invite: "This is your own invite link. Share it with a friend!",
  avatar_url_invalid: "That photo couldn't be saved.",
};

function friendlyError(error: PostgrestError): string {
  if (error.message === 'username_change_too_soon') {
    const next = error.hint ? new Date(error.hint) : null;
    return next && !Number.isNaN(next.getTime())
      ? `You can change your username again on ${formatDate(next)}.`
      : 'You can only change your username once every 90 days.';
  }
  return FRIENDLY_ERRORS[error.message] ?? 'Something went wrong. Please try again.';
}

function formatDate(date: Date) {
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

const SocialContext = createContext<SocialContextValue | null>(null);

export function SocialProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  // Which user the profile has finished loading for. Comparing against the
  // current user (instead of a loading flag set in an effect) means there's
  // no render right after sign-in where needsProfile is wrongly true.
  const [loadedForUserId, setLoadedForUserId] = useState<string | null>(null);
  const loading = !!user && loadedForUserId !== user.id;
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('social_profiles')
      .select('user_id, username, avatar_url, username_changed_at')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) return;
    setProfile(
      data
        ? {
            userId: data.user_id,
            username: data.username,
            avatarUrl: data.avatar_url,
            usernameChangedAt: data.username_changed_at,
          }
        : null,
    );
  }, [user]);

  const refreshFriendships = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.rpc('get_my_friendships');
    if (error || !data) return;
    setFriendships(
      data.map((row: any) => ({
        userId: row.user_id,
        username: row.username,
        avatarUrl: row.avatar_url,
        state: row.state,
        since: row.since,
      })),
    );
  }, [user]);

  const refreshLeaderboard = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.rpc('get_friends_leaderboard');
    if (error || !data) return;
    setLeaderboard(
      data.map((row: any) => ({
        userId: row.user_id,
        username: row.username,
        avatarUrl: row.avatar_url,
        isMe: row.is_me,
        talksAllTime: row.talks_all_time ?? 0,
        talksThisWeek: row.talks_this_week ?? 0,
        talksThisMonth: row.talks_this_month ?? 0,
        currentStreak: row.current_streak ?? 0,
        longestStreak: row.longest_streak ?? 0,
      })),
    );
  }, [user]);

  useEffect(() => {
    setProfile(null);
    setFriendships([]);
    setLeaderboard([]);
    if (!user) return;
    let cancelled = false;
    // Friendships load alongside the profile so the Social tab can badge
    // incoming requests; the leaderboard waits until it's actually shown.
    Promise.all([refreshProfile(), refreshFriendships()]).finally(() => {
      if (!cancelled) setLoadedForUserId(user.id);
    });
    return () => {
      cancelled = true;
    };
  }, [user, refreshProfile, refreshFriendships]);

  const setUsername = useCallback(
    async (username: string): Promise<Result> => {
      const { error } = await supabase.rpc('set_username', { p_username: username });
      if (error) return { error: friendlyError(error) };
      await refreshProfile();
      return { error: null };
    },
    [refreshProfile],
  );

  const searchProfiles = useCallback(async (query: string): Promise<Result<SearchResult[]>> => {
    // The RPC needs 2+ characters; skip the round trip below that.
    if (query.replace(/[\s@]/g, '').length < 2) return { error: null, data: [] };
    const { data, error } = await supabase.rpc('search_profiles', { p_query: query });
    if (error) return { error: friendlyError(error) };
    return {
      error: null,
      data: (data ?? []).map((row: any) => ({
        userId: row.user_id,
        username: row.username,
        avatarUrl: row.avatar_url,
        relationship: row.relationship,
      })),
    };
  }, []);

  /** Runs a friend RPC, then reloads the list so every screen agrees. */
  const friendAction = useCallback(
    async <T,>(fn: string, args: Record<string, unknown>): Promise<Result<T>> => {
      const { data, error } = await supabase.rpc(fn, args);
      if (error) return { error: friendlyError(error) };
      await refreshFriendships();
      return { error: null, data: data as T };
    },
    [refreshFriendships],
  );

  const sendFriendRequest = useCallback(
    (userId: string) => friendAction<Relationship>('send_friend_request', { p_user_id: userId }),
    [friendAction],
  );
  const respondToRequest = useCallback(
    (userId: string, accept: boolean) =>
      friendAction<void>('respond_friend_request', { p_user_id: userId, p_accept: accept }),
    [friendAction],
  );
  const cancelRequest = useCallback(
    (userId: string) => friendAction<void>('cancel_friend_request', { p_user_id: userId }),
    [friendAction],
  );
  const removeFriend = useCallback(
    (userId: string) => friendAction<void>('remove_friend', { p_user_id: userId }),
    [friendAction],
  );

  const inviteLink = useCallback(async (fn: string): Promise<Result<string>> => {
    const { data, error } = await supabase.rpc(fn);
    if (error) return { error: friendlyError(error) };
    return { error: null, data: INVITE_BASE_URL + data };
  }, []);
  const getInviteLink = useCallback(() => inviteLink('get_or_create_invite'), [inviteLink]);
  const regenerateInviteLink = useCallback(() => inviteLink('regenerate_invite'), [inviteLink]);

  const getInviteOwner = useCallback(async (token: string): Promise<Result<Person | null>> => {
    const { data, error } = await supabase.rpc('get_invite_owner', { p_token: token });
    if (error) return { error: friendlyError(error) };
    const row = data?.[0];
    // user_id isn't exposed before redeeming, so it's left blank here.
    return { error: null, data: row ? { userId: '', username: row.username, avatarUrl: row.avatar_url } : null };
  }, []);

  const redeemInvite = useCallback(
    async (token: string): Promise<Result<Person>> => {
      const result = await friendAction<{ user_id: string; username: string }[]>('redeem_invite', {
        p_token: token,
      });
      if (result.error) return { error: result.error };
      const row = result.data?.[0];
      if (!row) return { error: FRIENDLY_ERRORS.invite_not_found };
      return { error: null, data: { userId: row.user_id, username: row.username, avatarUrl: null } };
    },
    [friendAction],
  );

  const nextUsernameChangeAt = useMemo(() => {
    if (!profile?.usernameChangedAt) return null;
    const next = new Date(profile.usernameChangedAt);
    next.setDate(next.getDate() + USERNAME_CHANGE_DAYS);
    return next > new Date() ? next : null;
  }, [profile]);

  const friends = useMemo(() => friendships.filter((f) => f.state === 'friend'), [friendships]);
  const incomingRequests = useMemo(() => friendships.filter((f) => f.state === 'incoming'), [friendships]);
  const outgoingRequests = useMemo(() => friendships.filter((f) => f.state === 'outgoing'), [friendships]);

  const value = useMemo<SocialContextValue>(
    () => ({
      loading,
      profile,
      needsProfile: !!user && !loading && !profile,
      nextUsernameChangeAt,
      setUsername,
      friends,
      incomingRequests,
      outgoingRequests,
      refreshFriendships,
      searchProfiles,
      sendFriendRequest,
      respondToRequest,
      cancelRequest,
      removeFriend,
      getInviteLink,
      regenerateInviteLink,
      getInviteOwner,
      redeemInvite,
      leaderboard,
      refreshLeaderboard,
    }),
    [
      user,
      loading,
      profile,
      nextUsernameChangeAt,
      setUsername,
      friends,
      incomingRequests,
      outgoingRequests,
      refreshFriendships,
      searchProfiles,
      sendFriendRequest,
      respondToRequest,
      cancelRequest,
      removeFriend,
      getInviteLink,
      regenerateInviteLink,
      getInviteOwner,
      redeemInvite,
      leaderboard,
      refreshLeaderboard,
    ],
  );

  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>;
}

export function useSocial() {
  const ctx = useContext(SocialContext);
  if (!ctx) throw new Error('useSocial must be used within a SocialProvider');
  return ctx;
}
