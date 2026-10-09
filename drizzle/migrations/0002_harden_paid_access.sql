ALTER POLICY "Anyone can insert pending subscription purchases" ON public.subscription_purchases WITH CHECK (status = 'pending' AND expires_at IS NULL AND stripe_session_id IS NULL AND (user_id IS NULL OR user_id = auth.uid()) AND product IN ('three_month_pass','yearly_access') AND (report_id IS NULL OR EXISTS (SELECT 1 FROM public.reports r WHERE r.id = report_id)));
DROP POLICY IF EXISTS "Anon and authenticated can view pending subscription purchases" ON public.subscription_purchases;
REVOKE SELECT ON public.subscription_purchases FROM anon;
CREATE OR REPLACE FUNCTION public.get_purchase_status(p_id uuid) RETURNS TABLE(status text, product text, expires_at timestamptz) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT sp.status,sp.product,sp.expires_at FROM public.subscription_purchases sp WHERE sp.id=p_id; $$;
REVOKE ALL ON FUNCTION public.get_purchase_status(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_purchase_status(uuid) TO anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.get_subscription_status(uuid) FROM PUBLIC, anon, authenticated;
COMMENT ON FUNCTION public.get_subscription_status(uuid) IS 'DEPRECATED: use get_purchase_status; private identity fields are not exposed to clients';
CREATE OR REPLACE FUNCTION public.guard_profile_billing() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$ BEGIN
 IF current_user NOT IN ('postgres','service_role') THEN
  IF TG_OP='INSERT' THEN NEW.subscription_status:='free'; NEW.stripe_customer_id:=NULL;
  ELSIF NEW.subscription_status IS DISTINCT FROM OLD.subscription_status OR NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id THEN RAISE EXCEPTION 'Billing fields are server managed' USING ERRCODE='42501'; END IF;
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER guard_profile_billing BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.guard_profile_billing();
CREATE OR REPLACE FUNCTION public.guard_report_billing() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$ BEGIN
 IF current_user NOT IN ('postgres','service_role') THEN
  IF TG_OP='INSERT' THEN NEW.payment_status:='free'; NEW.stripe_session_id:=NULL;
  ELSIF NEW.payment_status IS DISTINCT FROM OLD.payment_status OR NEW.stripe_session_id IS DISTINCT FROM OLD.stripe_session_id OR NEW.owed_amount IS DISTINCT FROM OLD.owed_amount THEN RAISE EXCEPTION 'Report billing fields are server managed' USING ERRCODE='42501'; END IF;
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER guard_report_billing BEFORE INSERT OR UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.guard_report_billing();
REVOKE ALL ON FUNCTION public.guard_profile_billing(), public.guard_report_billing() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.complete_pass_purchase(uuid,text,text,text),public.increment_rate_limit(text,integer,integer),public.handle_new_user(),public.update_updated_at(),public.update_award_pages_updated_at() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.complete_pass_purchase(uuid,text,text,text),public.increment_rate_limit(text,integer,integer) TO service_role;
REVOKE ALL ON FUNCTION public.unlock_report_with_pass(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.unlock_report_with_pass(uuid) TO authenticated,service_role;
REVOKE ALL ON FUNCTION public.resolve_pass_purchase(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_pass_purchase(uuid,text) TO anon,authenticated,service_role;
ALTER POLICY "Anyone can insert leads" ON public.leads WITH CHECK (payment_status = 'none' AND stripe_session_id IS NULL AND product_purchased IS NULL);
