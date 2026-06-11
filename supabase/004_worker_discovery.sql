-- Migration 004: Worker discovery RPC for employer map
-- Returns workers near a lat/lng ordered by rating (key workers first)
-- Run in Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.get_workers_near_location(
  lat         FLOAT,
  lng         FLOAT,
  radius_km   FLOAT   DEFAULT 20,
  p_limit     INTEGER DEFAULT 40
)
RETURNS TABLE (
  id             UUID,
  full_name      TEXT,
  bio            TEXT,
  avatar_url     TEXT,
  city           TEXT,
  rating_average DECIMAL,
  rating_count   INTEGER,
  distance_km    FLOAT,
  worker_lat     FLOAT,
  worker_lng     FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.bio,
    p.avatar_url,
    p.city,
    p.rating_average,
    p.rating_count,
    ROUND((ST_Distance(
      p.location::geography,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    ) / 1000)::NUMERIC, 2)::FLOAT   AS distance_km,
    ST_Y(p.location::geometry)::FLOAT AS worker_lat,
    ST_X(p.location::geometry)::FLOAT AS worker_lng
  FROM public.profiles p
  WHERE
    p.role = 'worker'
    AND p.is_suspended = FALSE
    AND p.onboarding_done = TRUE
    AND p.location IS NOT NULL
    AND ST_DWithin(
      p.location::geography,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      radius_km * 1000
    )
  ORDER BY
    p.rating_average DESC NULLS LAST,
    distance_km ASC
  LIMIT p_limit;
END;
$$;
