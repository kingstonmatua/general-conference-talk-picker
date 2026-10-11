import { useEffect, useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';

import { WebSidebarWidth } from '@/constants/theme';

// Below this window width the web build drops the desktop sidebar for a
// native-style bottom tab bar (app-tabs.web.tsx) — a 240px sidebar left a
// phone browser with a squeezed strip of content.
const PhoneWebBreakpoint = 768;

/**
 * True for the web build in a phone-sized window. Always false on native.
 * Stays false until after the first render: the static export's HTML is
 * pre-rendered at desktop layout, and switching layouts during hydration
 * would throw a hydration mismatch (React error #418).
 */
export function useIsPhoneWeb() {
  const { width } = useWindowDimensions();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return Platform.OS === 'web' && hydrated && width > 0 && width < PhoneWebBreakpoint;
}

/**
 * How far the content column sits from the window's left edge — the
 * sidebar's width on desktop web, 0 on phone web and native. Full-screen
 * Modals offset by this to center over the content, not the window.
 */
export function useSidebarOffset() {
  const isPhoneWeb = useIsPhoneWeb();
  return Platform.OS === 'web' && !isPhoneWeb ? WebSidebarWidth : 0;
}
