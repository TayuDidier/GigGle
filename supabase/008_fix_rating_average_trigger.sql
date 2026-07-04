-- Migration 008: Fix update_rating_average() — ratings never updated profiles.rating_average
-- Run in Supabase SQL Editor (or via MCP apply_migration)
--
-- Root cause: the trigger updates the RATED user's profile row (not the
-- rater's own row), but the function was not SECURITY DEFINER, so it ran
-- under the rater's RLS context. The "users can update their own profile"
-- policy blocked the update — it silently affected 0 rows, no error raised.

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

-- Backfill any profiles whose stored rating_average/rating_count drifted
-- from the actual ratings table while the trigger was broken.
UPDATE public.profiles p
SET
  rating_average = r.actual_avg,
  rating_count   = r.actual_count
FROM (
  SELECT rated_id, AVG(score)::DECIMAL(3,2) AS actual_avg, COUNT(*) AS actual_count
  FROM public.ratings
  GROUP BY rated_id
) r
WHERE p.id = r.rated_id
  AND (p.rating_average IS DISTINCT FROM r.actual_avg OR p.rating_count IS DISTINCT FROM r.actual_count);
