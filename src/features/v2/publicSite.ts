import { useLocation } from "react-router-dom";
import type { IndustryId } from "./industries";

/**
 * Public 2.0 marketing pages hand off to the live /check flow.
 * Each 2.0 industry maps to the identical live checker industry, or to nothing.
 * Industries without an exact live equivalent are never mapped to an unrelated one.
 */
export const LIVE_INDUSTRY: Record<IndustryId, string | null> = {
  construction: "Construction",
  hospitality: "Hospitality",
  retail: "Retail",
  healthcare: "Healthcare",
  manufacturing: "Manufacturing",
  transport: "Transport",
  education: "Education",
  agriculture: null,
  other: null,
};

/** Live checker URL for an industry card; unmapped industries start the checker without one. */
export function liveCheckUrl(id?: IndustryId | null): string {
  const label = id ? LIVE_INDUSTRY[id] : null;
  return label ? `/check?industry=${encodeURIComponent(label)}` : "/check";
}

/** True when the page is served on the public site rather than the admin-only /v2 preview. */
export function isPublicPath(pathname: string) {
  return !(pathname === "/v2" || pathname.startsWith("/v2/"));
}

export function usePublicSite() {
  return isPublicPath(useLocation().pathname);
}

export function siteLinks(publicSite: boolean) {
  return publicSite
    ? { home: "/", howItWorks: "/how-it-works", pricing: "/pricing", signIn: "/auth" }
    : { home: "/v2", howItWorks: "/v2/how-it-works", pricing: "/v2/pricing", signIn: "/v2/sign-in" };
}
