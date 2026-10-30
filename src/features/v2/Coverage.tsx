// Admin-only Engine v2 coverage registry (inside V2Gate). Shows, per award, what the
// engine can assess completely, what is only partially assessable, and what it refuses.
import { coverageRegistry, type CoverageLevel } from "./engine/coverage";

const STYLE: Record<CoverageLevel, { chip: string; label: string }> = {
  supported: { chip: "bg-primary/10 text-primary", label: "Assessed" },
  partial: { chip: "bg-accent/15 text-accent-foreground", label: "Partial — needs a confirmed fact" },
  unsupported: { chip: "bg-muted text-muted-foreground", label: "Not assessed" },
};

function Group({ level, items }: { level: CoverageLevel; items: string[] }) {
  if (!items.length) return null;
  const s = STYLE[level];
  return (
    <div>
      <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${s.chip}`}>{s.label}</span>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground/90">
        {items.map((it, i) => <li key={i}>{it}</li>)}
      </ul>
    </div>
  );
}

export default function Coverage() {
  const awards = coverageRegistry();
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-foreground">Engine v2 coverage</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        What the preview calculation engine can and cannot assess, per award. Admin preview only —
        this page is not public. Anything listed as partial or not assessed is never turned into a
        dollar figure.
      </p>
      <div className="mt-8 space-y-8">
        {awards.map(a => (
          <section key={a.code} className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-lg font-semibold text-foreground">{a.name}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{a.code} · Data: {a.snapshot}</p>
            <div className="mt-4 space-y-4">
              <Group level="supported" items={a.supported} />
              <Group level="partial" items={a.partial} />
              <Group level="unsupported" items={a.unsupported} />
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
