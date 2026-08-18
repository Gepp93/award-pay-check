DROP POLICY IF EXISTS "Anyone can insert pending subscription purchases" ON public.subscription_purchases;
CREATE POLICY "Anyone can insert pending subscription purchases"
  ON public.subscription_purchases FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);