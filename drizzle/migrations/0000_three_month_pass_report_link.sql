ALTER TABLE public.subscription_purchases ADD COLUMN IF NOT EXISTS report_id uuid REFERENCES public.reports(id);
CREATE INDEX IF NOT EXISTS subscription_purchases_report_id_idx ON public.subscription_purchases(report_id);
CREATE INDEX IF NOT EXISTS subscription_purchases_session_idx ON public.subscription_purchases(stripe_session_id);

CREATE OR REPLACE FUNCTION public.complete_pass_purchase(p_purchase_id uuid, p_session_id text, p_email text, p_product text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE purchase public.subscription_purchases%ROWTYPE; expiry timestamptz; customer_email text;
BEGIN
  IF p_product NOT IN ('three_month_pass','yearly_access') THEN RAISE EXCEPTION 'Invalid product'; END IF;
  SELECT * INTO purchase FROM public.subscription_purchases WHERE id = p_purchase_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Purchase not found'; END IF;
  IF purchase.status = 'paid' THEN RETURN; END IF;
  customer_email := COALESCE(p_email, purchase.email);
  PERFORM pg_advisory_xact_lock(hashtext(COALESCE(purchase.user_id::text, lower(customer_email), p_purchase_id::text)));
  SELECT max(expires_at) INTO expiry FROM public.subscription_purchases
  WHERE status = 'paid' AND expires_at > now()
    AND (purchase.user_id IS NOT NULL AND user_id = purchase.user_id OR customer_email IS NOT NULL AND lower(email) = lower(customer_email));
  expiry := GREATEST(COALESCE(expiry, now()), now());
  expiry := expiry + CASE WHEN p_product = 'three_month_pass' THEN interval '90 days' ELSE interval '1 year' END;
  UPDATE public.subscription_purchases SET status='paid', product=p_product, stripe_session_id=p_session_id,
    email=customer_email, expires_at=expiry, updated_at=now() WHERE id=p_purchase_id;
  IF purchase.user_id IS NOT NULL THEN
    UPDATE public.profiles SET subscription_status=CASE WHEN p_product='three_month_pass' THEN 'three_month' ELSE 'yearly' END WHERE id=purchase.user_id;
  END IF;
  IF purchase.report_id IS NOT NULL THEN
    UPDATE public.reports SET payment_status='paid', stripe_session_id=p_session_id WHERE id=purchase.report_id;
  END IF;
END;
$fn$;
REVOKE ALL ON FUNCTION public.complete_pass_purchase(uuid,text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_pass_purchase(uuid,text,text,text) TO service_role;

CREATE OR REPLACE FUNCTION public.resolve_pass_purchase(p_purchase_id uuid DEFAULT NULL, p_session_id text DEFAULT NULL)
RETURNS TABLE(status text, report_id uuid, product text, expires_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $fn$
 SELECT sp.status,sp.report_id,sp.product,sp.expires_at FROM public.subscription_purchases sp
 WHERE (p_purchase_id IS NOT NULL AND sp.id=p_purchase_id)
 OR (p_purchase_id IS NULL AND p_session_id IS NOT NULL AND sp.stripe_session_id=p_session_id)
 LIMIT 1;
$fn$;
REVOKE ALL ON FUNCTION public.resolve_pass_purchase(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_pass_purchase(uuid,text) TO anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.unlock_report_with_pass(p_report_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $fn$
DECLARE active_pass boolean;
BEGIN
 IF auth.uid() IS NULL THEN RETURN false; END IF;
 SELECT EXISTS(SELECT 1 FROM public.subscription_purchases WHERE user_id=auth.uid() AND status='paid' AND product IN ('three_month_pass','yearly_access') AND expires_at>now())
 OR EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND subscription_status IN ('active','monthly','3month'))
 INTO active_pass;
 IF NOT active_pass THEN RETURN false; END IF;
 UPDATE public.reports SET payment_status='paid' WHERE id=p_report_id AND user_id=auth.uid();
 RETURN FOUND;
END;
$fn$;
REVOKE ALL ON FUNCTION public.unlock_report_with_pass(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.unlock_report_with_pass(uuid) TO authenticated,service_role;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $fn$
DECLARE pending_product text;
BEGIN
 SELECT sp.product INTO pending_product FROM public.subscription_purchases sp
 WHERE lower(sp.email)=lower(new.email) AND sp.status='paid' AND sp.expires_at>now()
 ORDER BY sp.expires_at DESC LIMIT 1;
 INSERT INTO public.profiles(id,email,subscription_status) VALUES(new.id,new.email,
 CASE WHEN pending_product='three_month_pass' THEN 'three_month' WHEN pending_product='yearly_access' THEN 'yearly' ELSE 'free' END);
 UPDATE public.subscription_purchases SET user_id=new.id WHERE lower(email)=lower(new.email) AND status='paid' AND user_id IS NULL;
 RETURN new;
END;
$fn$;