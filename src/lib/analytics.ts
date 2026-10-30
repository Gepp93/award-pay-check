// Minimal GA4 helpers. Never pass personal data, emails, report IDs, payroll details or amounts.
type Params = Record<string, string | number | boolean>;
declare global { interface Window { gtag?: (...args: unknown[]) => void } }

export function track(event: string, params: Params = {}) {
  try { window.gtag?.("event", event, params); } catch { /* Analytics must never break the app. */ }
}

export function trackPageView(path: string) {
  track("page_view", { page_path: path, page_location: window.location.origin + path, page_title: document.title });
}

// Fires once per verified Stripe session; the session ID is only stored locally, never sent.
export function trackPurchaseOnce(sessionId: string, params: Params = {}) {
  const key = `ga_purchase_${sessionId}`;
  try { if (localStorage.getItem(key)) return; localStorage.setItem(key, "1"); } catch { return; }
  track("purchase_confirmed", params);
}
