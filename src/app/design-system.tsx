import { Image } from 'expo-image';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AppIconNames, Icon, type AppIconName } from '@/components/ui/icon';
import { PageFoldIcon } from '@/components/ui/page-fold-icon';
import { SessionTag, Tag } from '@/components/ui/tag';
import {
  BottomTabInset,
  MaxContentWidth,
  Palette,
  SessionCategoryTag,
  Spacing,
  type SessionCategory,
} from '@/constants/theme';

const ALL_ICON_NAMES = Object.keys(AppIconNames) as AppIconName[];

const PALETTE_SWATCHES: { name: string; token: keyof typeof Palette; usage: string }[] = [
  { name: 'Canvas', token: 'canvas', usage: 'Primary background' },
  { name: 'Surface', token: 'surface', usage: 'Cards and sheets' },
  { name: 'Purple ink', token: 'purpleInk', usage: 'Headlines / selected' },
  { name: 'Secondary ink', token: 'secondaryInk', usage: 'Metadata / body' },
  { name: 'Champagne', token: 'champagne', usage: 'Primary CTA / progress' },
  { name: 'Gold ink', token: 'goldInk', usage: 'Text on champagne' },
  { name: 'Conference purple', token: 'conferencePurple', usage: 'Links / focus ring' },
  { name: 'Sage', token: 'sage', usage: 'Completed / growth' },
  { name: 'Terracotta', token: 'terracotta', usage: 'Streak / warmth' },
  { name: 'Dusty blue', token: 'dustyBlue', usage: 'Session categories' },
  { name: 'Warm border', token: 'warmBorder', usage: 'Decorative separators' },
  { name: 'Soft lavender', token: 'softLavender', usage: 'Saved state / selection' },
];

const ALL_SESSION_CATEGORIES = Object.keys(SessionCategoryTag) as SessionCategory[];

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <View style={styles.sectionHeading}>
      <ThemedText type="eyebrow" style={{ color: Palette.goldInk }}>
        {eyebrow}
      </ThemedText>
      <ThemedText type="section">{title}</ThemedText>
    </View>
  );
}

