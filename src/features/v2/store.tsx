import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { IndustryId } from "./industries";
import type { IntentId } from "./intents";
import type { Field } from "./payslipFields";
import { emptyDraft, type EngineDraft } from "./engine/model";

/** Answers only — never the payslip file — kept in session storage so Back keeps answers. */
export interface V2Answers {
  industry: IndustryId | null;
  intent: IntentId | null;
  role: string;
  employment: "Full-time" | "Part-time" | "Casual" | "";
  state: string;
  extras: string[];
  hoursPerWeek: string;
  hourlyRate: string;
  /** Payslip fields exactly as the user confirmed them (values + extracted/corrected/missing tags). Never the file. */
  payslip: Field[] | null;
  /** Engine v2 questionnaire answers. */
  engine: EngineDraft;
  /** Last Engine v2 response, shown as-is on the results screen. */
  result: unknown | null;
}

const KEY = "awardpay-v2-preview";
const empty: V2Answers = { industry: null, intent: null, role: "", employment: "", state: "", extras: [], hoursPerWeek: "", hourlyRate: "", payslip: null, engine: emptyDraft, result: null };

const Ctx = createContext<{ answers: V2Answers; update: (p: Partial<V2Answers>) => void; reset: () => void } | null>(null);

export function V2Provider({ children }: { children: ReactNode }) {
  const [answers, setAnswers] = useState<V2Answers>(() => {
    try { const saved = JSON.parse(sessionStorage.getItem(KEY) || "{}"); return { ...empty, ...saved, engine: { ...emptyDraft, ...(saved.engine ?? {}) } }; } catch { return empty; }
  });
  useEffect(() => { sessionStorage.setItem(KEY, JSON.stringify(answers)); }, [answers]);
  return (
    <Ctx.Provider value={{ answers, update: (p) => setAnswers((a) => ({ ...a, ...p })), reset: () => setAnswers(empty) }}>
      {children}
    </Ctx.Provider>
  );
}

export function useV2() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useV2 outside provider");
  return c;
}
