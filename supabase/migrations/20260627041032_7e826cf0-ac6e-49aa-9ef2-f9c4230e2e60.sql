CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  result jsonb NOT NULL,
  inputs jsonb NOT NULL,
  owed_amount numeric NOT NULL DEFAULT 0,
  product text NOT NULL CHECK (product IN ('full_report','backpay_pack')),
  payment_status text NOT NULL DEFAULT 'free' CHECK (payment_status IN ('free','paid')),
  stripe_session_id text
);

GRANT SELECT, INSERT, UPDATE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners read own reports"
  ON public.reports FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Owners insert own reports"
  ON public.reports FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owners update own reports"
  ON public.reports FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE INDEX reports_user_id_created_at_idx ON public.reports (user_id, created_at DESC);