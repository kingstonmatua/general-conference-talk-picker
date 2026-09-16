-- General Conference Talk Picker — profile picture storage
--
-- Adds a public "avatars" Storage bucket + Row Level Security policies
-- on storage.objects scoped to it. Run once in the Supabase SQL Editor
-- (Project → SQL Editor → New query) — same project V1/V2 already share.
--
-- Upload path convention: the app always uploads to "<user id>.jpg"
-- (see updateAvatar in src/hooks/use-auth.tsx), so a user can only ever
-- overwrite the one file named after their own auth.uid() — the INSERT/
-- UPDATE policies below enforce that same rule server-side too, not just
-- client-side.
--
-- Paste this as ONE block first. If the editor mangles it, split at each
-- blank line into separate pastes — same fallback used for schema.sql.

-- ─── bucket ─────────────────────────────────────────────────────────────────
-- Public so getPublicUrl() gives back a URL that resolves without needing
-- a signed-URL refresh flow — fine for profile pictures, nothing private.

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- ─── read ───────────────────────────────────────────────────────────────────

create policy "Avatar images are publicly readable"
on storage.objects for select
using (bucket_id = 'avatars');

-- ─── write ──────────────────────────────────────────────────────────────────
-- storage.foldername/filename helpers aren't needed here since the app
-- uploads flat files named "<uid>.jpg", not "<uid>/photo.jpg" — comparing
-- the object's own name against auth.uid() directly is enough.

create policy "Users can upload their own avatar"
on storage.objects for insert
to authenticated
with check (bucket_id = 'avatars' and name = auth.uid()::text || '.jpg');

create policy "Users can replace their own avatar"
on storage.objects for update
to authenticated
using (bucket_id = 'avatars' and name = auth.uid()::text || '.jpg')
with check (bucket_id = 'avatars' and name = auth.uid()::text || '.jpg');
