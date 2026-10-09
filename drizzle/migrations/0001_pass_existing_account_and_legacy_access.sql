CREATE OR REPLACE FUNCTION public.complete_pass_purchase(p_purchase_id uuid, p_session_id text, p_email text, p_product text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE purchase public.subscription_purchases%ROWTYPE; expiry timestamptz; customer_email text; owner_id uuid;
BEGIN
 IF p_product NOT IN ('three_month_pass','yearly_access') THEN RAISE EXCEPTION 'Invalid product'; END IF;
 SELECT * INTO purchase FROM public.subscription_purchases WHERE id=p_purchase_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Purchase not found'; END IF;
 IF purchase.status='paid' THEN RETURN; END IF;
 customer_email:=COALESCE(p_email,purchase.email);
 owner_id:=purchase.user_id;
 IF owner_id IS NULL AND customer_email IS NOT NULL THEN
  SELECT id INTO owner_id FROM public.profiles WHERE lower(email)=lower(customer_email) LIMIT 1;
 END IF;
 PERFORM pg_advisory_xact_lock(hashtext(COALESCE(owner_id::text,lower(customer_email),p_purchase_id::text)));
 SELECT max(expires_at) INTO expiry FROM public.subscription_purchases
 WHERE status='paid' AND expires_at>now() AND ((owner_id IS NOT NULL AND user_id=owner_id) OR (customer_email IS NOT NULL AND lower(email)=lower(customer_email)));
 expiry:=GREATEST(COALESCE(expiry,now()),now())+CASE WHEN p_product='three_month_pass' THEN interval '90 days' ELSE interval '1 year' END;
 UPDATE public.subscription_purchases SET status='paid',product=p_product,stripe_session_id=p_session_id,email=customer_email,user_id=owner_id,expires_at=expiry,updated_at=now() WHERE id=p_purchase_id;
 IF owner_id IS NOT NULL THEN UPDATE public.profiles SET subscription_status=CASE WHEN p_product='three_month_pass' THEN 'three_month' ELSE 'yearly' END WHERE id=owner_id; END IF;
 IF purchase.report_id IS NOT NULL THEN UPDATE public.reports SET payment_status='paid',stripe_session_id=p_session_id WHERE id=purchase.report_id; END IF;
END;
$fn$;
REVOKE ALL ON FUNCTION public.complete_pass_purchase(uuid,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.complete_pass_purchase(uuid,text,text,text) TO service_role;
CREATE OR REPLACE FUNCTION public.unlock_report_with_pass(p_report_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $fn$
DECLARE active_pass boolean;
BEGIN
 IF auth.uid() IS NULL THEN RETURN false; END IF;
 SELECT EXISTS(SELECT 1 FROM public.subscription_purchases WHERE user_id=auth.uid() AND status='paid' AND product IN ('three_month_pass','yearly_access') AND expires_at>now())
 OR EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND (p.subscription_status IN ('active','monthly','3month') OR (p.subscription_status='yearly' AND NOT EXISTS(SELECT 1 FROM public.subscription_purchases sp WHERE sp.user_id=p.id AND sp.status='paid')))) INTO active_pass;
 IF NOT active_pass THEN RETURN false; END IF;
 UPDATE public.reports SET payment_status='paid' WHERE id=p_report_id AND user_id=auth.uid();
 RETURN FOUND;
END;
$fn$;
REVOKE ALL ON FUNCTION public.unlock_report_with_pass(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.unlock_report_with_pass(uuid) TO authenticated,service_role;