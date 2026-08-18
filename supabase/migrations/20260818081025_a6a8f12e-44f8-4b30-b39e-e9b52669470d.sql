-- 12-month unlimited access subscription purchases
CREATE TABLE IF NOT EXISTS public.subscription_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text,
  stripe_session_id text,
  product text NOT NULL DEFAULT 'yearly_access' CHECK (product IN ('yearly_access')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.subscription_purchases TO anon;
GRANT SELECT, INSERT ON public.subscription_purchases TO authenticated;
GRANT ALL ON public.subscription_purchases TO service_role;

ALTER TABLE public.subscription_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription purchases"
  ON public.subscription_purchases FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role can update all subscription_purchases"
  ON public.subscription_purchases FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow yearly subscription status
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_subscription_status_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_subscription_status_check
  CHECK (subscription_status IN ('free', 'active', 'canceled', 'yearly'));

-- Function to create profile on signup and link any pending subscription by email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pending_status text;
BEGIN
  SELECT sp.status INTO pending_status
  FROM public.subscription_purchases sp
  WHERE sp.email = new.email AND sp.status = 'paid'
  LIMIT 1;

  INSERT INTO public.profiles (id, email, subscription_status)
  VALUES (
    new.id,
    new.email,
    CASE WHEN pending_status = 'paid' THEN 'yearly' ELSE 'free' END
  );

  IF pending_status = 'paid' THEN
    UPDATE public.subscription_purchases
    SET user_id = new.id
    WHERE email = new.email AND status = 'paid' AND user_id IS NULL;
  END IF;

  RETURN new;
END;
$$;

CREATE INDEX IF NOT EXISTS subscription_purchases_email_idx ON public.subscription_purchases (email);
CREATE INDEX IF NOT EXISTS subscription_purchases_user_id_idx ON public.subscription_purchases (user_id);
