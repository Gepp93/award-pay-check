// AwardPay 2.0 award discovery. Suggestions only — the user always confirms.
// Evidence = a specific role/duty phrase. Generic words (crew, worker, staff,
// foreman, supervisor, level…) and employer names are never evidence.
import { RULE_PACKS } from "../../../../supabase/functions/_shared/engine-v2/rulepacks";

export interface AwardCandidate { code: string; name: string; industries: string[]; terms: string[] }

/** Official award names (Fair Work award list). Codes and names only — no rates. */
export const CANDIDATES: AwardCandidate[] = [
  { code: "MA000004", name: "General Retail Industry Award 2020", industries: ["retail"],
    terms: ["retail", "shop assistant", "sales assistant", "store", "checkout", "cashier", "shelf", "stock", "merchandiser"] },
  { code: "MA000009", name: "Hospitality Industry (General) Award 2020", industries: ["hospitality"],
    terms: ["barista", "waiter", "waitress", "wait staff", "bartender", "bar attendant", "bar staff", "cafe", "café", "restaurant", "hotel", "kitchen hand", "cook", "chef", "housekeeper", "food and beverage"] },
  { code: "MA000003", name: "Fast Food Industry Award 2020", industries: ["hospitality", "retail"],
    terms: ["fast food", "takeaway", "take away", "drive thru", "drive through", "pizza delivery"] },
  { code: "MA000020", name: "Building and Construction General On-site Award 2020", industries: ["construction"],
    terms: ["civil", "construction", "building site", "concreter", "scaffolder", "formwork", "formworker", "steel fixer", "plant operator", "labourer", "pipelayer", "bricklayer"] },
  { code: "MA000025", name: "Electrical, Electronic and Communications Contracting Award 2020", industries: ["construction"],
    terms: ["electrician", "electrical", "electronic", "data cabling", "cabler", "sparky", "communications technician"] },
];

/** Words that never establish award coverage on their own. */
export const GENERIC = ["crew", "worker", "staff", "employee", "member", "team", "foreman", "supervisor", "manager", "leader", "level", "grade", "general", "assistant", "operator", "hand"];

export const isSupported = (code: string) => !!RULE_PACKS[code];

export interface Suggestion { code: string; name: string; supported: boolean; evidence: string[] }

const norm = (s: string) => ` ${s.toLowerCase().replace(/[^a-z0-9é ]+/g, " ").replace(/\s+/g, " ").trim()} `;

/** Rank candidates from confirmed job title, industry and duties. Never returns a candidate without a specific phrase match. */
export function discoverAwards(input: { jobTitle: string; industry?: string | null; duties?: string }): Suggestion[] {
  const text = norm(`${input.jobTitle} ${input.duties ?? ""}`);
  return CANDIDATES.map(c => {
    const evidence = c.terms.filter(t => !GENERIC.includes(t) && text.includes(norm(t)));
    const score = evidence.reduce((n, t) => n + t.split(" ").length * 2, 0) + (evidence.length && input.industry && c.industries.includes(input.industry) ? 1 : 0);
    return { code: c.code, name: c.name, supported: isSupported(c.code), evidence, score };
  }).filter(x => x.evidence.length > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ score: _s, ...x }) => x);
}

export const awardName = (code: string) => CANDIDATES.find(c => c.code === code)?.name ?? code;
