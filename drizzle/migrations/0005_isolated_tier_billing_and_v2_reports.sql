CREATE TABLE public.v2_paid_reports (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, request jsonb NOT NULL, result jsonb NOT NULL, assessment_status text NOT NULL, assessment_unlocked boolean NOT NULL DEFAULT false, pdf_unlocked boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.v2_paid_reports TO authenticated;
GRANT ALL ON public.v2_paid_reports TO service_role;
ALTER TABLE public.v2_paid_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY v2_report_owner ON public.v2_paid_reports FOR SELECT TO authenticated USING (user_id = auth.uid() AND public.has_role(auth.uid(),'admin'));
CREATE TABLE public.tier_purchases (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, report_id uuid REFERENCES public.v2_paid_reports(id), product text NOT NULL, status text NOT NULL DEFAULT 'pending', stripe_session_id text UNIQUE, stripe_customer_id text, stripe_subscription_id text, payment_link_id text NOT NULL, price_id text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.tier_purchases TO authenticated;
GRANT ALL ON public.tier_purchases TO service_role;
ALTER TABLE public.tier_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY tier_purchase_owner ON public.tier_purchases FOR SELECT TO authenticated USING (user_id = auth.uid() AND public.has_role(auth.uid(),'admin'));
CREATE TABLE public.tier_subscriptions (stripe_subscription_id text PRIMARY KEY, user_id uuid NOT NULL, stripe_customer_id text NOT NULL, price_id text NOT NULL, status text NOT NULL, paid_through timestamptz, cancel_at_period_end boolean NOT NULL DEFAULT false, last_event_created bigint NOT NULL DEFAULT 0, updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.tier_subscriptions TO authenticated;
GRANT ALL ON public.tier_subscriptions TO service_role;
ALTER TABLE public.tier_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY tier_subscription_owner ON public.tier_subscriptions FOR SELECT TO authenticated USING (user_id = auth.uid() AND public.has_role(auth.uid(),'admin'));
CREATE TABLE public.tier_webhook_events (event_id text PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.tier_webhook_events TO service_role;
ALTER TABLE public.tier_webhook_events ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.fulfil_tier_purchase(p_event_id text, p_purchase_id uuid, p_session_id text, p_customer_id text, p_subscription_id text, p_price_id text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p public.tier_purchases%ROWTYPE; r public.v2_paid_reports%ROWTYPE;
BEGIN
 SELECT * INTO p FROM public.tier_purchases WHERE id=p_purchase_id FOR UPDATE;
 IF NOT FOUND THEN RETURN false; END IF;
 IF p.price_id IS DISTINCT FROM p_price_id THEN RAISE EXCEPTION 'Price mismatch'; END IF;
 IF p.status='paid' THEN RETURN p.stripe_session_id=p_session_id; END IF;
 IF p.product NOT IN ('pay_check','underpayment_report','pay_protection') THEN RAISE EXCEPTION 'Unknown tier'; END IF;
 IF p.product='pay_protection' AND p_subscription_id IS NULL THEN RAISE EXCEPTION 'Subscription required'; END IF;
 IF p.report_id IS NOT NULL THEN
  SELECT * INTO r FROM public.v2_paid_reports WHERE id=p.report_id FOR UPDATE;
  IF r.user_id IS DISTINCT FROM p.user_id OR r.assessment_status <> 'complete' OR r.result->'paid'->>'comparison' IS DISTINCT FROM 'complete' THEN RAISE EXCEPTION 'Report not eligible'; END IF;
 ELSIF p.product <> 'pay_protection' THEN RAISE EXCEPTION 'Report required'; END IF;
 INSERT INTO public.tier_webhook_events(event_id) VALUES(p_event_id) ON CONFLICT DO NOTHING;
 IF NOT FOUND THEN RETURN true; END IF;
 UPDATE public.tier_purchases SET status='paid',stripe_session_id=p_session_id,stripe_customer_id=p_customer_id,stripe_subscription_id=p_subscription_id WHERE id=p.id;
 IF p.report_id IS NOT NULL THEN UPDATE public.v2_paid_reports SET assessment_unlocked=true,pdf_unlocked=(pdf_unlocked OR p.product IN ('underpayment_report','pay_protection')) WHERE id=p.report_id; END IF;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.fulfil_tier_purchase(text,uuid,text,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.fulfil_tier_purchase(text,uuid,text,text,text,text) TO service_role;
CREATE OR REPLACE FUNCTION public.sync_tier_subscription(p_event_id text,p_event_created bigint,p_subscription_id text,p_customer_id text,p_price_id text,p_status text,p_paid_through timestamptz,p_cancel_at_period_end boolean) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE owner_id uuid; current_event bigint;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtext(p_subscription_id));
 SELECT user_id INTO owner_id FROM public.tier_purchases WHERE stripe_subscription_id=p_subscription_id AND status='paid' AND product='pay_protection' AND stripe_customer_id=p_customer_id AND price_id=p_price_id LIMIT 1;
 IF owner_id IS NULL THEN RETURN false; END IF;
 SELECT last_event_created INTO current_event FROM public.tier_subscriptions WHERE stripe_subscription_id=p_subscription_id;
 IF current_event IS NOT NULL AND current_event > p_event_created THEN RETURN true; END IF;
 INSERT INTO public.tier_webhook_events(event_id) VALUES(p_event_id) ON CONFLICT DO NOTHING;
 IF NOT FOUND THEN RETURN true; END IF;
 INSERT INTO public.tier_subscriptions(stripe_subscription_id,user_id,stripe_customer_id,price_id,status,paid_through,cancel_at_period_end,last_event_created) VALUES(p_subscription_id,owner_id,p_customer_id,p_price_id,p_status,p_paid_through,p_cancel_at_period_end,p_event_created)
 ON CONFLICT(stripe_subscription_id) DO UPDATE SET status=excluded.status,paid_through=excluded.paid_through,cancel_at_period_end=excluded.cancel_at_period_end,last_event_created=excluded.last_event_created,updated_at=now();
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.sync_tier_subscription(text,bigint,text,text,text,text,timestamptz,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.sync_tier_subscription(text,bigint,text,text,text,text,timestamptz,boolean) TO service_role;
CREATE OR REPLACE FUNCTION public.revoke_tier_purchase(p_event_id text,p_session_id text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p public.tier_purchases%ROWTYPE;
BEGIN
 SELECT * INTO p FROM public.tier_purchases WHERE stripe_session_id=p_session_id FOR UPDATE;
 IF NOT FOUND THEN RETURN false; END IF;
 INSERT INTO public.tier_webhook_events(event_id) VALUES(p_event_id) ON CONFLICT DO NOTHING;
 IF NOT FOUND THEN RETURN true; END IF;
 UPDATE public.tier_purchases SET status='revoked' WHERE id=p.id;
 IF p.stripe_subscription_id IS NOT NULL THEN UPDATE public.tier_subscriptions SET status='revoked',updated_at=now() WHERE stripe_subscription_id=p.stripe_subscription_id; END IF;
 IF p.report_id IS NOT NULL THEN UPDATE public.v2_paid_reports SET assessment_unlocked=EXISTS(SELECT 1 FROM public.tier_purchases WHERE report_id=p.report_id AND status='paid'),pdf_unlocked=EXISTS(SELECT 1 FROM public.tier_purchases WHERE report_id=p.report_id AND status='paid' AND product IN ('underpayment_report','pay_protection')) WHERE id=p.report_id; END IF;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.revoke_tier_purchase(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_tier_purchase(text,text) TO service_role;