import { Clock, FileText, Gift, CalendarDays, type LucideIcon } from "lucide-react";

export type IntentId = "payslip" | "overtime" | "allowances" | "weekly";
export type QuestionId = "role" | "employment" | "state" | "extras" | "pay";

export interface Intent {
  id: IntentId;
  title: string;
  blurb: string;
  icon: LucideIcon;
  /** Smallest question set this check needs (empty = straight to upload). */
  questions: QuestionId[];
  /** Existing, verified tool this preview hands off to; null when not yet connected. */
  live: { to: string; label: string } | null;
}

export const INTENTS: Intent[] = [
  { id: "payslip", title: "Check my payslip", blurb: "Upload a photo or PDF and we'll compare it with your award.", icon: FileText,
    questions: [], live: { to: "/check", label: "Open the live payslip check" } },
  { id: "overtime", title: "Check my overtime", blurb: "See if long days and extra hours were paid at the right rate.", icon: Clock,
    questions: ["employment", "pay"], live: { to: "/check", label: "Continue in the live checker" } },
  { id: "allowances", title: "Find missing allowances", blurb: "Tools, travel, uniforms and more you may be owed.", icon: Gift,
    questions: ["role", "extras"], live: null },
  { id: "weekly", title: "Check my weekly pay", blurb: "Compare a normal week's pay with award minimums.", icon: CalendarDays,
    questions: ["employment", "state", "pay"], live: { to: "/check", label: "Continue in the live checker" } },
];

export const intentById = (id?: string | null) => INTENTS.find((i) => i.id === id);
