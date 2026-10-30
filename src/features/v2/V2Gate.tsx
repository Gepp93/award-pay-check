import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import NotFound from "@/pages/NotFound";

/** Live hosts serve the 2.0 preview to signed-in admin testers only. */
export function isLiveHost(host: string) {
  return host === "awardpay.com.au" || host.endsWith(".awardpay.com.au") || host === "award-pay-check.lovable.app";
}

export default function V2Gate() {
  const [state, setState] = useState<"checking" | "allowed" | "denied">("checking");
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { if (!cancelled) setState("denied"); return; }
      // Users may read only their own role rows (RLS); the server re-checks admin for every 2.0 calculation.
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id).eq("role", "admin");
      if (!cancelled) setState(roles && roles.length > 0 ? "allowed" : "denied");
    })().catch(() => { if (!cancelled) setState("denied"); });
    return () => { cancelled = true; };
  }, []);
  if (state === "checking") return null;
  if (state === "denied") return <NotFound />;
  return <Outlet />;
}
