import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { IndustryId } from "./industries";
import type { IntentId } from "./intents";

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
}

const KEY = "awardpay-v2-preview";
const empty: V2Answers = { industry: null, intent: null, role: "", employment: "", state: "", extras: [], hoursPerWeek: "", hourlyRate: "" };

const Ctx = createContext<{ answers: V2Answers; update: (p: Partial<V2Answers>) => void; reset: () => void } | null>(null);

export function V2Provider({ children }: { children: ReactNode }) {
  const [answers, setAnswers] = useState<V2Answers>(() => {
    try { return { ...empty, ...JSON.parse(sessionStorage.getItem(KEY) || "{}") }; } catch { return empty; }
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
