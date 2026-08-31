CREATE TABLE public.awards (
  award_code text PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  industry text,
  effective_date date,
  rates_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.awards TO anon, authenticated;
GRANT ALL ON public.awards TO service_role;

ALTER TABLE public.awards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read awards"
  ON public.awards
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE TABLE public.award_pages (
  slug text PRIMARY KEY,
  award_code text NOT NULL REFERENCES public.awards(award_code) ON DELETE CASCADE,
  title text NOT NULL,
  meta_description text NOT NULL,
  body_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  generated_at timestamp with time zone,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.award_pages TO anon, authenticated;
GRANT ALL ON public.award_pages TO service_role;

ALTER TABLE public.award_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published award pages"
  ON public.award_pages
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

CREATE OR REPLACE FUNCTION public.update_award_pages_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_award_pages_updated_at
BEFORE UPDATE ON public.award_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_award_pages_updated_at();