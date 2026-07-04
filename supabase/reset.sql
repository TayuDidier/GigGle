

-- ====================
-- PART 2 — SETUP
-- ====================

-- 2a. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";


-- 2b. Enums
CREATE TYPE public.user_role AS ENUM ('worker', 'employer', 'admin');

CREATE TYPE public.job_category AS ENUM (
  'cleaning', 'tutoring', 'repairs', 'caregiving',
  'delivery', 'event_labor', 'digital_services',
  'gardening', 'moving', 'cooking', 'other'
);

CREATE TYPE public.job_status AS ENUM (
  'open', 'in_progress', 'completed', 'cancelled'
);

CREATE TYPE public.application_status AS ENUM (
  'pending', 'accepted', 'rejected'
);

CREATE TYPE public.payment_provider AS ENUM (
  'mtn_momo', 'orange_money'
);

CREATE TYPE public.payment_ack_status AS ENUM (
  'submitted', 'confirmed'
);


-- 2c. Tables

-- profiles
CREATE TABLE public.profiles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            public.user_role NOT NULL,
  full_name       TEXT NOT NULL CHECK (char_length(full_name) <= 100),
  bio             TEXT CHECK (char_length(bio) <= 500),
  phone           TEXT CHECK (phone ~ '^\+?[0-9]{8,15}$'),
  location        GEOGRAPHY(POINT, 4326),
  city            TEXT,
  avatar_url      TEXT,
  company_name    TEXT CHECK (char_length(company_name) <= 100),
  rating_average  DECIMAL(3,2) CHECK (rating_average >= 1.0 AND rating_average <= 5.0),
  rating_count    INTEGER DEFAULT 0,
  is_suspended    BOOLEAN DEFAULT FALSE,
  onboarding_done BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_user_id  ON public.profiles(user_id);
CREATE INDEX idx_profiles_role     ON public.profiles(role);
CREATE INDEX idx_profiles_location ON public.profiles USING GIST(location);


-- jobs
CREATE TABLE public.jobs (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employer_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title               TEXT NOT NULL CHECK (char_length(title) BETWEEN 5 AND 150),
  category            public.job_category NOT NULL,
  description         TEXT NOT NULL CHECK (char_length(description) BETWEEN 20 AND 2000),
  pay                 DECIMAL(12,0) NOT NULL CHECK (pay > 0),
  location            GEOGRAPHY(POINT, 4326) NOT NULL,
  address_text        TEXT NOT NULL,
  city                TEXT NOT NULL,
  status              public.job_status DEFAULT 'open',
  timeline_days       INTEGER CHECK (timeline_days > 0 AND timeline_days <= 180),
  selected_worker_id  UUID REFERENCES public.profiles(id),
  payment_confirmed   BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_jobs_employer_id  ON public.jobs(employer_id);
CREATE INDEX idx_jobs_status       ON public.jobs(status);
CREATE INDEX idx_jobs_category     ON public.jobs(category);
CREATE INDEX idx_jobs_location     ON public.jobs USING GIST(location);
CREATE INDEX idx_jobs_created_at   ON public.jobs(created_at DESC);


-- applications
CREATE TABLE public.applications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id      UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  worker_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status      public.application_status DEFAULT 'pending',
  cover_note  TEXT CHECK (char_length(cover_note) <= 500),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, worker_id)
);

CREATE INDEX idx_applications_job_id    ON public.applications(job_id);
CREATE INDEX idx_applications_worker_id ON public.applications(worker_id);
CREATE INDEX idx_applications_status   ON public.applications(status);


-- messages
CREATE TABLE public.messages (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id     UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  sender_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content    TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_job_id     ON public.messages(job_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at ASC);


-- ratings
CREATE TABLE public.ratings (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id       UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  rater_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rated_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score        INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
  review_text  TEXT CHECK (char_length(review_text) <= 500),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, rater_id)
);

CREATE INDEX idx_ratings_rated_id ON public.ratings(rated_id);
CREATE INDEX idx_ratings_job_id   ON public.ratings(job_id);


