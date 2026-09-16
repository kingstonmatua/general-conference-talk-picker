import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { HeroBanner } from '@/components/ui/hero-banner';
import { Pill } from '@/components/ui/pill';
import { SearchField } from '@/components/ui/search-field';
import { TalkCard } from '@/components/ui/talk-card';
import { BottomTabInset, MaxContentWidth, Palette, Spacing } from '@/constants/theme';
import { formatTalkMeta, getTalkById } from '@/data/talks';
import { useAuth } from '@/hooks/use-auth';
import { useTalkStatus } from '@/hooks/use-talk-status';

const STATUS_FILTERS = ['Any status', 'Not studied', 'Studied'] as const;

export default function SavedScreen() {
  const { user, promptSignIn } = useAuth();
  const { favoriteIds, getStatus, setFavorite } = useTalkStatus();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>('Any status');

  const savedTalks = useMemo(
    () => favoriteIds.map((id) => getTalkById(id)).filter((t) => t !== undefined),
    [favoriteIds],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return savedTalks.filter((talk) => {
      const isStudied = getStatus(talk.id).isStudied;
      if (status === 'Not studied' && isStudied) return false;
      if (status === 'Studied' && !isStudied) return false;
      if (!q) return true;
      return talk.title.toLowerCase().includes(q) || talk.speaker.toLowerCase().includes(q);
    });
  }, [savedTalks, query, status, getStatus]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroWrap}>
          <HeroBanner source={require('@/assets/images/hero/laie-hawaii-temple.png')}>
            <ThemedText type="display" style={styles.heroHeadline}>
              Words to return to.
            </ThemedText>
            <ThemedText type="body" style={styles.heroSubhead}>
              Your saved messages, ready when you need them.
            </ThemedText>
          </HeroBanner>
        </View>

        <View style={styles.content}>
          {!user ? (
            <View style={styles.signedOutState}>
              <ThemedText type="body" themeColor="textSecondary">
                Sign in to save talks and see them here.
              </ThemedText>
              <Button label="Sign in" variant="primary" onPress={promptSignIn} />
            </View>
          ) : (
            <>
              <SearchField value={query} onChangeText={setQuery} placeholder="Search your saved talks" />

              <View style={styles.pillRow}>
                {STATUS_FILTERS.map((option) => (
                  <Pill key={option} label={option} selected={status === option} onPress={() => setStatus(option)} />
                ))}
              </View>

              <ThemedText type="metadata" themeColor="textSecondary">
                {results.length} saved
              </ThemedText>

              <View style={styles.list}>
                {results.map((talk) => (
                  <TalkCard
                    key={talk.id}
                    category={talk.category}
                    title={talk.title}
                    meta={formatTalkMeta(talk)}
                    statusLabel={getStatus(talk.id).isStudied ? 'Studied' : 'To study'}
                    favorite
                    onToggleFavorite={() => setFavorite(talk.id, false)}
                    onPress={() => router.push({ pathname: '/talk/[id]', params: { id: talk.id } })}
                  />
                ))}
                {results.length === 0 && savedTalks.length > 0 && (
                  <ThemedText type="body" themeColor="textSecondary">
                    No saved talks match that search and filter combination.
                  </ThemedText>
                )}
                {savedTalks.length === 0 && (
                  <ThemedText type="body" themeColor="textSecondary">
                    Nothing saved yet — tap the bookmark icon on any talk in Browse to add it here.
                  </ThemedText>
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.canvas,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: BottomTabInset + Spacing.xxxl,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    gap: Spacing.lg,
  },
  heroWrap: {
    width: '100%',
  },
  heroHeadline: {
    color: Palette.purpleInk,
  },
  heroSubhead: {
    color: Palette.secondaryInk,
  },
  pillRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  list: {
    gap: Spacing.md,
  },
  signedOutState: {
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
});