export default function DesignSystemScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* 01 — Identity */}
          <SectionHeading eyebrow="01 · Identity" title="Preserved, unchanged" />
          <Card style={styles.identityCard}>
            <Image
              source={require('@/assets/images/brand/main-logo.png')}
              style={styles.logo}
              contentFit="contain"
            />
            <ThemedText type="body" themeColor="textSecondary">
              Original mark, wordmark and tagline as supplied. No tracing, recoloring, retyping or
              proportion changes.
            </ThemedText>
          </Card>

          {/* 02 — Type */}
          <SectionHeading eyebrow="02 · The editorial voice" title="Georgia + Arial" />
          <Card style={styles.stack}>
            <ThemedText type="display">Study with intention.</ThemedText>
            <ThemedText type="section">A quiet place to begin.</ThemedText>
            <ThemedText type="body">
              Body copy runs in Arial at 16/24 — this is what most reading paragraphs and
              descriptions will use throughout the app.
            </ThemedText>
            <ThemedText type="control">Control label · Arial 15/20 bold</ThemedText>
            <ThemedText type="metadata" themeColor="textSecondary">
              Metadata · Arial 13/18 regular
            </ThemedText>
            <ThemedText type="eyebrow" style={{ color: Palette.goldInk }}>
              Eyebrow label
            </ThemedText>
          </Card>

          {/* 03 — Materials & rhythm */}
          <SectionHeading eyebrow="03 · Materials & rhythm" title="Warm paper. Fine rules." />
          <Card>
            <ThemedText type="body" themeColor="textSecondary" style={{ marginBottom: Spacing.md }}>
              Spacing scale (px):
            </ThemedText>
            <View style={styles.spacingRow}>
              {[4, 8, 12, 16, 24, 32, 48].map((value) => (
                <View key={value} style={styles.spacingItem}>
                  <View style={[styles.spacingBar, { width: value, height: value }]} />
                  <ThemedText type="metadata" themeColor="textSecondary">
                    {value}
                  </ThemedText>
                </View>
              ))}
            </View>
          </Card>

          {/* 04 — Color */}
          <SectionHeading eyebrow="04 · Color vocabulary" title="Neutral field, small semantic accents" />
          <Card>
            <View style={styles.swatchGrid}>
              {PALETTE_SWATCHES.map((swatch) => (
                <View key={swatch.token} style={styles.swatchItem}>
                  <View
                    style={[
                      styles.swatchChip,
                      { backgroundColor: Palette[swatch.token] },
                      (swatch.token === 'canvas' || swatch.token === 'surface') && styles.swatchChipBordered,
                    ]}
                  />
                  <ThemedText type="control">{swatch.name}</ThemedText>
                  <ThemedText type="metadata" themeColor="textSecondary">
                    {Palette[swatch.token]}
                  </ThemedText>
                  <ThemedText type="metadata" themeColor="textSecondary">
                    {swatch.usage}
                  </ThemedText>
                </View>
              ))}
            </View>
          </Card>

          {/* 05 — Actions & talk cards */}
          <SectionHeading eyebrow="05 · Actions & talk cards" title="One primary action per view" />
          <Card style={styles.stack}>
            <View style={styles.buttonRow}>
              <Button label="Begin today's study →" variant="primary" />
              <Button label="Pick another" variant="secondary" />
            </View>
          </Card>

          <Card style={styles.talkCard}>
            <SessionTag category="SUNDAY_MORNING" />
            <ThemedText type="section">A moment of reflection</ThemedText>
            <ThemedText type="body" themeColor="textSecondary">
              Speaker name · Conference date
            </ThemedText>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: '72%' }]} />
            </View>
            <ThemedText type="control" style={{ color: Palette.conferencePurple }}>
              Continue study →
            </ThemedText>
          </Card>

          {/* 06 — Progress, saved & sessions */}
          <SectionHeading eyebrow="06 · Progress, saved & sessions" title="All session tags" />
          <Card>
            <View style={styles.tagGrid}>
              {ALL_SESSION_CATEGORIES.map((category) => (
                <SessionTag key={category} category={category} />
              ))}
            </View>
          </Card>

          <Card style={styles.stack}>
            <ThemedText type="body" themeColor="textSecondary">
              Studied / saved indicators reuse the same tag component with their own semantic
              colors:
            </ThemedText>
            <View style={styles.tagGrid}>
              <Tag label="Studied" color="sage" />
              <Tag label="Saved" color="lavender" />
              <Tag label="Streak" color="terracotta" />
            </View>
          </Card>

          {/* 07 — Navigation */}
          <SectionHeading eyebrow="07 · Navigation" title="Home · Browse · Progress · Saved" />
          <Card>
            <View style={styles.navPreview}>
              {['Home', 'Browse', 'Progress', 'Saved'].map((label, index) => (
                <View key={label} style={styles.navItem}>
                  <ThemedText
                    type="control"
                    style={{ color: index === 0 ? Palette.purpleInk : Palette.secondaryInk }}>
                    {label}
                  </ThemedText>
                  {index === 0 && <ThemedText style={{ color: Palette.goldInk }}>⌄</ThemedText>}
                </View>
              ))}
            </View>
          </Card>

          {/* 07 — Icons & signature motif */}
          <SectionHeading eyebrow="07 · Icons & signature" title="24px grid, rounded stroke" />
          <Card>
            <View style={styles.iconGrid}>
              {ALL_ICON_NAMES.map((name) => (
                <View key={name} style={styles.iconItem}>
                  <Icon name={name} size={24} />
                  <ThemedText type="metadata" themeColor="textSecondary">
                    {name}
                  </ThemedText>
                </View>
              ))}
            </View>
          </Card>

          <Card style={styles.stack}>
            <ThemedText type="body" themeColor="textSecondary">
              Open-book / page-fold signature motif — decoration only, one moment per module, never
              a replacement for the logo:
            </ThemedText>
            <View style={styles.motifRow}>
              {[16, 24, 32, 48].map((size) => (
                <View key={size} style={styles.motifItem}>
                  <PageFoldIcon size={size} />
                  <ThemedText type="metadata" themeColor="textSecondary">
                    {size}px
                  </ThemedText>
                </View>
              ))}
            </View>
          </Card>

          <ThemedText type="metadata" themeColor="textSecondary" style={styles.footnote}>
            Source: Design/GPT Mock Images/talk-picker-v2-brand-board.pdf — this screen is a living
            reference, not a final app screen.
          </ThemedText>
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
    gap: Spacing.lg,
  },
  sectionHeading: {
    marginTop: Spacing.xl,
    gap: Spacing.xs,
  },
  identityCard: {
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  logo: {
    width: 220,
    height: 80,
  },
  stack: {
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  spacingRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.lg,
    flexWrap: 'wrap',
  },
  spacingItem: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  spacingBar: {
    backgroundColor: Palette.conferencePurple,
    borderRadius: 2,
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
  },
  swatchItem: {
    width: 140,
    gap: 2,
  },
  swatchChip: {
    width: '100%',
    height: 56,
    borderRadius: 8,
    marginBottom: Spacing.xs,
  },
  swatchChipBordered: {
    borderWidth: 1,
    borderColor: Palette.warmBorder,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  talkCard: {
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.warmBorder,
    width: '100%',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Palette.champagne,
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xl,
  },
  iconItem: {
    alignItems: 'center',
    gap: Spacing.xs,
    width: 72,
  },
  motifRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.xl,
    flexWrap: 'wrap',
  },
  motifItem: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  navPreview: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  navItem: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  footnote: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.xxl,
    textAlign: 'center',
  },
});
