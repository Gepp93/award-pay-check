REVOKE SELECT ON public.v2_paid_reports FROM authenticated;
CREATE OR REPLACE FUNCTION public.fulfil_tier_purchase(p_event_id text, p_purchase_id uuid, p_session_id text, p_customer_id text, p_subscription_id text, p_price_id text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p public.tier_purchases%ROWTYPE; r public.v2_paid_reports%ROWTYPE;
BEGIN
 SELECT * INTO p FROM public.tier_purchases WHERE id=p_purchase_id FOR UPDATE;
 IF NOT FOUND THEN RETURN false; END IF;
 IF p.price_id IS DISTINCT FROM p_price_id THEN RAISE EXCEPTION 'Price mismatch'; END IF;
 IF p.status='paid' THEN RETURN p.stripe_session_id=p_session_id; END IF;
 IF p.status <> 'pending' THEN RAISE EXCEPTION 'Purchase no longer pending'; END IF;
 IF p.product NOT IN ('pay_check','underpayment_report','pay_protection') THEN RAISE EXCEPTION 'Unknown tier'; END IF;
 IF p.product='pay_protection' AND p_subscription_id IS NULL THEN RAISE EXCEPTION 'Subscription required'; END IF;
 IF p.report_id IS NOT NULL THEN
  SELECT * INTO r FROM public.v2_paid_reports WHERE id=p.report_id FOR UPDATE;
  IF r.user_id IS DISTINCT FROM p.user_id OR r.assessment_status <> 'complete' OR r.result->'paid'->>'comparison' IS DISTINCT FROM 'complete' THEN RAISE EXCEPTION 'Report not eligible'; END IF;
 ELSIF p.product <> 'pay_protection' THEN RAISE EXCEPTION 'Report required'; END IF;
 INSERT INTO public.tier_webhook_events(event_id) VALUES(p_event_id) ON CONFLICT DO NOTHING;
 IF NOT FOUND THEN RETURN true; END IF;
 UPDATE public.tier_purchases SET status='paid',stripe_session_id=p_session_id,stripe_customer_id=p_customer_id,stripe_subscription_id=p_subscription_id WHERE id=p.id;
 IF p.report_id IS NOT NULL AND p.product <> 'pay_protection' THEN UPDATE public.v2_paid_reports SET assessment_unlocked=true,pdf_unlocked=(pdf_unlocked OR p.product='underpayment_report') WHERE id=p.report_id; END IF;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.fulfil_tier_purchase(text,uuid,text,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.fulfil_tier_purchase(text,uuid,text,text,text,text) TO service_role;