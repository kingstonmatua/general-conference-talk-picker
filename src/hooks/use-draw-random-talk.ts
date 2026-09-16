import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { TALKS } from '@/data/talks';
import { useTalkStatus } from '@/hooks/use-talk-status';

/**
 * "Remaining bag" for V2: the pool of not-yet-studied talks (using the real
 * talk_status data already wired up, rather than a separate drawn/remaining
 * table like V1's `remaining_ids` array). Once every talk is studied, the
 * bag refills from the full set rather than drawing nothing.
 *
 * Unfiltered for now — no Draw-specific filter UI exists yet (see
 * SESSION_HANDOFF.md's "Progress Scope" note: Browse filters = find, Draw
 * filters = choose, Progress Scope = measure — Draw's own filters are a
 * separate, not-yet-built decision).
 */
export function useDrawRandomTalk() {
  const { studiedIdsByRecency } = useTalkStatus();
  const router = useRouter();

  return useCallback(() => {
    const studiedIds = new Set(studiedIdsByRecency);
    const pool = TALKS.filter((t) => !studiedIds.has(t.id));
    const bag = pool.length > 0 ? pool : TALKS;
    const pick = bag[Math.floor(Math.random() * bag.length)];
    router.push({ pathname: '/talk/[id]', params: { id: pick.id } });
  }, [studiedIdsByRecency, router]);
}
