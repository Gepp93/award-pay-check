import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import SEO from "@/components/SEO";
import { ApNav } from "@/components/ApNav";

function useReveal() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const els = document.querySelectorAll<HTMLElement>("[data-reveal]");
    if (reduced) { els.forEach(e => e.classList.add("is-visible")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.15 });
    els.forEach(e => io.observe(e));
    return () => io.disconnect();
  }, []);
}

type Tier = {
  name: string;
  price: string;
  priceSuffix?: string;
  who: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
};

const tiers: Tier[] = [
  {
    name: "Free",
    price: "$0",
    who: "See if you're underpaid",
    features: [
      "Snap one payslip",
      "We check it against official Fair Work rates",
      "See your headline result: roughly how much you may be owed, and how many issues we found",
      "No account needed",
    ],
    cta: "Check my payslip — free",
  },
  {
    name: "Full report",
    price: "$10",
    priceSuffix: "one-time",
    who: "Find out exactly what's missing and how to claim it",
    features: [
      "Everything in Free",
      "Every missing penalty, loading and allowance — itemised, with amounts",
      "Your total owed for that pay period",
      "Step-by-step instructions to recover it",
      "Downloadable PDF report",
    ],
    cta: "Check my payslip",
    highlighted: true,
  },
  {
    name: "Back-pay pack",
    price: "$30",
    priceSuffix: "one-time",
    who: "Build your full claim across multiple payslips",
    features: [
      "Everything in Full report",
      "Up to 5 payslips checked",
      "Combined into one total back-pay figure",
      "A single claim summary with recovery steps for the whole period",
    ],
    cta: "Check my payslip",
  },
];

const Pricing = () => {
  const navigate = useNavigate();
  const start = () => navigate("/new-check-step-1");
  useReveal();

  return (
    <div>
      <SEO
        title="Pricing — Free pay check, pay only if you're owed | AwardPay"
        description="Checking your pay is always free. Pay only once you've seen what you're owed. $10 Full report, $30 Back-pay pack. Prices in AUD."
        path="/pricing"
      />

      <ApNav />

      <section className="ap-wrap ap-section" style={{ paddingBottom: 28 }}>
        <div className="mx-auto text-center" style={{ maxWidth: 760 }}>
          <div className="ap-eyebrow" data-reveal>Pricing</div>
          <h1 className="ap-h1 text-center" data-reveal>
            Simple pricing. Pay only when it's <span className="ap-hl">worth&nbsp;it</span>.
          </h1>
          <p className="ap-lede text-center" data-reveal style={{ marginBottom: 0, maxWidth: "none" }}>
            Checking your pay is always free. You only pay once you've seen what you're owed.
          </p>
        </div>
      </section>

      <section className="ap-wrap" style={{ paddingTop: 24, paddingBottom: 24 }}>
        <div
          className="ap-pricing-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 22,
            alignItems: "stretch",
          }}
        >
          {tiers.map((t, i) => {
            const highlighted = t.highlighted;
            return (
              <div
                key={t.name}
                data-reveal
                style={{
                  position: "relative",
                  background: "hsl(var(--card))",
                  border: highlighted
                    ? "2px solid hsl(var(--gold))"
                    : "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  padding: "28px 24px",
                  display: "flex",
                  flexDirection: "column",
                  transform: highlighted ? "translateY(-8px)" : "none",
                  boxShadow: highlighted
                    ? "0 24px 60px -24px hsl(43 90% 30% / .35)"
                    : "0 10px 30px -18px hsl(150 10% 10% / .15)",
                  transitionDelay: `${i * 80}ms`,
                }}
              >
                {highlighted && (
                  <div
                    style={{
                      position: "absolute",
                      top: -14,
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "hsl(var(--gold))",
                      color: "hsl(var(--gold-foreground))",
                      fontWeight: 700,
                      fontSize: 12,
                      letterSpacing: ".08em",
                      textTransform: "uppercase",
                      padding: "6px 12px",
                      borderRadius: 999,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Most popular
                  </div>
                )}

                <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: ".1em", textTransform: "uppercase", color: "hsl(var(--primary))" }}>
                  {t.name}
                </div>

                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 10 }}>
                  <span style={{ fontWeight: 800, fontSize: 44, letterSpacing: "-.02em", lineHeight: 1 }}>
                    {t.price}
                  </span>
                  {t.priceSuffix && (
                    <span style={{ fontSize: 14, color: "hsl(var(--muted-foreground))" }}>
                      {t.priceSuffix}
                    </span>
                  )}
                </div>

                <p style={{ marginTop: 8, marginBottom: 18, fontSize: 14.5, color: "hsl(var(--muted-foreground))", lineHeight: 1.5 }}>
                  {t.who}
                </p>

                <ul className="list-none pl-0 text-left" style={{ margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10, flex: 1, fontSize: 15, lineHeight: 1.5, color: "hsl(150 6% 22%)" }}>
                  {t.features.map((f, j) => (
                    <li key={j} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <Check className="h-4 w-4 mt-1 shrink-0" style={{ color: "hsl(var(--primary))" }} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`ap-btn ${highlighted ? "ap-btn-gold" : "ap-btn-outline"}`}
                  onClick={start}
                  style={{ marginTop: 22, width: "100%" }}
                >
                  {t.cta}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="ap-wrap" style={{ paddingTop: 18, paddingBottom: 64 }}>
        <p
          className="text-center"
          data-reveal
          style={{ fontSize: 13.5, color: "hsl(var(--muted-foreground))", maxWidth: 720, margin: "0 auto", lineHeight: 1.6 }}
        >
          Every check starts free — you only pay once you've seen what you're owed. Prices in AUD.
          Your payslip is read, then discarded. AwardPay is an interpretation tool, not legal advice.
        </p>
      </section>

      <footer className="ap-footer">
        <div className="ap-footer-in">
          <div className="ap-brand"><span className="ap-mark" />AwardPay</div>
          <div className="fine">© 2026 AwardPay · Pay checks are estimates based on Fair Work Modern Award data.</div>
        </div>
      </footer>

      <style>{`
        @media (max-width: 920px) {
          .ap-pricing-grid { grid-template-columns: 1fr !important; }
          .ap-pricing-grid > div { transform: none !important; }
        }
      `}</style>
    </div>
  );
};

export default Pricing;
