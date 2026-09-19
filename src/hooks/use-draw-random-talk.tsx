import { useRouter } from 'expo-router';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { DRAW_REVEAL_MESSAGES, DrawRevealOverlay } from '@/components/draw-reveal-overlay';
import { TALKS } from '@/data/talks';
import { useTalkStatus } from '@/hooks/use-talk-status';

const REVEAL_DURATION_MS = 900;

type DrawOptions = {
  /** Replace the current screen instead of pushing a new one — use this
   * when drawing again from the talk detail screen itself, so repeated
   * draws don't stack up a long "Back" history of every talk you've seen. */
  replace?: boolean;
};

type DrawContextValue = {
  draw: (options?: DrawOptions) => void;
};

const DrawContext = createContext<DrawContextValue | null>(null);

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
 *
 * Mounted once at the root (see _layout.tsx) rather than as a plain hook,
 * so the brief "drawing…" reveal overlay is shared across every entry
 * point — Home's CTA, the web sidebar, and the native tab bar's center
 * button — instead of each needing its own copy of the animation.
 */
export function DrawRevealProvider({ children }: { children: ReactNode }) {
  const { studiedIdsByRecency } = useTalkStatus();
  const router = useRouter();
  const [isDrawing, setIsDrawing] = useState(false);
  const [revealMessage, setRevealMessage] = useState(DRAW_REVEAL_MESSAGES[0]);

  const draw = useCallback(
    (options?: DrawOptions) => {
      setRevealMessage(DRAW_REVEAL_MESSAGES[Math.floor(Math.random() * DRAW_REVEAL_MESSAGES.length)]);
      setIsDrawing(true);
      setTimeout(() => {
        const studiedIds = new Set(studiedIdsByRecency);
        const pool = TALKS.filter((t) => !studiedIds.has(t.id));
        const bag = pool.length > 0 ? pool : TALKS;
        const pick = bag[Math.floor(Math.random() * bag.length)];
        setIsDrawing(false);
        const target = { pathname: '/talk/[id]', params: { id: pick.id } } as const;
        if (options?.replace) {
          router.replace(target);
        } else {
          router.push(target);
        }
      }, REVEAL_DURATION_MS);
    },
    [studiedIdsByRecency, router],
  );

  const value = useMemo<DrawContextValue>(() => ({ draw }), [draw]);

  return (
    <DrawContext.Provider value={value}>
      {children}
      <DrawRevealOverlay visible={isDrawing} message={revealMessage} />
    </DrawContext.Provider>
  );
}

export function useDrawRandomTalk() {
  const ctx = useContext(DrawContext);
  if (!ctx) throw new Error('useDrawRandomTalk must be used within a DrawRevealProvider');
  return ctx.draw;
}
