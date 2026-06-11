-- Migration 003: Storage bucket + RLS policies for avatars
-- Run in Supabase SQL Editor

-- 1. Create the avatars bucket (public = true → URLs are readable without auth)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  TRUE,
  2097152,  -- 2 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
  SET public             = TRUE,
      file_size_limit    = 2097152,
      allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];


-- 2. Enable RLS on storage.objects (Supabase enables this by default, but be explicit)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;


-- 3. Storage RLS policies for the avatars bucket
--    File naming convention: {auth.uid()}.{ext}  (flat, no sub-folders)

-- 3a. Anyone authenticated can read any avatar (bucket is public but RLS still applies to API)
DROP POLICY IF EXISTS "Avatars: public read" ON storage.objects;
CREATE POLICY "Avatars: public read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');


-- 3b. Authenticated users can upload their own avatar file
DROP POLICY IF EXISTS "Avatars: owner upload" ON storage.objects;
CREATE POLICY "Avatars: owner upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND name LIKE (auth.uid()::text || '.%')
  );


-- 3c. Authenticated users can overwrite (upsert) their own avatar
DROP POLICY IF EXISTS "Avatars: owner update" ON storage.objects;
CREATE POLICY "Avatars: owner update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND name LIKE (auth.uid()::text || '.%')
  );


-- 3d. Authenticated users can delete their own avatar
DROP POLICY IF EXISTS "Avatars: owner delete" ON storage.objects;
CREATE POLICY "Avatars: owner delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND name LIKE (auth.uid()::text || '.%')
  );
