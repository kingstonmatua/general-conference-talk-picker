import { useLocalSearchParams, useRouter } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon, Ionicons } from '@/components/ui/icon';
import { SessionTag } from '@/components/ui/tag';
import { MaxContentWidth, Palette, Spacing } from '@/constants/theme';
import { formatTalkMeta, getTalkById } from '@/data/talks';
import { useDrawRandomTalk } from '@/hooks/use-draw-random-talk';
import { useTalkStatus } from '@/hooks/use-talk-status';

export default function TalkDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getStatus, markStudied, unmarkStudied, setFavorite } = useTalkStatus();
  const drawRandomTalk = useDrawRandomTalk();

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
            <Button
              label="Read the talk →"
              variant="primary"
              onPress={() => Linking.openURL(talk.url)}
              style={styles.fullWidthButton}
            />

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
          </Card>

          <Pressable
            onPress={() => drawRandomTalk({ replace: true, useScope: true, excludeId: talk.id })}
            hitSlop={8}
            style={styles.drawAnotherRow}>
            <Icon name="draw" size={18} color={Palette.conferencePurple} />
            <ThemedText type="control" style={{ color: Palette.conferencePurple }}>
              Draw another talk
            </ThemedText>
          </Pressable>
          <Pressable onPress={() => router.push('/draw')} hitSlop={8} style={styles.drawAnotherRow}>
            <ThemedText type="control" themeColor="textSecondary">
              Change scope
            </ThemedText>
          </Pressable>
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
  drawAnotherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    alignSelf: 'center',
    marginTop: Spacing.md,
  },
});
