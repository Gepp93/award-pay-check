
-- 1) Lock down leads: drop broad SELECT, revoke select grants
DROP POLICY IF EXISTS "Anyone can read leads by id" ON public.leads;
REVOKE SELECT ON public.leads FROM anon, authenticated;

-- 2) Rate limit table (service-role only)
CREATE TABLE IF NOT EXISTS public.rate_limits (
  bucket text PRIMARY KEY,
  count integer NOT NULL DEFAULT 0,
  window_start timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.rate_limits TO service_role;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- no policies = locked to service_role (which bypasses RLS)

-- 3) Atomic increment helper
CREATE OR REPLACE FUNCTION public.increment_rate_limit(
  _bucket text,
  _window_seconds integer,
  _limit integer
)
RETURNS TABLE(count integer, allowed boolean, retry_after integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _now timestamptz := now();
  _row public.rate_limits%ROWTYPE;
  _new_count integer;
  _elapsed integer;
BEGIN
  INSERT INTO public.rate_limits (bucket, count, window_start)
  VALUES (_bucket, 1, _now)
  ON CONFLICT (bucket) DO UPDATE
    SET count = CASE
                  WHEN public.rate_limits.window_start + make_interval(secs => _window_seconds) < _now
                    THEN 1
                  ELSE public.rate_limits.count + 1
                END,
        window_start = CASE
                  WHEN public.rate_limits.window_start + make_interval(secs => _window_seconds) < _now
                    THEN _now
                  ELSE public.rate_limits.window_start
                END
  RETURNING * INTO _row;

  _new_count := _row.count;
  _elapsed := GREATEST(0, _window_seconds - EXTRACT(EPOCH FROM (_now - _row.window_start))::int);

  RETURN QUERY SELECT _new_count,
                      (_new_count <= _limit) AS allowed,
                      CASE WHEN _new_count <= _limit THEN 0 ELSE _elapsed END AS retry_after;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_rate_limit(text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_rate_limit(text, integer, integer) TO service_role;
