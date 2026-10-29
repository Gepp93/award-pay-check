import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { ArrowRight, Check, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { V2Provider, useV2 } from "./store";
import { industryById } from "./industries";
import { cn } from "@/lib/utils";

export const Logo = () => (
  <Link to="/v2" className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-foreground">
    <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
      <Check className="h-5 w-5" strokeWidth={3} />
    </span>
    AwardPay
  </Link>
);

const links = [
  { to: "/why-awardpay", label: "Why AwardPay" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/v2#calculators", label: "Check tools" },
  { to: "/v2/pricing-preview", label: "Pricing" },
  { to: "/contact", label: "Contact" },
];

export function V2Nav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 md:px-8">
        <Logo />
        <nav className="hidden items-center gap-6 lg:flex">
          {links.map((l) => (
            <Link key={l.label} to={l.to} className="text-sm font-medium text-ink-2 hover:text-foreground">{l.label}</Link>
          ))}
        </nav>
        <div className="hidden items-center gap-4 lg:flex">
          <Link to="/auth" className="text-sm font-medium text-foreground">Sign in</Link>
          <Button asChild variant="gold" size="sm" className="h-10"><Link to="/v2/industry">Check my pay <ArrowRight className="h-4 w-4" /></Link></Button>
        </div>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {open ? <X /> : <Menu />}
        </Button>
      </div>
      {open && (
        <div className="flex flex-col border-t border-border px-4 pb-4 lg:hidden">
          {links.map((l) => (
            <Link key={l.label} to={l.to} onClick={() => setOpen(false)} className="flex min-h-14 items-center border-b border-border font-medium">{l.label}</Link>
          ))}
          <Link to="/auth" className="flex min-h-14 items-center font-medium">Sign in</Link>
          <Button asChild variant="gold"><Link to="/v2/industry">Check my pay</Link></Button>
        </div>
      )}
    </header>
  );
}

export function PreviewBanner() {
  return (
    <div className="bg-gold-soft px-4 py-2 text-center text-xs font-semibold text-gold-foreground">
      Design preview of AwardPay 2.0 — not yet live. Your real check is still at{" "}
      <Link to="/check" className="underline">Check my payslip</Link>.
    </div>
  );
}

/** Selected industry with its worker photo, shown on every step after picking. */
export function IndustryChip() {
  const { answers } = useV2();
  const ind = industryById(answers.industry);
  if (!ind) return null;
  return (
    <div className="mb-6 flex items-center gap-3 rounded-lg border border-border bg-card p-2 pr-4 shadow-soft">
      {ind.image && <img src={ind.image} alt="" width={96} height={72} className="h-12 w-16 shrink-0 rounded-md object-cover" />}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-ink-3">Your industry</p>
        <p className="truncate font-bold">{ind.label}</p>
      </div>
      <Link to="/v2/industry" className="text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">Change industry</Link>
    </div>
  );
}

const STEPS = ["Industry", "Your details", "Results"];
export function Stepper({ current }: { current: 0 | 1 | 2 }) {
  return (
    <ol className="mx-auto mb-10 flex max-w-xl items-start justify-between" aria-label="Progress">
      {STEPS.map((s, i) => (
        <li key={s} className="relative flex flex-1 flex-col items-center text-center" aria-current={i === current ? "step" : undefined}>
          {i > 0 && <span className={cn("absolute right-1/2 top-4 h-0.5 w-full -translate-y-1/2", i <= current ? "bg-primary" : "bg-rule")} aria-hidden />}
          <span className={cn("relative z-10 grid h-8 w-8 place-items-center rounded-full text-sm font-bold",
            i < current ? "bg-primary text-primary-foreground" : i === current ? "bg-forest text-forest-foreground ring-4 ring-primary-soft" : "border border-rule-strong bg-card text-ink-3")}>
            {i < current ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
          </span>
          <span className={cn("mt-2 text-xs", i === current ? "font-bold text-foreground" : "text-ink-3")}>{s}</span>
        </li>
      ))}
    </ol>
  );
}

export function V2Footer() {
  return (
    <footer className="bg-forest text-forest-foreground">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3 md:px-8">
        <div>
          <p className="text-lg font-extrabold">AwardPay</p>
          <p className="mt-2 text-sm opacity-80">Check your payslip against Australian award rates. AwardPay is independent and is not affiliated with or endorsed by the Fair Work Ombudsman or the Fair Work Commission.</p>
        </div>
        <nav className="flex flex-col gap-2 text-sm">
          <Link to="/how-it-works" className="opacity-80 hover:opacity-100">How it works</Link>
          <Link to="/why-awardpay" className="opacity-80 hover:opacity-100">Why AwardPay</Link>
          <Link to="/pricing" className="opacity-80 hover:opacity-100">Pricing</Link>
          <Link to="/contact" className="opacity-80 hover:opacity-100">Contact</Link>
        </nav>
        <p className="text-xs opacity-70">General information only, not legal advice. For help with a dispute, contact the Fair Work Ombudsman on 13 13 94.</p>
      </div>
    </footer>
  );
}

export default function V2Layout() {
  const { pathname } = useLocation();
  useEffect(() => { if (!window.location.hash) window.scrollTo(0, 0); }, [pathname]);
  return (
    <V2Provider>
      <div className="min-h-screen bg-background">
        <PreviewBanner />
        <V2Nav />
        <Outlet />
        <V2Footer />
      </div>
    </V2Provider>
  );
}
