import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import NotFound from "@/pages/NotFound";

/** Live hosts serve the 2.0 preview to signed-in admin testers only. */
export function isLiveHost(host: string) {
  return host === "awardpay.com.au" || host.endsWith(".awardpay.com.au") || host === "award-pay-check.lovable.app";
}

export default function V2Gate() {
  const live = isLiveHost(window.location.hostname);
  const [state, setState] = useState<"checking" | "allowed" | "denied">(live ? "checking" : "allowed");
  useEffect(() => {
    if (!live) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { if (!cancelled) setState("denied"); return; }
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: data.user.id, _role: "admin" });
      if (!cancelled) setState(isAdmin === true ? "allowed" : "denied");
    })().catch(() => { if (!cancelled) setState("denied"); });
    return () => { cancelled = true; };
  }, [live]);
  if (state === "checking") return null;
  if (state === "denied") return <NotFound />;
  return <Outlet />;
}
