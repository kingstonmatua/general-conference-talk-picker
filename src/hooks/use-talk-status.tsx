import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';

type Status = { isStudied: boolean; isFavorite: boolean; studiedAt: string | null };

type TalkStatusContextValue = {
  loading: boolean;
  getStatus: (talkId: string) => Status;
  studiedCount: number;
  favoriteIds: string[];
  /** talk_id of every studied talk, most-recently-studied first. */
  studiedIdsByRecency: string[];
  markStudied: (talkId: string) => Promise<void>;
  unmarkStudied: (talkId: string) => Promise<void>;
  setFavorite: (talkId: string, favorite: boolean) => Promise<void>;
  currentStreak: number;
  longestStreak: number;
};

const EMPTY_STATUS: Status = { isStudied: false, isFavorite: false, studiedAt: null };

const TalkStatusContext = createContext<TalkStatusContextValue | null>(null);

export function TalkStatusProvider({ children }: { children: ReactNode }) {
  const { user, promptSignIn } = useAuth();
  const [statusByTalkId, setStatusByTalkId] = useState<Record<string, Status>>({});
  const [loading, setLoading] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);

  const refreshStreaks = useCallback(() => {
    supabase.rpc('get_study_streaks').then(({ data, error }) => {
      if (error || !data || data.length === 0) return;
      setCurrentStreak(data[0].current_streak ?? 0);
      setLongestStreak(data[0].longest_streak ?? 0);
    });
  }, []);

  useEffect(() => {
    if (!user) {
      setStatusByTalkId({});
      setCurrentStreak(0);
      setLongestStreak(0);
      return;
    }
    refreshStreaks();
    let cancelled = false;
    setLoading(true);
    supabase
      .from('talk_status')
      .select('talk_id, is_studied, is_favorite, studied_at')
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) {
          const next: Record<string, Status> = {};
          for (const row of data) {
            next[row.talk_id] = {
              isStudied: row.is_studied,
              isFavorite: row.is_favorite,
              studiedAt: row.studied_at,
            };
          }
          setStatusByTalkId(next);
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, refreshStreaks]);

  const getStatus = useCallback(
    (talkId: string) => statusByTalkId[talkId] ?? EMPTY_STATUS,
    [statusByTalkId],
  );

  const patch = useCallback((talkId: string, partial: Partial<Status>) => {
    setStatusByTalkId((prev) => ({
      ...prev,
      [talkId]: { ...(prev[talkId] ?? EMPTY_STATUS), ...partial },
    }));
  }, []);

  const markStudied = useCallback(
    async (talkId: string) => {
      if (!user) return promptSignIn();
      patch(talkId, { isStudied: true, studiedAt: new Date().toISOString() });
      const { error } = await supabase.rpc('mark_talk_studied', { p_talk_id: talkId });
      if (error) patch(talkId, { isStudied: false });
      else refreshStreaks();
    },
    [user, promptSignIn, patch, refreshStreaks],
  );

  const unmarkStudied = useCallback(
    async (talkId: string) => {
      if (!user) return promptSignIn();
      patch(talkId, { isStudied: false });
      // Unmarking never touches study_events, so streaks are unaffected —
      // no refreshStreaks() call needed here (see schema.sql).
      const { error } = await supabase.rpc('unmark_talk_studied', { p_talk_id: talkId });
      if (error) patch(talkId, { isStudied: true });
    },
    [user, promptSignIn, patch],
  );

  const setFavorite = useCallback(
    async (talkId: string, favorite: boolean) => {
      if (!user) return promptSignIn();
      patch(talkId, { isFavorite: favorite });
      const { error } = await supabase.rpc('set_talk_favorite', {
        p_talk_id: talkId,
        p_favorite: favorite,
      });
      if (error) patch(talkId, { isFavorite: !favorite });
    },
    [user, promptSignIn, patch],
  );

  const studiedCount = useMemo(
    () => Object.values(statusByTalkId).filter((s) => s.isStudied).length,
    [statusByTalkId],
  );
  const favoriteIds = useMemo(
    () => Object.entries(statusByTalkId).filter(([, s]) => s.isFavorite).map(([id]) => id),
    [statusByTalkId],
  );
  const studiedIdsByRecency = useMemo(
    () =>
      Object.entries(statusByTalkId)
        .filter(([, s]) => s.isStudied)
        .sort(([, a], [, b]) => (b.studiedAt ?? '').localeCompare(a.studiedAt ?? ''))
        .map(([id]) => id),
    [statusByTalkId],
  );

  const value = useMemo<TalkStatusContextValue>(
    () => ({
      loading,
      getStatus,
      studiedCount,
      favoriteIds,
      studiedIdsByRecency,
      markStudied,
      unmarkStudied,
      setFavorite,
      currentStreak,
      longestStreak,
    }),
    [
      loading,
      getStatus,
      studiedCount,
      favoriteIds,
      studiedIdsByRecency,
      markStudied,
      unmarkStudied,
      setFavorite,
      currentStreak,
      longestStreak,
    ],
  );

  return <TalkStatusContext.Provider value={value}>{children}</TalkStatusContext.Provider>;
}

export function useTalkStatus() {
  const ctx = useContext(TalkStatusContext);
  if (!ctx) throw new Error('useTalkStatus must be used within a TalkStatusProvider');
  return ctx;
}
