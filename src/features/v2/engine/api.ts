import { supabase } from "@/integrations/supabase/client";
import type { buildRequest } from "./model";

export type EngineCallError = "signin" | "forbidden" | "invalid" | "failed";

/** Calls the internal-only Engine v2 function. Requires a signed-in authorised tester. */
export async function runEngine(body: ReturnType<typeof buildRequest>): Promise<{ ok: true; result: unknown } | { ok: false; error: EngineCallError }> {
  const { data: s } = await supabase.auth.getSession();
  if (!s.session) return { ok: false, error: "signin" };
  const { data, error } = await supabase.functions.invoke("calculate-award-pay-v2", { body });
  if (error) {
    const status = (error as { context?: Response }).context?.status;
    return { ok: false, error: status === 401 ? "signin" : status === 403 ? "forbidden" : status === 400 ? "invalid" : "failed" };
  }
  return { ok: true, result: data };
}
