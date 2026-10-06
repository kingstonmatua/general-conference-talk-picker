import { useEffect, useState } from 'react';
import { Platform, Pressable, Share, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { PersonRow } from '@/components/social/person-row';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SearchField } from '@/components/ui/search-field';
import { Palette, Radii, Spacing } from '@/constants/theme';
import { useSocial, type Relationship, type SearchResult } from '@/hooks/use-social';

/**
 * Friends section of the Social tab (SOCIAL_PLAN.md step 5): invite link,
 * username search, incoming requests, friends, and requests you've sent.
 * Every change goes through useSocial(), which reloads the friend list
 * afterwards, so the lists here never need patching by hand.
 */
export function FriendsSection() {
  const { friends, incomingRequests, outgoingRequests } = useSocial();

  return (
    <View style={styles.section}>
      <InviteCard />
      <SearchCard />

      {incomingRequests.length > 0 && (
        <Card style={styles.card}>
          <ThemedText type="section">Friend requests</ThemedText>
          {incomingRequests.map((p) => (
            <IncomingRow key={p.userId} userId={p.userId} username={p.username} avatarUrl={p.avatarUrl} />
          ))}
        </Card>
      )}

      <Card style={styles.card}>
        <ThemedText type="section">Friends{friends.length > 0 ? ` (${friends.length})` : ''}</ThemedText>
        {friends.length === 0 ? (
          <ThemedText type="body" themeColor="textSecondary">
            No friends yet. Search for someone above, or share your invite link.
          </ThemedText>
        ) : (
          friends.map((p) => (
            <FriendRow key={p.userId} userId={p.userId} username={p.username} avatarUrl={p.avatarUrl} />
          ))
        )}
      </Card>

      {outgoingRequests.length > 0 && (
        <Card style={styles.card}>
          <ThemedText type="section">Sent requests</ThemedText>
          {outgoingRequests.map((p) => (
            <OutgoingRow key={p.userId} userId={p.userId} username={p.username} avatarUrl={p.avatarUrl} />
          ))}
        </Card>
      )}
    </View>
  );
}

function InviteCard() {
  const { getInviteLink, regenerateInviteLink } = useSocial();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmingNew, setConfirmingNew] = useState(false);

  const share = async () => {
    setBusy(true);
    setMessage(null);
    const { data: link, error } = await getInviteLink();
    setBusy(false);
    if (error || !link) return setMessage(error ?? 'Something went wrong. Please try again.');

    const text = `Study General Conference talks with me! Tap to add me as a friend: ${link}`;
    if (Platform.OS !== 'web') {
      await Share.share({ message: text });
      return;
    }
    // Browsers: the share sheet where there is one (phones), otherwise copy.
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ text, url: link });
      } else {
        await navigator.clipboard.writeText(link);
        setMessage('Invite link copied. Paste it to a friend.');
      }
    } catch {
      // Closing the share sheet throws; nothing to report.
    }
  };

  const makeNewLink = async () => {
    setBusy(true);
    const { error } = await regenerateInviteLink();
    setBusy(false);
    setConfirmingNew(false);
    setMessage(error ?? 'New link made. Links you shared before no longer work.');
  };

  return (
    <Card style={styles.card}>
      <ThemedText type="section">Invite friends</ThemedText>
      <ThemedText type="body" themeColor="textSecondary">
        Send your link to someone. When they open it and accept, you're friends right away.
      </ThemedText>
      <Button label={busy ? 'One moment…' : 'Share invite link'} variant="primary" disabled={busy} onPress={share} />
      {message && (
        <ThemedText type="metadata" themeColor="textSecondary">
          {message}
        </ThemedText>
      )}
      {confirmingNew ? (
        <View style={styles.confirmRow}>
          <ThemedText type="metadata" themeColor="textSecondary" style={styles.flex}>
            Links you already shared will stop working.
          </ThemedText>
          <RowAction label="Make new link" onPress={makeNewLink} disabled={busy} />
          <RowAction label="Cancel" quiet onPress={() => setConfirmingNew(false)} />
        </View>
      ) : (
        <Pressable onPress={() => setConfirmingNew(true)} hitSlop={8}>
          <ThemedText type="metadata" style={styles.link}>
            Make a new link (stops old ones working)
          </ThemedText>
        </Pressable>
      )}
    </Card>
  );
}