-- payment_acknowledgments
CREATE TABLE public.payment_acknowledgments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id          UUID UNIQUE NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  reference_code  TEXT NOT NULL CHECK (reference_code ~ '^[A-Za-z0-9]{4,30}$'),
  provider        public.payment_provider NOT NULL,
  amount          DECIMAL(12,0) NOT NULL CHECK (amount > 0),
  submitted_by    UUID NOT NULL REFERENCES public.profiles(id),
  confirmed_by    UUID REFERENCES public.profiles(id),
  status          public.payment_ack_status DEFAULT 'submitted',
  submitted_at    TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at    TIMESTAMPTZ
);

CREATE INDEX idx_payment_ack_job_id ON public.payment_acknowledgments(job_id);


-- reports
CREATE TABLE public.reports (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_id  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  job_id       UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  reason       TEXT NOT NULL CHECK (char_length(reason) BETWEEN 10 AND 1000),
  status       TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  admin_note   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  resolved_at  TIMESTAMPTZ
);


-- 2d. Helper functions (used in RLS policies)

CREATE OR REPLACE FUNCTION public.auth_profile_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.auth_role()
RETURNS public.user_role
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$;


-- 2e. Trigger functions

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- Auto-create profile row after Supabase Auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, role, full_name)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'worker'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- Recalculate rating_average when a new rating is inserted
-- SECURITY DEFINER: this updates the RATED user's profile row, not the
-- rater's own row, so it must bypass the "users can update their own
-- profile" RLS policy or the update silently affects 0 rows.
CREATE OR REPLACE FUNCTION public.update_rating_average()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.profiles
  SET
    rating_average = (SELECT AVG(score)::DECIMAL(3,2) FROM public.ratings WHERE rated_id = NEW.rated_id),
    rating_count   = (SELECT COUNT(*)               FROM public.ratings WHERE rated_id = NEW.rated_id)
  WHERE id = NEW.rated_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_rating_inserted
  AFTER INSERT ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_rating_average();


-- Auto-reject competing applications and set job in_progress when one is accepted
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
    SET status = 'in_progress',
        selected_worker_id = NEW.worker_id
    WHERE id = NEW.job_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_application_accepted
  AFTER UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.reject_other_applications();


-- 2f. PostGIS RPC — radius job search
CREATE OR REPLACE FUNCTION public.get_jobs_within_radius(
  lat         FLOAT,
  lng         FLOAT,
  radius_km   FLOAT    DEFAULT 10,
  p_category  public.job_category DEFAULT NULL,
  p_limit     INTEGER  DEFAULT 50,
  p_offset    INTEGER  DEFAULT 0
)
RETURNS TABLE (
  id              UUID,
  title           TEXT,
  category        public.job_category,
  description     TEXT,
  pay             DECIMAL,
  address_text    TEXT,
  city            TEXT,
  status          public.job_status,
  timeline_days   INTEGER,
  distance_km     FLOAT,
  employer_id     UUID,
  employer_name   TEXT,
  employer_rating DECIMAL,
  employer_avatar TEXT,
  created_at      TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    j.id,
    j.title,
    j.category,
    j.description,
    j.pay,
    j.address_text,
    j.city,
    j.status,
    j.timeline_days,
    ROUND((ST_Distance(
      j.location::geography,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    ) / 1000)::NUMERIC, 2)::FLOAT AS distance_km,
    p.id            AS employer_id,
    p.full_name     AS employer_name,
    p.rating_average AS employer_rating,
    p.avatar_url    AS employer_avatar,
    j.created_at
  FROM public.jobs j
  JOIN public.profiles p ON p.id = j.employer_id
  WHERE
    j.status = 'open'
    AND p.is_suspended = FALSE
    AND ST_DWithin(
      j.location::geography,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      radius_km * 1000
    )
    AND (p_category IS NULL OR j.category = p_category)
  ORDER BY distance_km ASC, j.created_at DESC
  LIMIT  p_limit
  OFFSET p_offset;
END;
$$;


-- 2g. Enable RLS on all tables
ALTER TABLE public.profiles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports                ENABLE ROW LEVEL SECURITY;


-- 2h. RLS Policies

-- PROFILES
CREATE POLICY "Profiles: authenticated users can read non-suspended profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (is_suspended = FALSE OR id = public.auth_profile_id());

CREATE POLICY "Profiles: users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Profiles: admins can update any profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.auth_role() = 'admin');

-- JOBS
CREATE POLICY "Jobs: open jobs visible to all authenticated users"
  ON public.jobs FOR SELECT TO authenticated
  USING (
    status = 'open'
    OR employer_id      = public.auth_profile_id()
    OR selected_worker_id = public.auth_profile_id()
    OR public.auth_role() = 'admin'
  );

CREATE POLICY "Jobs: employers can insert jobs"
  ON public.jobs FOR INSERT TO authenticated
  WITH CHECK (
    employer_id = public.auth_profile_id()
    AND public.auth_role() = 'employer'
  );

CREATE POLICY "Jobs: employers can update their own jobs"
  ON public.jobs FOR UPDATE TO authenticated
  USING (employer_id = public.auth_profile_id() OR public.auth_role() = 'admin');

CREATE POLICY "Jobs: employers can delete their own open jobs"
  ON public.jobs FOR DELETE TO authenticated
  USING (employer_id = public.auth_profile_id() AND status = 'open');

-- APPLICATIONS
CREATE POLICY "Applications: workers see own; employers see on their jobs; admins see all"
  ON public.applications FOR SELECT TO authenticated
  USING (
    worker_id = public.auth_profile_id()
    OR EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = applications.job_id
        AND jobs.employer_id = public.auth_profile_id()
    )
    OR public.auth_role() = 'admin'
  );

