import { expect, test } from "bun:test";
import { isLiveHost } from "../src/features/v2/V2Gate";

test("2.0 preview is gated on every live host", () => {
  for (const h of ["www.awardpay.com.au", "awardpay.com.au", "award-pay-check.lovable.app"]) expect(isLiveHost(h)).toBe(true);
});
test("2.0 preview stays open on preview/local hosts", () => {
  for (const h of ["localhost", "id-preview--f03ec84b-bcbe-4009-84ef-4ae0181eb8dc.lovable.app"]) expect(isLiveHost(h)).toBe(false);
});
