CREATE OR REPLACE FUNCTION public.get_subscription_status(purchase_id uuid)
RETURNS TABLE(status text, user_id uuid, email text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sp.status, sp.user_id, sp.email
  FROM public.subscription_purchases sp
  WHERE sp.id = purchase_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_subscription_status(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_subscription_status(uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_subscription_status(uuid) TO service_role;