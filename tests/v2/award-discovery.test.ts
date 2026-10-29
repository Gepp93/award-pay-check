import { describe, expect, test } from "bun:test";
import { discoverAwards } from "../../src/features/v2/engine/awardDiscovery";
import { classificationsFor, emptyDraft, sanitizeDraft, stepsFor, withAward } from "../../src/features/v2/engine/model";

const codes = (jobTitle: string, industry?: string, duties?: string) => discoverAwards({ jobTitle, industry, duties }).map(s => s.code);

describe("award discovery", () => {
  test("Civil Crew Foreman: only Building and Construction, never cabin crew/fast food/newspapers or Electrical", () => {
    const s = discoverAwards({ jobTitle: "Civil Crew Foreman", industry: "construction" });
    expect(s.map(x => x.code)).toEqual(["MA000020"]);
    expect(s[0].supported).toBe(false);
    expect(s[0].evidence).toEqual(["civil"]);
  });
  test("employer name is not evidence", () => expect(codes("Crew Foreman", "construction")).toEqual([]));
  test("Electrical needs electrical evidence", () => {
    expect(codes("Electrician", "construction")).toEqual(["MA000025"]);
    expect(codes("Civil Crew Foreman", "construction", "electrical installation")).toContain("MA000025");
  });
  test("Retail assistant", () => expect(codes("Retail assistant", "retail")[0]).toBe("MA000004"));
  test("Barista", () => expect(codes("Barista", "hospitality")).toEqual(["MA000009"]));
  test("Fast food worker", () => expect(codes("Fast food crew member", "hospitality")).toEqual(["MA000003"]));
  test("unknown occupation gets no suggestion", () => expect(codes("Zookeeper", "other")).toEqual([]));
  test("generic words alone are not evidence", () => expect(codes("Crew member team leader level 2")).toEqual([]));
});

describe("classifications", () => {
  test("unique ids that belong to the award", () => {
    for (const code of ["MA000004", "MA000009", "MA000003"]) {
      const ids = classificationsFor(code).map(c => c.id);
      expect(ids.length).toBeGreaterThan(0);
      expect(new Set(ids).size).toBe(ids.length);
    }
    expect(classificationsFor("MA000020")).toEqual([]);
  });
  test("switching award clears classification", () => {
    const id = classificationsFor("MA000004")[0].id;
    const d = withAward({ ...emptyDraft, awardCode: "MA000004", classificationFixedId: id, enterpriseAgreement: "no" }, "MA000009");
    expect(d.classificationFixedId).toBeNull();
    expect(d.enterpriseAgreement).toBe("");
  });
  test("stale classification from another award is dropped on load", () => {
    const id = classificationsFor("MA000004")[0].id;
    expect(classificationsFor("MA000009").some(c => c.id === id)).toBe(false);
    expect(sanitizeDraft({ ...emptyDraft, awardCode: "MA000009", classificationFixedId: id }).classificationFixedId).toBeNull();
  });
  test("unsupported award stops at the award question", () => {
    expect(stepsFor({ ...emptyDraft, awardCode: "MA000020", enterpriseAgreement: "no" })).toEqual(["award"]);
    expect(stepsFor({ ...emptyDraft, awardCode: "MA000004", enterpriseAgreement: "no" })).toContain("classification");
  });
});
