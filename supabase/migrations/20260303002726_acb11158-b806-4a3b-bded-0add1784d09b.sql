
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  calculation_data jsonb,
  shift_details jsonb,
  created_at timestamptz DEFAULT now(),
  stripe_session_id text,
  product_purchased text,
  payment_status text DEFAULT 'none'
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert leads"
  ON public.leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read leads by id"
  ON public.leads FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow service role updates on leads"
  ON public.leads FOR UPDATE
  TO service_role
  USING (true);
