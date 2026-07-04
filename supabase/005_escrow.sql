-- ============================================================================
-- 005_escrow.sql — Escrow payments (Fapshi)
--
-- Replaces the old "pay after completion + acknowledge" flow with a true escrow:
-- employer funds at hire -> platform holds -> employer releases payout to worker
-- on completion. Money moves via Fapshi (MTN MoMo / Orange Money):
--   collection -> Fapshi /direct-pay   (pull from employer)
--   payout     -> Fapshi /payout       (send to worker, gross - commission)
--
-- Applied to project omcakemsuifgfanvepbs as two migrations:
--   005_escrow_enums  (enum changes must commit before the new value is used)
--   006_escrow_table  (table, indexes, RLS, trigger change)
-- This file is the consolidated record of both.
-- ============================================================================

-- ── Part 1: enums ───────────────────────────────────────────────────────────

-- New job state: a worker has been selected but the employer has not yet funded
-- escrow. The job only advances to 'in_progress' once collection is confirmed.
ALTER TYPE public.job_status ADD VALUE IF NOT EXISTS 'awaiting_funding';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'escrow_status') THEN
    CREATE TYPE public.escrow_status AS ENUM (
      'pending_funding',  -- direct-pay initiated, waiting for employer to approve on phone
      'held',             -- collection SUCCESSFUL, funds in platform float
      'releasing',        -- payout to worker initiated
      'released',         -- payout SUCCESSFUL, worker paid
      'refunding',        -- refund payout to employer initiated (dispute)
      'refunded',         -- refund SUCCESSFUL
      'failed'            -- collection or payout FAILED
    );
  END IF;
END$$;

-- ── Part 2: table, indexes, RLS, trigger ────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.escrows (
  id                  UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  job_id              UUID UNIQUE NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  employer_id         UUID NOT NULL REFERENCES public.profiles(id),
  worker_id           UUID NOT NULL REFERENCES public.profiles(id),

  -- Money (whole XAF). gross = employer pays; payout = worker receives; commission = GigGle cut.
  gross_amount        INTEGER NOT NULL CHECK (gross_amount >= 100),
  commission_amount   INTEGER NOT NULL DEFAULT 0 CHECK (commission_amount >= 0),
  payout_amount       INTEGER NOT NULL CHECK (payout_amount >= 0),
  currency            TEXT    NOT NULL DEFAULT 'XAF',

  status              public.escrow_status NOT NULL DEFAULT 'pending_funding',

  -- Collection leg (Fapshi direct-pay from employer)
  collection_trans_id TEXT,
  collection_status   TEXT,
  employer_phone      TEXT,
  provider_in         public.payment_provider,

  -- Payout leg (Fapshi payout to worker)
  payout_trans_id     TEXT,
  payout_status       TEXT,
  worker_phone        TEXT,
  provider_out        public.payment_provider,

  failure_reason      TEXT,
  funded_at           TIMESTAMPTZ,
  released_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_escrows_job_id           ON public.escrows(job_id);
CREATE INDEX IF NOT EXISTS idx_escrows_collection_trans ON public.escrows(collection_trans_id);
CREATE INDEX IF NOT EXISTS idx_escrows_payout_trans     ON public.escrows(payout_trans_id);

ALTER TABLE public.escrows ENABLE ROW LEVEL SECURITY;

-- The two parties to a job can view its escrow. All writes happen via Edge
-- Functions using the service role (which bypasses RLS), so no INSERT/UPDATE
-- policies are granted to authenticated users.
DROP POLICY IF EXISTS "Escrows: employer or worker can view" ON public.escrows;
CREATE POLICY "Escrows: employer or worker can view"
  ON public.escrows FOR SELECT TO authenticated
  USING (
    employer_id = public.auth_profile_id()
    OR worker_id = public.auth_profile_id()
  );

-- Gate job start on funding. Accepting an applicant now moves the job to
-- 'awaiting_funding' (not 'in_progress'). The webhook flips it to 'in_progress'
-- only after the escrow collection is confirmed.
CREATE OR REPLACE FUNCTION public.reject_other_applications()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    UPDATE public.applications
    SET status = 'rejected'
    WHERE job_id = NEW.job_id
      AND id != NEW.id
      AND status = 'pending';

    UPDATE public.jobs
    SET status = 'awaiting_funding',
        selected_worker_id = NEW.worker_id
    WHERE id = NEW.job_id;
  END IF;
  RETURN NEW;
END;
$$;
