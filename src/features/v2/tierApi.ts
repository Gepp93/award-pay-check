import { supabase } from "@/integrations/supabase/client";
export async function tierCall(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke(tierEndpoint(), { body });
  if (error) {
    const response = (error as { context?: Response }).context;
    const detail = response ? await response.clone().json().catch(() => null) : null;
    throw new Error(detail?.error ?? "billing_unavailable");
  }
  return data;
}
function tierEndpoint() { return new URLSearchParams(window.location.search).get("billing") === "sandbox" ? "tier-sandbox-billing" : "tier-billing"; }
export async function downloadTierPdf(reportId: string) {
  const { data, error } = await supabase.functions.invoke(tierEndpoint(), { body: { action: "pdf", reportId } });
  if (error || !(data instanceof Blob)) throw new Error("pdf_forbidden");
  const url = URL.createObjectURL(data), link = document.createElement("a");
  link.href = url; link.download = `AwardPay-${reportId}.pdf`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const billingError = (e: unknown) => {
  const message = e instanceof Error ? e.message : "";
  if (message === "webhook_not_configured") return "Checkout is paused until Stripe payment confirmation is configured.";
  if (message === "webhook_events_missing") return "Checkout is paused until all required Stripe payment events are enabled.";
  if (message === "assessment_not_supported" || message === "supported_report_required") return "Complete a supported assessment before purchasing this report.";
  if (message === "confirmed_account_required") return "Confirm your account email before starting checkout.";
  if (message === "forbidden" || message === "unauthorized") return "Sign in with your authorised tester account.";
  return "Payment verification is unavailable. Nothing has been charged.";
};