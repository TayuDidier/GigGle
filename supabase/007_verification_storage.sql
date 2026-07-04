-- Migration 007: Storage bucket + RLS policies for verification documents
-- Run in Supabase SQL Editor (or via MCP apply_migration)

-- 1. Create the verification-docs bucket (PRIVATE — unlike avatars, these are
--    sensitive documents; URLs are only readable via short-lived signed URLs)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'verification-docs',
  'verification-docs',
  FALSE,
  5242880,  -- 5 MB (ID scans / PDFs run bigger than avatar photos)
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE
  SET public             = FALSE,
      file_size_limit    = 5242880,
      allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];


-- 2. Storage RLS policies for the verification-docs bucket
--    File naming convention: {auth.uid()}/id-document.{ext}         (single, upserted)
--                             {auth.uid()}/credential-{uuid}.{ext}   (one per optional doc)
--    Per-user sub-folder (unlike avatars' flat naming) since each user has multiple files here.

DROP POLICY IF EXISTS "Verification docs: owner upload" ON storage.objects;
CREATE POLICY "Verification docs: owner upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'verification-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Verification docs: owner update" ON storage.objects;
CREATE POLICY "Verification docs: owner update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'verification-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Verification docs: owner delete" ON storage.objects;
CREATE POLICY "Verification docs: owner delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'verification-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Private bucket: SELECT (needed for createSignedUrl) is owner-only, plus admins
-- so they can review any user's submitted documents.
DROP POLICY IF EXISTS "Verification docs: owner or admin read" ON storage.objects;
CREATE POLICY "Verification docs: owner or admin read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'verification-docs'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.auth_role() = 'admin'
    )
  );
