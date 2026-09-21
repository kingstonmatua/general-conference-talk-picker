import { useRouter } from 'expo-router';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { DRAW_REVEAL_MESSAGES, DrawRevealOverlay } from '@/components/draw-reveal-overlay';
import { useDrawScope } from '@/hooks/use-draw-scope';

const REVEAL_DURATION_MS = 900;

type DrawOptions = {
  /** Replace the current screen instead of pushing a new one — use this
   * when drawing again from the talk detail screen itself, so repeated
   * draws don't stack up a long "Back" history of every talk you've seen. */
  replace?: boolean;
  /** Never draw this talk — used so "draw another" can't hand back the
   * talk you're already looking at. */
  excludeId?: string;
};

type DrawContextValue = {
  draw: (options?: DrawOptions) => void;
};

const DrawContext = createContext<DrawContextValue | null>(null);

/**
 * Draws a random talk from the user's saved Draw scope (see
 * use-draw-scope.tsx), with the brief reveal overlay. If nothing in scope is
 * left to draw, opens /draw instead so the empty-scope message can explain
 * why and offer a way forward.
 *
 * Mounted once at the root (see _layout.tsx) rather than as a plain hook,
 * so the "drawing…" reveal overlay is one shared instance — used by the
 * /draw screen's Draw button and "Draw another talk" on the talk screen.
 * (V1's `remaining_ids` bag has no equivalent here: the pool is derived
 * from `talk_status` through the scope.)
 */
export function DrawRevealProvider({ children }: { children: ReactNode }) {
  const { matches: scopeMatches } = useDrawScope();
  const router = useRouter();
  const [isDrawing, setIsDrawing] = useState(false);
  const [revealMessage, setRevealMessage] = useState(DRAW_REVEAL_MESSAGES[0]);

  const draw = useCallback(
    (options?: DrawOptions) => {
      const pool = scopeMatches.filter((t) => t.id !== options?.excludeId);
      if (pool.length === 0) {
        router.push('/draw');
        return;
      }
      setRevealMessage(DRAW_REVEAL_MESSAGES[Math.floor(Math.random() * DRAW_REVEAL_MESSAGES.length)]);
      setIsDrawing(true);
      setTimeout(() => {
        const pick = pool[Math.floor(Math.random() * pool.length)];
        setIsDrawing(false);
        const target = { pathname: '/talk/[id]', params: { id: pick.id } } as const;
        if (options?.replace) {
          router.replace(target);
        } else {
          router.push(target);
        }
      }, REVEAL_DURATION_MS);
    },
    [scopeMatches, router],
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
