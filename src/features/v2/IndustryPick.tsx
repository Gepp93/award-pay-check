import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, HelpCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { INDUSTRIES, type IndustryId } from "./industries";
import { useV2 } from "./store";
import { Stepper } from "./Layout";

/** Keyword hint for unsure users — a suggestion only; the user still confirms. */
const KEYWORDS: [IndustryId, RegExp][] = [
  ["construction", /build|construct|site|electric|plumb|carpent|labour|trade/i],
  ["hospitality", /cafe|barista|restaurant|bar|hotel|kitchen|chef|cook|waiter/i],
  ["retail", /retail|shop|store|checkout|sales/i],
  ["healthcare", /nurse|aged|disab|care|health|hospital|support worker/i],
  ["manufacturing", /factory|manufactur|production|machine|process/i],
  ["transport", /truck|driver|deliver|warehouse|logistic|forklift/i],
  ["agriculture", /farm|pick|harvest|livestock|vineyard/i],
  ["education", /teach|school|childcare|educator|tutor/i],
];

export default function IndustryPick() {
  const { answers, update } = useV2();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [text, setText] = useState("");
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    const pick = params.get("pick") as IndustryId | null;
    if (pick && INDUSTRIES.some((i) => i.id === pick)) { choose(pick); navigate("/v2/check", { replace: true }); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choose = (id: IndustryId) => update({ industry: id, role: answers.industry === id ? answers.role : "", extras: answers.industry === id ? answers.extras : [] });
  const pickAndGo = (id: IndustryId) => { choose(id); navigate("/v2/check"); };
  const [suggested, setSuggested] = useState<IndustryId | null>(null);

  const suggest = () => {
    const found = KEYWORDS.find(([, re]) => re.test(text));
    if (found) { setSuggested(found[0]); setHint(`This sounds like ${INDUSTRIES.find((i) => i.id === found[0])!.label}. Change it if that's not right.`); }
    else { setSuggested("other"); setHint("We couldn't match that to an industry, so we suggest Other."); }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:px-8">
      <Link to="/v2" className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-ink-2 hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to home</Link>
      <Stepper current={0} />
      <h1 className="text-3xl font-extrabold md:text-4xl">What industry do you work in?</h1>
      <p className="mt-2 text-ink-2">We'll tailor the questions. You'll confirm your award and classification later.</p>
      <div role="radiogroup" aria-label="Industry" className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
        {INDUSTRIES.map((i) => {
          const on = answers.industry === i.id;
          return (
            <button key={i.id} role="radio" aria-checked={on} onClick={() => pickAndGo(i.id)}
              className={cn("relative overflow-hidden rounded-lg border bg-card text-left shadow-soft transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                on ? "border-2 border-primary ring-4 ring-primary-soft" : "border-border hover:border-rule-strong")}>
              {i.image
                ? <img src={i.image} alt="" loading="lazy" width={896} height={752} className="aspect-[4/3] w-full object-cover" />
                : <div className="grid aspect-[4/3] w-full place-items-center bg-muted"><HelpCircle className="h-10 w-10 text-ink-3" /></div>}
              {on && <span className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="h-4 w-4" strokeWidth={3} /></span>}
              <span className="flex items-center justify-between p-4 font-bold">{i.label}<ArrowRight className="h-4 w-4 text-primary" /></span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col gap-4 rounded-lg bg-primary-soft p-5 md:flex-row md:items-center">
        <Sparkles className="h-8 w-8 shrink-0 text-primary" />
        <div className="flex-1">
          <p className="font-bold">Not sure?</p>
          <p className="text-sm text-ink-2">Describe your job and we'll suggest an industry.</p>
          <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (text.trim()) suggest(); }}>
            <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. I'm an electrician on residential sites in NSW" className="h-12 bg-card text-base" aria-label="Describe your job" />
            <Button type="submit" size="icon" className="h-12 w-12 shrink-0" aria-label="Suggest industry"><ArrowRight /></Button>
          </form>
          {hint && <div className="mt-3 flex flex-wrap items-center gap-3" role="status">
            <p className="text-sm font-medium">{hint}</p>
            {suggested && <Button size="sm" onClick={() => pickAndGo(suggested)}>Continue with {INDUSTRIES.find((i) => i.id === suggested)!.label} <ArrowRight /></Button>}
          </div>}
        </div>
      </div>

    </main>
  );
}
