ALTER TABLE public.tier_purchases ADD COLUMN checkout_account_email text;
CREATE OR REPLACE FUNCTION public.revoke_tier_purchase(p_event_id text,p_session_id text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p public.tier_purchases%ROWTYPE;
BEGIN
 SELECT * INTO p FROM public.tier_purchases WHERE stripe_session_id=p_session_id FOR UPDATE;
 IF NOT FOUND THEN RETURN false; END IF;
 INSERT INTO public.tier_webhook_events(event_id) VALUES(p_event_id) ON CONFLICT DO NOTHING;
 IF NOT FOUND THEN RETURN true; END IF;
 UPDATE public.tier_purchases SET status='revoked' WHERE id=p.id;
 IF p.stripe_subscription_id IS NOT NULL THEN UPDATE public.tier_subscriptions SET status='revoked',paid_through=NULL,updated_at=now() WHERE stripe_subscription_id=p.stripe_subscription_id; END IF;
 IF p.report_id IS NOT NULL THEN UPDATE public.v2_paid_reports SET assessment_unlocked=EXISTS(SELECT 1 FROM public.tier_purchases WHERE report_id=p.report_id AND status='paid' AND product IN ('pay_check','underpayment_report')),pdf_unlocked=EXISTS(SELECT 1 FROM public.tier_purchases WHERE report_id=p.report_id AND status='paid' AND product='underpayment_report') WHERE id=p.report_id; END IF;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.revoke_tier_purchase(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_tier_purchase(text,text) TO service_role;