CREATE POLICY "Applications: workers can insert applications"
  ON public.applications FOR INSERT TO authenticated
  WITH CHECK (
    worker_id = public.auth_profile_id()
    AND public.auth_role() = 'worker'
  );

CREATE POLICY "Applications: employers can update status on their jobs"
  ON public.applications FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = applications.job_id
        AND jobs.employer_id = public.auth_profile_id()
    )
  );

-- MESSAGES
CREATE POLICY "Messages: only job participants and admins can read/write"
  ON public.messages FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = messages.job_id
        AND (
          jobs.employer_id      = public.auth_profile_id()
          OR jobs.selected_worker_id = public.auth_profile_id()
        )
    )
    OR public.auth_role() = 'admin'
  );

-- RATINGS
CREATE POLICY "Ratings: visible to all authenticated users"
  ON public.ratings FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY "Ratings: job participants can submit after completion"
  ON public.ratings FOR INSERT TO authenticated
  WITH CHECK (
    rater_id = public.auth_profile_id()
    AND EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = ratings.job_id
        AND jobs.status = 'completed'
        AND (
          jobs.employer_id      = public.auth_profile_id()
          OR jobs.selected_worker_id = public.auth_profile_id()
        )
    )
  );

-- PAYMENT_ACKNOWLEDGMENTS
CREATE POLICY "Payments: job participants and admins can read"
  ON public.payment_acknowledgments FOR SELECT TO authenticated
  USING (
    submitted_by = public.auth_profile_id()
    OR confirmed_by  = public.auth_profile_id()
    OR EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = payment_acknowledgments.job_id
        AND (
          jobs.employer_id      = public.auth_profile_id()
          OR jobs.selected_worker_id = public.auth_profile_id()
        )
    )
    OR public.auth_role() = 'admin'
  );

CREATE POLICY "Payments: employers can submit for their completed jobs"
  ON public.payment_acknowledgments FOR INSERT TO authenticated
  WITH CHECK (
    submitted_by = public.auth_profile_id()
    AND EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = payment_acknowledgments.job_id
        AND jobs.employer_id = public.auth_profile_id()
        AND jobs.status = 'completed'
    )
  );

CREATE POLICY "Payments: workers can confirm receipt for their jobs"
  ON public.payment_acknowledgments FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = payment_acknowledgments.job_id
        AND jobs.selected_worker_id = public.auth_profile_id()
    )
  );

-- REPORTS
CREATE POLICY "Reports: reporters and admins can read"
  ON public.reports FOR SELECT TO authenticated
  USING (
    reporter_id = public.auth_profile_id()
    OR public.auth_role() = 'admin'
  );

CREATE POLICY "Reports: authenticated users can insert"
  ON public.reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = public.auth_profile_id());

CREATE POLICY "Reports: admins can update (resolve/dismiss)"
  ON public.reports FOR UPDATE TO authenticated
  USING (public.auth_role() = 'admin');


-- =============================================================
-- DONE. Schema is ready.
--
-- NEXT STEPS:
-- 1. Run supabase/003_storage.sql in the SQL Editor (creates avatars bucket + RLS)
-- 2. Copy .env.example to .env.local and fill in:
--    VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
-- 3. Run: npm run dev
-- =============================================================
