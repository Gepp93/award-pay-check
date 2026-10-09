CREATE OR REPLACE FUNCTION public.claim_my_passes()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE uid uuid := auth.uid(); confirmed_email text; n_pass integer := 0; n_rep integer := 0; best text;
BEGIN
 IF uid IS NULL THEN RETURN 0; END IF;
 SELECT u.email INTO confirmed_email FROM auth.users u WHERE u.id = uid AND u.email_confirmed_at IS NOT NULL;
 IF confirmed_email IS NULL THEN RETURN 0; END IF;
 WITH claimed AS (
  UPDATE public.subscription_purchases SET user_id = uid, updated_at = now()
  WHERE user_id IS NULL AND status = 'paid' AND email IS NOT NULL AND lower(email) = lower(confirmed_email)
  RETURNING report_id)
 SELECT count(*) INTO n_pass FROM claimed;
 UPDATE public.reports r SET user_id = uid
 WHERE r.user_id IS NULL AND r.id IN (SELECT sp.report_id FROM public.subscription_purchases sp WHERE sp.user_id = uid AND sp.status = 'paid' AND sp.report_id IS NOT NULL);
 GET DIAGNOSTICS n_rep = ROW_COUNT;
 SELECT sp.product INTO best FROM public.subscription_purchases sp
 WHERE sp.user_id = uid AND sp.status = 'paid' AND sp.expires_at > now() ORDER BY sp.expires_at DESC LIMIT 1;
 IF best IS NOT NULL THEN
  UPDATE public.profiles SET subscription_status = CASE WHEN best = 'three_month_pass' THEN 'three_month' ELSE 'yearly' END WHERE id = uid;
 END IF;
 RETURN n_pass + n_rep;
END; $$;
REVOKE ALL ON FUNCTION public.claim_my_passes() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_my_passes() TO authenticated;