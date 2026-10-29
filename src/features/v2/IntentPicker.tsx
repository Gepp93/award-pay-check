import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Industry } from "./industries";
import { INTENTS, type Intent, type IntentId } from "./intents";

/** One large selectable check option — reused for every industry. */
export function IntentCard({ intent, selected, onSelect }: { intent: Intent; selected: boolean; onSelect: () => void }) {
  const Icon = intent.icon;
  return (
    <button type="button" role="radio" aria-checked={selected} onClick={onSelect}
      className={cn("group relative flex min-h-[132px] w-full items-start gap-4 rounded-lg border bg-card p-5 text-left shadow-soft transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected ? "border-2 border-primary ring-4 ring-primary-soft" : "border-border hover:border-primary")}>
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-primary-soft text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="h-6 w-6" />
      </span>
      <span className="flex-1">
        <span className="flex items-center gap-2 text-lg font-bold">{intent.title}</span>
        <span className="mt-1 block text-sm text-ink-2">{intent.blurb}</span>
        {!intent.live && <span className="mt-2 inline-block rounded-full bg-gold-soft px-2 py-0.5 text-[11px] font-bold text-gold-foreground">Coming soon in preview</span>}
      </span>
      {selected ? <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="h-4 w-4" strokeWidth={3} /></span>
        : <ArrowRight className="mt-1 h-5 w-5 text-primary transition group-hover:translate-x-0.5" />}
    </button>
  );
}

/** Personalised "What would you like to check?" screen. */
export default function IntentPicker({ industry, selected, onSelect }: { industry: Industry; selected: IntentId | null; onSelect: (id: IntentId) => void }) {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px] animate-in fade-in duration-300">
      <section>
        <p className="text-sm font-bold uppercase tracking-wide text-primary">{industry.label}</p>
        <h1 className="mt-2 text-3xl font-extrabold md:text-4xl">What would you like to check?</h1>
        <p className="mt-2 text-ink-2">Pick one. We'll only ask what that check needs.</p>
        <div role="radiogroup" aria-label="What would you like to check?" className="mt-8 grid gap-4 sm:grid-cols-2">
          {INTENTS.map((i) => <IntentCard key={i.id} intent={i} selected={selected === i.id} onSelect={() => onSelect(i.id)} />)}
        </div>
      </section>
      {industry.image && (
        <aside className="hidden lg:block">
          <img src={industry.image} alt="" width={896} height={752} className="aspect-[4/5] w-full rounded-lg object-cover shadow-sheet" />
          <p className="mt-3 text-sm text-ink-3">{industry.blurb}</p>
        </aside>
      )}
    </div>
  );
}
