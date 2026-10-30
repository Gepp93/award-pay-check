REVOKE SELECT ON public.reports FROM anon, authenticated;
GRANT SELECT (id, created_at, user_id, owed_amount, product, payment_status, stripe_session_id) ON public.reports TO anon, authenticated;