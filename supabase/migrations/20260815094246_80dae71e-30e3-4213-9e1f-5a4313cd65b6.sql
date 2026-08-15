ALTER TABLE public.reports ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS email text;

GRANT SELECT, INSERT ON public.reports TO anon;

CREATE POLICY "Guests insert unowned reports"
  ON public.reports FOR INSERT TO anon
  WITH CHECK (user_id IS NULL);

CREATE POLICY "Guests read unowned reports by id"
  ON public.reports FOR SELECT TO anon
  USING (user_id IS NULL);

CREATE POLICY "Signed-in users read unowned reports"
  ON public.reports FOR SELECT TO authenticated
  USING (user_id IS NULL);

CREATE POLICY "Signed-in users claim unowned reports"
  ON public.reports FOR UPDATE TO authenticated
  USING (user_id IS NULL) WITH CHECK (user_id = auth.uid());