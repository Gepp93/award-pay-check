DROP POLICY IF EXISTS "Anon and authenticated can view pending subscription purchases" ON public.subscription_purchases;

CREATE POLICY "Anon and authenticated can view pending subscription purchases"
  ON public.subscription_purchases FOR SELECT
  TO anon, authenticated
  USING (status = 'pending');