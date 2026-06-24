import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Camera, Scale, DollarSign } from "lucide-react";
import SEO from "@/components/SEO";

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

const ulCls = "list-none pl-0 text-left space-y-2 mt-4";
const ulStyle = { fontSize: 17, lineHeight: 1.6, color: "hsl(150 6% 22%)" } as const;
const h2Style = { fontSize: "clamp(22px, 2.6vw, 28px)" } as const;

const circle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 44,
  height: 44,
  borderRadius: 999,
  border: "1.5px solid hsl(var(--primary))",
  color: "hsl(var(--primary))",
  background: "hsl(var(--background))",
  flexShrink: 0,
};

const HowItWorks = () => {
  const navigate = useNavigate();
  const start = () => navigate("/new-check-step-1");
  useReveal();

  const steps = [
    "Snap your payslip — a photo or PDF",
    "We match the right award and pull live Fair Work rates",
    "See what you're owed, line by line",
  ];
  const checks = [
    "Ordinary hours and overtime",
    "Saturday, Sunday, public holiday and night penalties",
    "Meal, travel, tool and site allowances",
    "RDO accrual and broken / split shifts",
  ];

  return (
    <div>
      <SEO
        title="How AwardPay checks your pay"
        description="We turn your payslip into an award-accurate breakdown using real Fair Work rates — penalties, overtime and allowances included."
        path="/how-it-works"
      />

      <header className="ap-nav">
        <div className="ap-nav-row">
          <div className="ap-brand" onClick={() => navigate("/")}>
            <span className="ap-mark" />
            AwardPay
          </div>
          <nav className="ap-links">
            <a onClick={() => navigate("/why-awardpay")} style={{ cursor: "pointer" }}>Why AwardPay</a>
            <a onClick={() => navigate("/how-it-works")} style={{ cursor: "pointer" }}>How it works</a>
            <a onClick={() => navigate("/pricing")} style={{ cursor: "pointer" }}>Pricing</a>
            <a onClick={() => navigate("/contact")} style={{ cursor: "pointer" }}>Contact</a>
          </nav>
          <div className="ap-nav-cta">
            <a className="ap-ghost" onClick={() => navigate("/auth")} style={{ cursor: "pointer" }}>Sign in</a>
            <button className="ap-btn ap-btn-gold" onClick={start}>Check my payslip</button>
          </div>
        </div>
      </header>

      <section className="ap-wrap ap-section" style={{ paddingBottom: 28 }}>
        <div className="mx-auto text-center" style={{ maxWidth: 760 }}>
          <div className="ap-eyebrow" data-reveal>How it works</div>
          <h1 className="ap-h1 text-center" data-reveal>
            How AwardPay checks your <span className="ap-hl">pay</span>
          </h1>
          <p className="ap-lede text-center" data-reveal style={{ marginBottom: 0, maxWidth: "none" }}>
            We turn your payslip into an award-accurate breakdown using real Fair Work rates.
          </p>
        </div>
      </section>

      {/* 3-step focal indicator */}
      <section className="ap-wrap" style={{ paddingTop: 8, paddingBottom: 24 }}>
        <div className="mx-auto" style={{ maxWidth: 420 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div data-reveal style={{ transitionDelay: "0ms" }}>
              <span style={circle}><Camera size={20} /></span>
            </div>
            <div data-reveal style={{ flex: 1, height: 1, background: "hsl(var(--primary) / 0.3)", transitionDelay: "100ms" }} />
            <div data-reveal style={{ transitionDelay: "150ms" }}>
              <span style={circle}><Scale size={20} /></span>
            </div>
            <div data-reveal style={{ flex: 1, height: 1, background: "hsl(var(--primary) / 0.3)", transitionDelay: "250ms" }} />
            <div data-reveal style={{ transitionDelay: "300ms" }}>
              <span style={circle}><DollarSign size={20} /></span>
            </div>
          </div>
        </div>
      </section>

      <section className="ap-wrap" style={{ paddingTop: 8, paddingBottom: 24 }}>
        <div className="mx-auto" style={{ maxWidth: 760 }}>
          <h2 className="ap-h2 text-center" data-reveal style={h2Style}>Three steps</h2>
          <ol className="list-none pl-0 text-left space-y-3 mt-4" style={ulStyle}>
            {steps.map((t, i) => (
              <li key={i} className="flex items-start gap-3" data-reveal style={{ transitionDelay: `${i * 80}ms` }}>
                <span
                  className="inline-flex items-center justify-center shrink-0"
                  style={{
                    width: 24, height: 24, borderRadius: 999,
                    background: "hsl(var(--primary))",
                    color: "hsl(var(--primary-foreground))",
                    fontSize: 12, fontWeight: 700, marginTop: 4,
                  }}
                >{i + 1}</span>
                <span>{t}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="ap-wrap" style={{ paddingTop: 24, paddingBottom: 24 }}>
        <div className="mx-auto" style={{ maxWidth: 760 }}>
          <h2 className="ap-h2 text-center" data-reveal style={h2Style}>What we check</h2>
          <ul className={ulCls} style={ulStyle}>
            {checks.map((t, i) => (
              <li key={i} className="flex items-start gap-2" data-reveal style={{ transitionDelay: `${i * 80}ms` }}>
                <Check className="h-4 w-4 mt-1 shrink-0" style={{ color: "hsl(var(--primary))" }} />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="ap-wrap" style={{ paddingTop: 16, paddingBottom: 40 }}>
        <div className="mx-auto" style={{ maxWidth: 760 }}>
          <p className="text-center" data-reveal style={{ fontSize: 14, color: "hsl(var(--muted-foreground))", margin: 0 }}>
            AwardPay is an interpretation tool based on official Fair Work data, not legal advice.
          </p>
        </div>
      </section>

      <section className="ap-wrap" style={{ paddingTop: 24, paddingBottom: 80 }}>
        <div className="mx-auto text-center" style={{ maxWidth: 760 }}>
          <h2 className="ap-h2 text-center" data-reveal style={{ marginBottom: 18 }}>See what you're owed</h2>
          <div data-reveal>
            <button className="ap-btn ap-btn-gold ap-btn-lg" onClick={start}>
              Check my payslip — free
            </button>
          </div>
        </div>
      </section>

      <footer className="ap-footer">
        <div className="ap-footer-in">
          <div className="ap-brand"><span className="ap-mark" />AwardPay</div>
          <div className="fine">© 2026 AwardPay · Pay checks are estimates based on Fair Work Modern Award data.</div>
        </div>
      </footer>
    </div>
  );
};

export default HowItWorks;