ALTER TABLE public.subscription_purchases ENABLE ROW LEVEL SECURITY;
NOTIFY pgrst, 'reload schema';