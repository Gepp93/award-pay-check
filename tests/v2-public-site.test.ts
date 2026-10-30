import { describe, expect, test } from "bun:test";
import { LIVE_INDUSTRY, liveCheckUrl, isPublicPath, siteLinks } from "../src/features/v2/publicSite";
import { INDUSTRIES } from "../src/features/check/model";

describe("public 2.0 homepage industry cards", () => {
  const exact: [string, string][] = [
    ["construction", "Construction"], ["hospitality", "Hospitality"], ["retail", "Retail"], ["healthcare", "Healthcare"],
    ["manufacturing", "Manufacturing"], ["transport", "Transport"], ["education", "Education"],
  ];
  for (const [id, label] of exact) {
    test(`${id} opens the live checker with ${label}`, () => {
      expect(liveCheckUrl(id as any)).toBe(`/check?industry=${label}`);
      expect(INDUSTRIES).toContain(label);
    });
  }
  test("agriculture has no live equivalent and is not mapped to another industry", () => {
    expect(LIVE_INDUSTRY.agriculture).toBeNull();
    expect(liveCheckUrl("agriculture")).toBe("/check");
  });
  test("other starts the checker without an industry", () => {
    expect(liveCheckUrl("other")).toBe("/check");
  });
  test("public links never point into the admin-only /v2 area", () => {
    expect(Object.values(siteLinks(true)).some((to) => to.startsWith("/v2"))).toBe(false);
    for (const id of Object.keys(LIVE_INDUSTRY)) expect(liveCheckUrl(id as any).startsWith("/v2")).toBe(false);
  });
  test("/v2 paths are not treated as public", () => {
    expect(isPublicPath("/")).toBe(true);
    expect(isPublicPath("/pricing")).toBe(true);
    expect(isPublicPath("/v2")).toBe(false);
    expect(isPublicPath("/v2/results")).toBe(false);
  });
});
