-- Migration 006: Identity verification + optional experience/skills documents
-- Run in Supabase SQL Editor (or via MCP apply_migration)

-- 1. Enum
CREATE TYPE public.verification_status AS ENUM ('unverified', 'pending', 'approved', 'rejected');

-- 2. profiles: new verification columns
ALTER TABLE public.profiles
  ADD COLUMN verification_status verification_status NOT NULL DEFAULT 'unverified',
  ADD COLUMN id_document_url TEXT,
  ADD COLUMN verification_submitted_at TIMESTAMPTZ,
  ADD COLUMN verification_reviewed_by UUID REFERENCES public.profiles(id),
  ADD COLUMN verification_reviewed_at TIMESTAMPTZ,
  ADD COLUMN verification_rejection_reason TEXT CHECK (char_length(verification_rejection_reason) <= 500);

ALTER TABLE public.profiles
  ADD CONSTRAINT verification_rejection_needs_reason
  CHECK (verification_status != 'rejected' OR verification_rejection_reason IS NOT NULL);

CREATE INDEX idx_profiles_verification_status ON public.profiles(verification_status);


-- 3. credentials: optional supporting documents (certificates, work photos, references)
--    One row per uploaded file — same "event table, FK to profiles" shape as ratings/applications.
--    Purely a trust signal for admins; never gates anything.
CREATE TABLE public.credentials (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_url    TEXT NOT NULL,
  file_name   TEXT,
  doc_type    TEXT DEFAULT 'other' CHECK (doc_type IN ('certificate', 'photo_proof', 'reference_note', 'other')),
  description TEXT CHECK (char_length(description) <= 300),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_credentials_profile_id ON public.credentials(profile_id);

ALTER TABLE public.credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Credentials: owner and admin can read"
  ON public.credentials FOR SELECT TO authenticated
  USING (profile_id = public.auth_profile_id() OR public.auth_role() = 'admin');

CREATE POLICY "Credentials: owner can insert"
  ON public.credentials FOR INSERT TO authenticated
  WITH CHECK (profile_id = public.auth_profile_id());

CREATE POLICY "Credentials: owner can delete"
  ON public.credentials FOR DELETE TO authenticated
  USING (profile_id = public.auth_profile_id());


-- 4. Helper: is the calling user's own profile approved?
CREATE OR REPLACE FUNCTION public.auth_is_verified()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT verification_status = 'approved' FROM public.profiles WHERE user_id = auth.uid();
$$;


-- 5. Guard trigger — the load-bearing security piece.
--    The existing "users can update their own profile" RLS policy has no column
--    restriction, so without this trigger a user could self-approve via a plain
--    .update({ verification_status: 'approved' }) call.
CREATE OR REPLACE FUNCTION public.guard_verification_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF public.auth_role() = 'admin' THEN
    -- Admin review path: allow the status change, but server-stamp who/when
    -- and require a reason whenever rejecting.
    IF NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
      IF NEW.verification_status = 'rejected'
         AND (NEW.verification_rejection_reason IS NULL OR char_length(trim(NEW.verification_rejection_reason)) = 0) THEN
        RAISE EXCEPTION 'Rejection reason is required';
      END IF;
      NEW.verification_reviewed_by := public.auth_profile_id();
      NEW.verification_reviewed_at := NOW();
      IF NEW.verification_status = 'approved' THEN
        NEW.verification_rejection_reason := NULL;
      END IF;
    END IF;
  ELSE
    -- Self-service path: status/review fields can never be set directly by the owner.
    IF NEW.verification_status IS DISTINCT FROM OLD.verification_status
       OR NEW.verification_reviewed_by IS DISTINCT FROM OLD.verification_reviewed_by
       OR NEW.verification_reviewed_at IS DISTINCT FROM OLD.verification_reviewed_at THEN
      NEW.verification_status := OLD.verification_status;
      NEW.verification_reviewed_by := OLD.verification_reviewed_by;
      NEW.verification_reviewed_at := OLD.verification_reviewed_at;
      NEW.verification_rejection_reason := OLD.verification_rejection_reason;
    END IF;

    -- Submitting (or resubmitting) an ID document is the one self-service action
    -- allowed to move status — always back to 'pending', clearing any prior review.
    IF NEW.id_document_url IS DISTINCT FROM OLD.id_document_url AND NEW.id_document_url IS NOT NULL THEN
      NEW.verification_status := 'pending';
      NEW.verification_rejection_reason := NULL;
      NEW.verification_reviewed_by := NULL;
      NEW.verification_reviewed_at := NULL;
      NEW.verification_submitted_at := NOW();
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER guard_verification_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_verification_fields();


-- 6. RLS hardening: require approval to post jobs / apply — DB-level backstop
--    behind the UI-level RequireVerification route guard.
DROP POLICY IF EXISTS "Jobs: employers can insert jobs" ON public.jobs;
CREATE POLICY "Jobs: employers can insert jobs"
  ON public.jobs FOR INSERT TO authenticated
  WITH CHECK (
    employer_id = public.auth_profile_id()
    AND public.auth_role() = 'employer'
    AND public.auth_is_verified()
  );

DROP POLICY IF EXISTS "Applications: workers can insert applications" ON public.applications;
CREATE POLICY "Applications: workers can insert applications"
  ON public.applications FOR INSERT TO authenticated
  WITH CHECK (
    worker_id = public.auth_profile_id()
    AND public.auth_role() = 'worker'
    AND public.auth_is_verified()
  );


-- 7. Admin read RPC — needed because the plain profiles SELECT policy is
--    suspension-gated with no admin bypass (same reason admin_get_users exists).
CREATE OR REPLACE FUNCTION public.admin_get_verifications(p_status TEXT DEFAULT NULL)
RETURNS TABLE (
  id                             UUID,
  user_id                        UUID,
  full_name                      TEXT,
  role                           public.user_role,
  email                          TEXT,
  is_suspended                   BOOLEAN,
  verification_status            public.verification_status,
  id_document_url                TEXT,
  verification_submitted_at      TIMESTAMPTZ,
  verification_reviewed_at       TIMESTAMPTZ,
  verification_rejection_reason  TEXT,
  credentials_count              BIGINT,
  created_at                     TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF (SELECT p.role FROM public.profiles p WHERE p.user_id = auth.uid()) != 'admin' THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN QUERY
  SELECT
    p.id, p.user_id, p.full_name, p.role, u.email::text,
    p.is_suspended, p.verification_status,
    p.id_document_url, p.verification_submitted_at,
    p.verification_reviewed_at, p.verification_rejection_reason,
    (SELECT COUNT(*) FROM public.credentials c WHERE c.profile_id = p.id) AS credentials_count,
    p.created_at
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.user_id
  WHERE (p_status IS NULL OR p.verification_status::text = p_status)
  ORDER BY p.verification_submitted_at ASC NULLS LAST, p.created_at DESC;
END;
$$;