function SearchCard() {
  const { searchProfiles, sendFriendRequest, respondToRequest, cancelRequest } = useSocial();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const trimmed = query.replace(/[\s@]/g, '');

  // Wait for a pause in typing before searching.
  useEffect(() => {
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const result = await searchProfiles(trimmed);
      if (cancelled) return;
      setError(result.error);
      setResults(result.data ?? []);
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmed, searchProfiles]);

  const setRelationship = (userId: string, relationship: Relationship) =>
    setResults((prev) => prev.map((r) => (r.userId === userId ? { ...r, relationship } : r)));

  const act = async (person: SearchResult) => {
    setBusyId(person.userId);
    setError(null);
    if (person.relationship === 'none') {
      const result = await sendFriendRequest(person.userId);
      if (result.error) setError(result.error);
      else setRelationship(person.userId, result.data ?? 'outgoing');
    } else if (person.relationship === 'incoming') {
      const result = await respondToRequest(person.userId, true);
      if (result.error) setError(result.error);
      else setRelationship(person.userId, 'friend');
    } else if (person.relationship === 'outgoing') {
      const result = await cancelRequest(person.userId);
      if (result.error) setError(result.error);
      else setRelationship(person.userId, 'none');
    }
    setBusyId(null);
  };

  return (
    <Card style={styles.card}>
      <ThemedText type="section">Find friends</ThemedText>
      <SearchField value={query} onChangeText={setQuery} placeholder="Search by username" />
      {error && (
        <ThemedText type="metadata" style={styles.error}>
          {error}
        </ThemedText>
      )}
      {trimmed.length >= 2 && results.length === 0 && !error && (
        <ThemedText type="body" themeColor="textSecondary">
          No one with a username starting “{trimmed.toLowerCase()}”.
        </ThemedText>
      )}
      {results.map((person) => (
        <PersonRow key={person.userId} username={person.username} avatarUrl={person.avatarUrl}>
          {person.relationship === 'friend' ? (
            <ThemedText type="metadata" themeColor="textSecondary">
              Friends
            </ThemedText>
          ) : (
            <RowAction
              label={
                person.relationship === 'none' ? 'Add' : person.relationship === 'incoming' ? 'Accept' : 'Requested ✕'
              }
              quiet={person.relationship === 'outgoing'}
              disabled={busyId === person.userId}
              onPress={() => act(person)}
            />
          )}
        </PersonRow>
      ))}
    </Card>
  );
}

type RowProps = { userId: string; username: string; avatarUrl: string | null };

function IncomingRow({ userId, username, avatarUrl }: RowProps) {
  const { respondToRequest } = useSocial();
  const [busy, setBusy] = useState(false);
  const respond = async (accept: boolean) => {
    setBusy(true);
    await respondToRequest(userId, accept);
    setBusy(false);
  };
  return (
    <PersonRow username={username} avatarUrl={avatarUrl} note="Wants to be friends">
      <RowAction label="Accept" disabled={busy} onPress={() => respond(true)} />
      <RowAction label="Decline" quiet disabled={busy} onPress={() => respond(false)} />
    </PersonRow>
  );
}

function FriendRow({ userId, username, avatarUrl }: RowProps) {
  const { removeFriend } = useSocial();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <PersonRow username={username} avatarUrl={avatarUrl}>
      {confirming ? (
        <>
          <RowAction
            label="Remove"
            disabled={busy}
            onPress={async () => {
              setBusy(true);
              await removeFriend(userId);
              setBusy(false);
            }}
          />
          <RowAction label="Keep" quiet onPress={() => setConfirming(false)} />
        </>
      ) : (
        <RowAction label="Remove" quiet onPress={() => setConfirming(true)} />
      )}
    </PersonRow>
  );
}

function OutgoingRow({ userId, username, avatarUrl }: RowProps) {
  const { cancelRequest } = useSocial();
  const [busy, setBusy] = useState(false);
  return (
    <PersonRow username={username} avatarUrl={avatarUrl} note="Waiting for them to accept">
      <RowAction
        label="Cancel"
        quiet
        disabled={busy}
        onPress={async () => {
          setBusy(true);
          await cancelRequest(userId);
          setBusy(false);
        }}
      />
    </PersonRow>
  );
}

/** Compact pill button for list rows; the full Button is too large here. */
function RowAction({
  label,
  onPress,
  quiet,
  disabled,
}: {
  label: string;
  onPress: () => void;
  quiet?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      style={({ pressed }) => [
        styles.rowAction,
        quiet ? styles.rowActionQuiet : styles.rowActionMain,
        (pressed || disabled) && styles.rowActionDim,
      ]}>
      <ThemedText type="control" style={{ color: quiet ? Palette.secondaryInk : Palette.purpleInk, fontSize: 14 }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.lg,
  },
  card: {
    gap: Spacing.md,
    alignItems: 'stretch',
  },
  confirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  flex: {
    flex: 1,
  },
  link: {
    color: Palette.conferencePurple,
  },
  error: {
    color: Palette.terracotta,
  },
  rowAction: {
    borderRadius: Radii.button,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    minHeight: 36,
    justifyContent: 'center',
  },
  rowActionMain: {
    backgroundColor: Palette.champagne,
    borderColor: Palette.champagne,
  },
  rowActionQuiet: {
    backgroundColor: Palette.surface,
    borderColor: Palette.warmBorder,
  },
  rowActionDim: {
    opacity: 0.6,
  },
});
