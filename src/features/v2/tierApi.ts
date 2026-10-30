import { supabase } from "@/integrations/supabase/client";
export async function tierCall(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("tier-billing", { body });
  if (error) {
    const response = (error as { context?: Response }).context;
    const detail = response ? await response.clone().json().catch(() => null) : null;
    throw new Error(detail?.error ?? "billing_unavailable");
  }
  return data;
}
export const billingError = (e: unknown) => {
  const message = e instanceof Error ? e.message : "";
  if (message === "webhook_not_configured") return "Checkout is paused until Stripe payment confirmation is configured.";
  if (message === "assessment_not_supported" || message === "supported_report_required") return "Complete a supported assessment before purchasing this report.";
  if (message === "confirmed_account_required") return "Confirm your account email before starting checkout.";
  if (message === "forbidden" || message === "unauthorized") return "Sign in with your authorised tester account.";
  return "Payment verification is unavailable. Nothing has been charged.";
};