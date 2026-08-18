DROP TABLE IF EXISTS public.subscription_purchases CASCADE;

CREATE TABLE public.subscription_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text,
  stripe_session_id text,
  product text NOT NULL DEFAULT 'yearly_access',
  status text NOT NULL DEFAULT 'pending',
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.subscription_purchases TO anon;
GRANT SELECT, INSERT ON public.subscription_purchases TO authenticated;
GRANT ALL ON public.subscription_purchases TO service_role;

ALTER TABLE public.subscription_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert pending subscription purchases"
  ON public.subscription_purchases FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view own subscription purchases"
  ON public.subscription_purchases FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role can update all subscription_purchases"
  ON public.subscription_purchases FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);