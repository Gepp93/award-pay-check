ALTER TABLE public.tier_purchases ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.tier_purchases ADD COLUMN IF NOT EXISTS guest boolean NOT NULL DEFAULT false;
ALTER TABLE public.tier_transactions ALTER COLUMN user_id DROP NOT NULL;

DROP FUNCTION IF EXISTS public.record_tier_transaction(text, uuid, text, text, text, text);
CREATE FUNCTION public.record_tier_transaction(p_event_id text, p_purchase_id uuid, p_session_id text, p_customer_id text, p_subscription_id text, p_price_id text, p_payer_email text DEFAULT NULL)
 RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE p public.tier_purchases%ROWTYPE; existing public.tier_transactions%ROWTYPE;
BEGIN
 SELECT * INTO p FROM public.tier_purchases WHERE id=p_purchase_id FOR UPDATE;
 IF NOT FOUND OR p.price_id IS DISTINCT FROM p_price_id THEN RAISE EXCEPTION 'Invalid purchase binding'; END IF;
 IF p.guest AND p.checkout_account_email IS NULL THEN
  IF p_payer_email IS NULL OR length(p_payer_email) > 320 OR position('@' in p_payer_email) = 0 THEN RAISE EXCEPTION 'Payer email required'; END IF;
  UPDATE public.tier_purchases SET checkout_account_email=lower(p_payer_email) WHERE id=p.id;
  p.checkout_account_email := lower(p_payer_email);
 END IF;
 IF p.checkout_account_email IS NULL THEN RAISE EXCEPTION 'Invalid purchase binding'; END IF;
 IF p.product NOT IN ('pay_check','underpayment_report','pay_protection') OR (p.product='pay_protection' AND p_subscription_id IS NULL) THEN RAISE EXCEPTION 'Invalid product'; END IF;
 IF p.product <> 'pay_protection'
   AND NOT (p.guest AND EXISTS(SELECT 1 FROM public.reports r WHERE r.id=p.legacy_report_id))
   AND NOT EXISTS(SELECT 1 FROM public.v2_paid_reports r WHERE r.id=p.report_id AND r.user_id=p.user_id AND r.assessment_status='complete' AND r.result->'paid'->>'comparison'='complete')
   AND NOT EXISTS(SELECT 1 FROM public.reports r WHERE r.id=p.legacy_report_id AND r.user_id=p.user_id)
 THEN RAISE EXCEPTION 'Report not eligible'; END IF;
 SELECT * INTO existing FROM public.tier_transactions WHERE stripe_session_id=p_session_id;
 IF FOUND THEN
  IF existing.purchase_id<>p.id OR existing.price_id<>p_price_id OR existing.stripe_customer_id IS DISTINCT FROM p_customer_id OR existing.stripe_subscription_id IS DISTINCT FROM p_subscription_id THEN RAISE EXCEPTION 'Transaction binding mismatch'; END IF;
 ELSE
  INSERT INTO public.tier_transactions(stripe_session_id,purchase_id,user_id,report_id,legacy_report_id,product,price_id,payment_link_id,checkout_account_email,stripe_customer_id,stripe_subscription_id) VALUES(p_session_id,p.id,p.user_id,p.report_id,p.legacy_report_id,p.product,p.price_id,p.payment_link_id,p.checkout_account_email,p_customer_id,p_subscription_id);
 END IF;
 IF EXISTS(SELECT 1 FROM public.tier_transaction_events WHERE event_id=p_event_id AND stripe_session_id<>p_session_id) THEN RAISE EXCEPTION 'Event replay mismatch'; END IF;
 INSERT INTO public.tier_transaction_events(event_id,stripe_session_id) VALUES(p_event_id,p_session_id) ON CONFLICT DO NOTHING;
 RETURN true;
END $function$;
REVOKE ALL ON FUNCTION public.record_tier_transaction(text, uuid, text, text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_tier_transaction(text, uuid, text, text, text, text, text) TO service_role;

CREATE OR REPLACE FUNCTION public.claim_my_tier_purchases()
 RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE uid uuid := auth.uid(); confirmed_email text; n integer := 0;
BEGIN
 IF uid IS NULL THEN RETURN 0; END IF;
 SELECT lower(u.email) INTO confirmed_email FROM auth.users u WHERE u.id=uid AND u.email_confirmed_at IS NOT NULL;
 IF confirmed_email IS NULL THEN RETURN 0; END IF;
 WITH claimed AS (
  UPDATE public.tier_transactions t SET user_id=uid
  WHERE t.user_id IS NULL AND lower(t.checkout_account_email)=confirmed_email
   AND EXISTS(SELECT 1 FROM public.tier_purchases p WHERE p.id=t.purchase_id AND p.guest AND p.user_id IS NULL)
  RETURNING t.purchase_id, t.legacy_report_id)
 SELECT count(*) INTO n FROM claimed;
 UPDATE public.tier_purchases p SET user_id=uid WHERE p.guest AND p.user_id IS NULL
  AND EXISTS(SELECT 1 FROM public.tier_transactions t WHERE t.purchase_id=p.id AND t.user_id=uid);
 UPDATE public.reports r SET user_id=uid WHERE r.user_id IS NULL
  AND r.id IN (SELECT t.legacy_report_id FROM public.tier_transactions t WHERE t.user_id=uid AND t.legacy_report_id IS NOT NULL);
 RETURN n;
END $function$;
REVOKE ALL ON FUNCTION public.claim_my_tier_purchases() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_my_tier_purchases() TO authenticated;