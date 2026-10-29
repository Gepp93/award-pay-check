import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { THREE_MONTH_PASS } from "@/lib/plans";

const TIERS = [
  { name: "Pay Check", price: "$9", per: "One-off", items: ["Check 1 payslip", "See potential underpayment", "Basic breakdown"] },
  { name: "Underpayment Report", price: "$29", per: "One-off", popular: true, items: ["Full itemised report", "Award clauses & references", "Multiple pay periods", "Employer letter template", "Evidence checklist"] },
  { name: "Pay Protection", price: "$59", per: "per year", items: ["Unlimited payslip checks", "All calculators", "Rate change alerts", "Save your history", "Priority support"] },
];

export default function PricingPreview() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12 md:px-8">
      <div className="rounded-lg border-2 border-dashed border-gold bg-gold-soft p-4 text-sm">
        <p className="font-bold">Proposed prices — preview only, not available to buy</p>
        <p className="mt-1 text-ink-2">The live offer today is the {THREE_MONTH_PASS.name} at {THREE_MONTH_PASS.priceLabel}. <Link to="/pricing" className="font-semibold underline">See current pricing</Link></p>
      </div>
      <h1 className="mt-8 text-center text-3xl font-extrabold md:text-4xl">Choose what's right for you</h1>
      <p className="mt-2 text-center text-ink-2">Payment buys an assessment or service — not a guaranteed underpayment finding or recovery.</p>
      <div className="mt-10 grid gap-6 md:grid-cols-3 md:items-start">
        {TIERS.map((t) => (
          <article key={t.name} className={cn("flex flex-col rounded-lg border bg-card p-6 shadow-soft", t.popular ? "border-2 border-primary md:-mt-4" : "border-border")}>
            {t.popular && <span className="-mx-6 -mt-6 mb-4 rounded-t-[14px] bg-primary py-1 text-center text-xs font-bold text-primary-foreground">Most popular</span>}
            <h2 className="font-bold">{t.name}</h2>
            <p className="tabular mt-2 text-4xl font-extrabold">{t.price}</p>
            <p className="text-sm text-ink-3">{t.per}</p>
            <ul className="mt-5 flex-1 space-y-2 text-sm">
              {t.items.map((i) => <li key={i} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-primary" />{i}</li>)}
            </ul>
            <Button disabled variant={t.popular ? "gold" : "outline"} className="mt-6 w-full">Preview — not available</Button>
          </article>
        ))}
      </div>
    </main>
  );
}
