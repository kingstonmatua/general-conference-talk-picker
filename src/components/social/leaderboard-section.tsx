import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { PersonRow } from '@/components/social/person-row';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Ionicons } from '@/components/ui/icon';
import { Pill } from '@/components/ui/pill';
import { Palette, Spacing } from '@/constants/theme';
import { TALKS } from '@/data/talks';
import { useSocial, type LeaderboardRow } from '@/hooks/use-social';

type Board = 'talks' | 'current' | 'longest';
type Period = 'week' | 'month' | 'all';

const BOARDS: { key: Board; label: string }[] = [
  { key: 'talks', label: 'Talks studied' },
  { key: 'current', label: 'Current streak' },
  { key: 'longest', label: 'Longest streak' },
];

const PERIODS: { key: Period; label: string }[] = [
  { key: 'week', label: 'This week' },
  { key: 'month', label: 'This month' },
  { key: 'all', label: 'All time' },
];

const BOARD_NOTES: Record<Board, Record<Period, string> | string> = {
  talks: {
    week: 'Talks first studied since Monday.',
    month: 'Talks first studied this month.',
    all: 'Every talk marked as studied.',
  },
  current: 'Days in a row with at least one talk studied.',
  longest: 'The longest run of days in a row, ever.',
};

/**
 * Friends leaderboard (SOCIAL_PLAN.md decision 4): Talks studied with a
 * Week / Month / All-time switch, Current streak, Longest streak. Per the
 * brand board it celebrates the top (gold chevron for #1) and never calls
 * out last place: anyone at zero is listed without a rank.
 */
export function LeaderboardSection({ onFindFriends }: { onFindFriends: () => void }) {
  const { leaderboard, refreshLeaderboard, friends } = useSocial();
  const [board, setBoard] = useState<Board>('talks');
  const [period, setPeriod] = useState<Period>('week');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    refreshLeaderboard().finally(() => setLoaded(true));
  }, [refreshLeaderboard]);

  const ranked = useMemo(() => rankRows(leaderboard, (row) => valueFor(row, board, period)), [leaderboard, board, period]);
  const note = typeof BOARD_NOTES[board] === 'string' ? BOARD_NOTES[board] : BOARD_NOTES[board][period];

  return (
    <View style={styles.section}>
      <View style={styles.pillRow}>
        {BOARDS.map((b) => (
          <Pill key={b.key} label={b.label} selected={board === b.key} onPress={() => setBoard(b.key)} />
        ))}
      </View>

      <Card style={styles.card}>
        {board === 'talks' && (
          <View style={styles.pillRow}>
            {PERIODS.map((p) => (
              <Pill
                key={p.key}
                label={p.label}
                selected={period === p.key}
                onPress={() => setPeriod(p.key)}
                color={{ bg: Palette.champagne, text: Palette.purpleInk }}
              />
            ))}
          </View>
        )}
        <ThemedText type="metadata" themeColor="textSecondary">
          {note}
        </ThemedText>

        {!loaded ? (
          <ThemedText type="body" themeColor="textSecondary">
            Loading…
          </ThemedText>
        ) : (
          ranked.map(({ row, rank }) => (
            <PersonRow
              key={row.userId}
              username={row.username}
              avatarUrl={row.avatarUrl}
              note={row.isMe ? 'You' : undefined}>
              <View style={styles.score}>
                <ThemedText type="control">{formatValue(row, board, period)}</ThemedText>
                <Rank rank={rank} />
              </View>
            </PersonRow>
          ))
        )}
      </Card>

      {loaded && friends.length === 0 && (
        <Card style={styles.card}>
          <ThemedText type="section">Add friends to compare</ThemedText>
          <ThemedText type="body" themeColor="textSecondary">
            The leaderboard fills up as your friends join. Find them by username or send an invite link.
          </ThemedText>
          <Button label="Find friends" variant="secondary" onPress={onFindFriends} />
        </Card>
      )}
    </View>
  );
}

function Rank({ rank }: { rank: number | null }) {
  if (rank === null) return <View style={styles.rank} />;
  const first = rank === 1;
  return (
    <View style={styles.rank}>
      {first && <Ionicons name="chevron-up" size={14} color={Palette.goldInk} />}
      <ThemedText type="metadata" style={first ? styles.rankFirst : styles.rankOther}>
        #{rank}
      </ThemedText>
    </View>
  );
}

function valueFor(row: LeaderboardRow, board: Board, period: Period) {
  if (board === 'current') return row.currentStreak;
  if (board === 'longest') return row.longestStreak;
  if (period === 'week') return row.talksThisWeek;
  if (period === 'month') return row.talksThisMonth;
  return row.talksAllTime;
}

function formatValue(row: LeaderboardRow, board: Board, period: Period) {
  const value = valueFor(row, board, period);
  if (value === 0) return '—';
  if (board !== 'talks') return `${value} ${value === 1 ? 'day' : 'days'}`;
  const talks = `${value} ${value === 1 ? 'talk' : 'talks'}`;
  if (period !== 'all') return talks;
  const percent = (value / TALKS.length) * 100;
  return `${talks} · ${percent < 1 ? '<1' : Math.round(percent)}%`;
}

/** Highest first; ties share a rank (1, 1, 3); zeros get no rank. */
function rankRows(rows: LeaderboardRow[], value: (row: LeaderboardRow) => number) {
  const sorted = [...rows].sort((a, b) => value(b) - value(a) || a.username.localeCompare(b.username));
  return sorted.map((row, i) => {
    const v = value(row);
    if (v === 0) return { row, rank: null };
    const firstWithValue = sorted.findIndex((other) => value(other) === v);
    return { row, rank: (firstWithValue === -1 ? i : firstWithValue) + 1 };
  });
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.lg,
  },
  card: {
    gap: Spacing.md,
    alignItems: 'stretch',
  },
  pillRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  score: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  rank: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
    minWidth: 40,
  },
  rankFirst: {
    color: Palette.goldInk,
    fontWeight: '700',
  },
  rankOther: {
    color: Palette.secondaryInk,
  },
});
