import * as WebBrowser from 'expo-web-browser';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon, Ionicons } from '@/components/ui/icon';
import { SessionTag } from '@/components/ui/tag';
import { MaxContentWidth, Palette, Spacing } from '@/constants/theme';
import { formatTalkMeta, getTalkById } from '@/data/talks';
import { useTalkStatus } from '@/hooks/use-talk-status';

export default function TalkDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getStatus, markStudied, unmarkStudied, setFavorite } = useTalkStatus();

  const talk = id ? getTalkById(id) : undefined;

  if (!talk) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <ThemedText type="section">Talk not found</ThemedText>
          <ThemedText type="body" themeColor="textSecondary">
            This talk doesn’t exist, or the link is out of date.
          </ThemedText>
          <Button label="Back" variant="secondary" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const status = getStatus(talk.id);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backRow}>
            <Ionicons name="chevron-back" size={18} color={Palette.secondaryInk} />
            <ThemedText type="control" themeColor="textSecondary">
              Back
            </ThemedText>
          </Pressable>

          <View style={styles.header}>
            <SessionTag category={talk.category} />
            <Pressable onPress={() => setFavorite(talk.id, !status.isFavorite)} hitSlop={8}>
              <Icon
                name={status.isFavorite ? 'savedFilled' : 'saved'}
                size={22}
                color={status.isFavorite ? Palette.conferencePurple : Palette.secondaryInk}
              />
            </Pressable>
          </View>

          <ThemedText type="display">{talk.title}</ThemedText>
          <ThemedText type="body" themeColor="textSecondary">
            {formatTalkMeta(talk)}
          </ThemedText>

          <Card style={styles.actionsCard}>
            {status.isStudied ? (
              <Button
                label="Studied ✓ — Mark as not studied"
                variant="secondary"
                onPress={() => unmarkStudied(talk.id)}
                style={styles.fullWidthButton}
              />
            ) : (
              <Button
                label="Mark as studied"
                variant="primary"
                onPress={() => markStudied(talk.id)}
                style={styles.fullWidthButton}
              />
            )}

            <Button
              label={status.isFavorite ? 'Saved ✓ — Remove from Saved' : 'Save for later'}
              variant="secondary"
              onPress={() => setFavorite(talk.id, !status.isFavorite)}
              style={styles.fullWidthButton}
            />

            <Button
              label="Read on churchofjesuschrist.org →"
              variant="primary"
              onPress={() => WebBrowser.openBrowserAsync(talk.url)}
              style={styles.fullWidthButton}
            />
          </Card>
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
    paddingBottom: Spacing.xxxl,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    gap: Spacing.md,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    alignSelf: 'flex-start',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: Spacing.md,
  },
  actionsCard: {
    gap: Spacing.sm,
    alignItems: 'stretch',
    marginTop: Spacing.lg,
  },
  fullWidthButton: {
    alignSelf: 'stretch',
    alignItems: 'center',
  },
});
