DROP POLICY IF EXISTS "Anyone can insert pending subscription purchases" ON public.subscription_purchases;
CREATE POLICY "Anyone can insert pending subscription purchases"
  ON public.subscription_purchases FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);