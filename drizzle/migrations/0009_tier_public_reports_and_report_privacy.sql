ALTER TABLE public.tier_purchases ADD COLUMN IF NOT EXISTS legacy_report_id uuid REFERENCES public.reports(id);
ALTER TABLE public.tier_transactions ADD COLUMN IF NOT EXISTS legacy_report_id uuid REFERENCES public.reports(id);
ALTER TABLE public.tier_sandbox_purchases ADD COLUMN IF NOT EXISTS legacy_report_id uuid;
ALTER TABLE public.tier_sandbox_transactions ADD COLUMN IF NOT EXISTS legacy_report_id uuid;
CREATE INDEX IF NOT EXISTS tier_transactions_user_idx ON public.tier_transactions(user_id);

CREATE OR REPLACE FUNCTION public.record_tier_transaction(p_event_id text, p_purchase_id uuid, p_session_id text, p_customer_id text, p_subscription_id text, p_price_id text)
 RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE p public.tier_purchases%ROWTYPE; existing public.tier_transactions%ROWTYPE;
BEGIN
 SELECT * INTO p FROM public.tier_purchases WHERE id=p_purchase_id FOR UPDATE;
 IF NOT FOUND OR p.price_id IS DISTINCT FROM p_price_id OR p.checkout_account_email IS NULL THEN RAISE EXCEPTION 'Invalid purchase binding'; END IF;
 IF p.product NOT IN ('pay_check','underpayment_report','pay_protection') OR (p.product='pay_protection' AND p_subscription_id IS NULL) THEN RAISE EXCEPTION 'Invalid product'; END IF;
 IF p.product <> 'pay_protection'
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

-- Browser reads of saved reports are limited to headline columns; detail comes from access-checked functions.
REVOKE SELECT ON public.reports FROM anon, authenticated;
GRANT SELECT (id, created_at, user_id, owed_amount, product, payment_status, stripe_session_id) ON public.reports TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.report_teaser(r jsonb) RETURNS jsonb LANGUAGE sql IMMUTABLE SET search_path TO 'public' AS $$
 SELECT jsonb_build_object(
  'mode', r->'mode', 'awardName', COALESCE(r->'awardName', r->'award_name'),
  'overallMinUnderpayment', r->'overallMinUnderpayment', 'overallMaxUnderpayment', r->'overallMaxUnderpayment',
  'potentialAllowances', CASE WHEN jsonb_typeof(r->'potentialAllowances')='array' THEN (SELECT COALESCE(jsonb_agg(jsonb_build_object('id', a->'id', 'name', a->'name')), '[]'::jsonb) FROM jsonb_array_elements(r->'potentialAllowances') a) ELSE '[]'::jsonb END,
  'reasons', CASE WHEN jsonb_typeof(r->'reasons')='array' THEN (SELECT COALESCE(jsonb_agg(to_jsonb(''::text)), '[]'::jsonb) FROM jsonb_array_elements(r->'reasons')) ELSE '[]'::jsonb END)
$$;

CREATE OR REPLACE FUNCTION public.get_report_view(p_report_id uuid)
 RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
 SELECT jsonb_build_object('id', r.id, 'created_at', r.created_at, 'user_id', r.user_id, 'owed_amount', r.owed_amount,
  'product', r.product, 'payment_status', r.payment_status, 'email', r.email,
  'result', CASE WHEN r.payment_status='paid' THEN r.result ELSE public.report_teaser(r.result) END,
  'inputs', CASE WHEN r.payment_status='paid' THEN r.inputs ELSE NULL END)
 FROM public.reports r
 WHERE r.id=p_report_id AND (r.user_id IS NULL OR r.user_id=auth.uid())
$$;

CREATE OR REPLACE FUNCTION public.list_my_reports()
 RETURNS TABLE(id uuid, created_at timestamptz, owed_amount numeric, payment_status text, result jsonb)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
 SELECT r.id, r.created_at, r.owed_amount, r.payment_status, public.report_teaser(r.result)
 FROM public.reports r WHERE auth.uid() IS NOT NULL AND r.user_id=auth.uid() ORDER BY r.created_at DESC LIMIT 200
$$;

REVOKE ALL ON FUNCTION public.get_report_view(uuid) FROM public;
REVOKE ALL ON FUNCTION public.list_my_reports() FROM public;
GRANT EXECUTE ON FUNCTION public.get_report_view(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_my_reports() TO authenticated;