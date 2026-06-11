-- Migration 002: Add job coordinates to get_jobs_within_radius return
-- Run in Supabase SQL Editor after reset.sql

DROP FUNCTION IF EXISTS public.get_jobs_within_radius(FLOAT, FLOAT, FLOAT, public.job_category, INTEGER, INTEGER);

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
  job_lat         FLOAT,
  job_lng         FLOAT,
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
    ) / 1000)::NUMERIC, 2)::FLOAT            AS distance_km,
    ST_Y(j.location::geometry)::FLOAT        AS job_lat,
    ST_X(j.location::geometry)::FLOAT        AS job_lng,
    p.id                                     AS employer_id,
    p.full_name                              AS employer_name,
    p.rating_average                         AS employer_rating,
    p.avatar_url                             AS employer_avatar,
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
