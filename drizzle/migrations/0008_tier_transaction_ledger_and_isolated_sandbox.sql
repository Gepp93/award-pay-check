CREATE TABLE public.tier_transactions (stripe_session_id text PRIMARY KEY, purchase_id uuid NOT NULL REFERENCES public.tier_purchases(id), user_id uuid NOT NULL, report_id uuid REFERENCES public.v2_paid_reports(id), product text NOT NULL, price_id text NOT NULL, payment_link_id text NOT NULL, checkout_account_email text NOT NULL, stripe_customer_id text, stripe_subscription_id text UNIQUE, created_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.tier_transactions TO service_role;
ALTER TABLE public.tier_transactions ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.tier_transaction_events (event_id text PRIMARY KEY, stripe_session_id text NOT NULL REFERENCES public.tier_transactions(stripe_session_id), created_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.tier_transaction_events TO service_role;
ALTER TABLE public.tier_transaction_events ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.record_tier_transaction(p_event_id text,p_purchase_id uuid,p_session_id text,p_customer_id text,p_subscription_id text,p_price_id text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p public.tier_purchases%ROWTYPE; existing public.tier_transactions%ROWTYPE;
BEGIN
 SELECT * INTO p FROM public.tier_purchases WHERE id=p_purchase_id FOR UPDATE;
 IF NOT FOUND OR p.price_id IS DISTINCT FROM p_price_id OR p.checkout_account_email IS NULL THEN RAISE EXCEPTION 'Invalid purchase binding'; END IF;
 IF p.product NOT IN ('pay_check','underpayment_report','pay_protection') OR (p.product='pay_protection' AND p_subscription_id IS NULL) THEN RAISE EXCEPTION 'Invalid product'; END IF;
 IF p.product <> 'pay_protection' AND NOT EXISTS(SELECT 1 FROM public.v2_paid_reports r WHERE r.id=p.report_id AND r.user_id=p.user_id AND r.assessment_status='complete' AND r.result->'paid'->>'comparison'='complete') THEN RAISE EXCEPTION 'Report not eligible'; END IF;
 SELECT * INTO existing FROM public.tier_transactions WHERE stripe_session_id=p_session_id;
 IF FOUND THEN
  IF existing.purchase_id<>p.id OR existing.price_id<>p_price_id OR existing.stripe_customer_id IS DISTINCT FROM p_customer_id OR existing.stripe_subscription_id IS DISTINCT FROM p_subscription_id THEN RAISE EXCEPTION 'Transaction binding mismatch'; END IF;
 ELSE
  INSERT INTO public.tier_transactions(stripe_session_id,purchase_id,user_id,report_id,product,price_id,payment_link_id,checkout_account_email,stripe_customer_id,stripe_subscription_id) VALUES(p_session_id,p.id,p.user_id,p.report_id,p.product,p.price_id,p.payment_link_id,p.checkout_account_email,p_customer_id,p_subscription_id);
 END IF;
 IF EXISTS(SELECT 1 FROM public.tier_transaction_events WHERE event_id=p_event_id AND stripe_session_id<>p_session_id) THEN RAISE EXCEPTION 'Event replay mismatch'; END IF;
 INSERT INTO public.tier_transaction_events(event_id,stripe_session_id) VALUES(p_event_id,p_session_id) ON CONFLICT DO NOTHING;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.record_tier_transaction(text,uuid,text,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.record_tier_transaction(text,uuid,text,text,text,text) TO service_role;
CREATE TABLE public.tier_sandbox_reports (LIKE public.v2_paid_reports INCLUDING DEFAULTS INCLUDING CONSTRAINTS INCLUDING INDEXES);
GRANT ALL ON public.tier_sandbox_reports TO service_role;
ALTER TABLE public.tier_sandbox_reports ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.tier_sandbox_purchases (LIKE public.tier_purchases INCLUDING DEFAULTS INCLUDING CONSTRAINTS INCLUDING INDEXES);
GRANT ALL ON public.tier_sandbox_purchases TO service_role;
ALTER TABLE public.tier_sandbox_purchases ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.tier_sandbox_transactions (LIKE public.tier_transactions INCLUDING DEFAULTS INCLUDING CONSTRAINTS INCLUDING INDEXES);
GRANT ALL ON public.tier_sandbox_transactions TO service_role;
ALTER TABLE public.tier_sandbox_transactions ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.tier_sandbox_events (LIKE public.tier_transaction_events INCLUDING DEFAULTS INCLUDING CONSTRAINTS INCLUDING INDEXES);
GRANT ALL ON public.tier_sandbox_events TO service_role;
ALTER TABLE public.tier_sandbox_events ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.record_tier_sandbox_transaction(p_event_id text,p_purchase_id uuid,p_session_id text,p_customer_id text,p_subscription_id text,p_price_id text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p public.tier_sandbox_purchases%ROWTYPE; existing public.tier_sandbox_transactions%ROWTYPE;
BEGIN
 SELECT * INTO p FROM public.tier_sandbox_purchases WHERE id=p_purchase_id FOR UPDATE;
 IF NOT FOUND OR p.price_id IS DISTINCT FROM p_price_id OR p.checkout_account_email IS NULL THEN RAISE EXCEPTION 'Invalid purchase binding'; END IF;
 IF p.product NOT IN ('pay_check','underpayment_report','pay_protection') OR (p.product='pay_protection' AND p_subscription_id IS NULL) THEN RAISE EXCEPTION 'Invalid product'; END IF;
 IF p.product <> 'pay_protection' AND NOT EXISTS(SELECT 1 FROM public.tier_sandbox_reports r WHERE r.id=p.report_id AND r.user_id=p.user_id AND r.assessment_status='complete' AND r.result->'paid'->>'comparison'='complete') THEN RAISE EXCEPTION 'Report not eligible'; END IF;
 SELECT * INTO existing FROM public.tier_sandbox_transactions WHERE stripe_session_id=p_session_id;
 IF FOUND THEN
  IF existing.purchase_id<>p.id OR existing.price_id<>p_price_id OR existing.stripe_customer_id IS DISTINCT FROM p_customer_id OR existing.stripe_subscription_id IS DISTINCT FROM p_subscription_id THEN RAISE EXCEPTION 'Transaction binding mismatch'; END IF;
 ELSE
  INSERT INTO public.tier_sandbox_transactions(stripe_session_id,purchase_id,user_id,report_id,product,price_id,payment_link_id,checkout_account_email,stripe_customer_id,stripe_subscription_id) VALUES(p_session_id,p.id,p.user_id,p.report_id,p.product,p.price_id,p.payment_link_id,p.checkout_account_email,p_customer_id,p_subscription_id);
 END IF;
 IF EXISTS(SELECT 1 FROM public.tier_sandbox_events WHERE event_id=p_event_id AND stripe_session_id<>p_session_id) THEN RAISE EXCEPTION 'Event replay mismatch'; END IF;
 INSERT INTO public.tier_sandbox_events(event_id,stripe_session_id) VALUES(p_event_id,p_session_id) ON CONFLICT DO NOTHING;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.record_tier_sandbox_transaction(text,uuid,text,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.record_tier_sandbox_transaction(text,uuid,text,text,text,text) TO service_role;