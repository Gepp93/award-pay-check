import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import SEO from "@/components/SEO";

/* Animated "owed" figure — counts up on load, respects reduced motion */
const OwedFigure = ({ target = 1542, suffix = "/yr" }: { target?: number; suffix?: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.firstChild!.nodeValue = `$${target.toLocaleString()}`;
      return;
    }
    let start: number | null = null;
    const dur = 1200;
    let raf = 0;
    const step = (t: number) => {
      if (start === null) start = t;
      const p = Math.min((t - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.firstChild!.nodeValue = `$${Math.round(eased * target).toLocaleString()}`;
      if (p < 1) raf = requestAnimationFrame(step);
    };
    const timer = window.setTimeout(() => {
      raf = requestAnimationFrame(step);
    }, 600);
    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [target]);
  return (
    <>
      <span ref={ref}>$0</span>
      <span style={{ fontSize: "0.55em", marginLeft: 2, color: "hsl(var(--muted-foreground))", fontWeight: 600 }}>
        {" "}
        {suffix}
      </span>
    </>
  );
};

const PayslipStage = () => (
  <div className="ap-stage" aria-hidden="true">
    {/* Scan card (top left, rotated) */}
    <div className="ap-float ap-scan">
      <div className="ap-scan-head">
        <div className="ap-scan-ic">📄</div>
        <div className="ap-scan-t">
          payslip_june.jpg
          <span>AI reading… done ✓</span>
        </div>
      </div>
      <div className="ph m"></div>
      <div className="ph s"></div>
      <div className="ph m"></div>
      <div className="ph s"></div>
    </div>

    {/* Ledger card */}
    <div className="ap-float ap-ledger">
      <div className="ap-ledger-perf"></div>
      <div className="ap-ledger-in">
        <div className="ap-l-head">
          <div className="ap-l-title">Pay check</div>
          <div className="ap-l-week">WK ENDING 14 JUN</div>
        </div>
        <div className="ap-l-sub">Casual · General Retail</div>

        <div className="ap-lrow">
          <div className="lab">
            Ordinary hours
            <span className="sub">30h @ $27.42</span>
          </div>
          <div className="ap-lamt ok">PAID ✓</div>
        </div>

        <div className="ap-lrow">
          <div className="lab">
            <span className="miss">MISSING</span>
            <br />
            Saturday penalty (+25%)
          </div>
          <div className="ap-lamt add">+ $41.13</div>
        </div>

        <div className="ap-lrow">
          <div className="lab">
            <span className="miss">MISSING</span>
            <br />
            Evening loading
          </div>
          <div className="ap-lamt add">+ $13.71</div>
        </div>

        <div className="ap-lrow">
          <div className="lab">
            <span className="miss">MISSING</span>
            <br />
            Meal allowance
          </div>
          <div className="ap-lamt add">+ $21.30</div>
        </div>

        <div className="ap-l-total">
          <div className="tl">Owed / year</div>
          <div className="tn">
            <OwedFigure target={1542} suffix="" />
          </div>
        </div>
      </div>
    </div>

    {/* Floating chips */}
    <div className="ap-chip ap-chip-found">
      <span className="c">✓</span>
      Underpayment found
    </div>

    <div className="ap-chip ap-chip-owed">
      <div className="ic">💰</div>
      <div>
        <div className="t">You may be owed</div>
        <div className="n">
          <OwedFigure target={1542} suffix="" />
        </div>
      </div>
    </div>

    <div className="ap-chip ap-chip-pen">
      <span className="pd"></span>
      Saturday penalty <span className="pa">+$41.13</span>
    </div>
  </div>
);

const Index = () => {
  const navigate = useNavigate();
  const startCheck = () => navigate("/new-check-step-1");

  return (
    <div>
      <SEO
        title="Am I Being Underpaid? Free Award Pay Check | AwardPay"
        description="Check Australian award pay in 60 seconds. 1 in 5 workers lose $1,542/year on penalty rates, overtime and allowances."
        path="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "AwardPay Calculator",
          applicationCategory: "FinanceApplication",
          operatingSystem: "Web",
          url: "https://www.awardpay.com.au/",
          description:
            "Free Australian award pay checker that reads your payslip and compares it to Fair Work Modern Awards.",
          offers: { "@type": "Offer", price: "0", priceCurrency: "AUD" },
        }}
      />

      {/* Nav */}
      <ApNav />

      {/* Hero */}
      <header className="ap-wrap ap-hero">
        <div>
          <div className="ap-pill">
            <span className="d" />
            Free award pay check
          </div>
          <h1 className="ap-h1">
            Are you being <span className="ap-hl">underpaid?</span>
          </h1>
          <p className="ap-lede">
            One in five Australian workers are short-changed on penalty rates, overtime and
            allowances — on average <strong>$1,542 a year</strong>. Snap a photo of your payslip
            and we'll check it against the official Fair Work rates in about a minute.
          </p>
          <div className="ap-cta-row">
            <button className="ap-btn ap-btn-gold ap-btn-lg" onClick={startCheck}>
              Check my payslip — free
            </button>
            <a href="/how-it-works" className="ap-btn ap-btn-outline ap-btn-lg">
              See how it works
            </a>
          </div>
          <div className="ap-trust">
            <span>
              <span className="ap-tick">✓</span>Official Fair Work rates
            </span>
            <span>
              <span className="ap-tick">✓</span>No account needed
            </span>
            <span>
              <span className="ap-tick">✓</span>Your payslip is never stored
            </span>
          </div>
        </div>
        <PayslipStage />
      </header>

      {/* How it works */}
      <section className="ap-wrap ap-section">
        <div className="ap-eyebrow">How it works</div>
        <h2 className="ap-h2">Three steps. About a minute.</h2>
        <p className="ap-sub">
          No spreadsheets, no award-code hunting. Show us your payslip and we do the rest.
        </p>
        <div className="ap-steps">
          <div className="ap-step">
            <div className="num">1</div>
            <h3>Snap your payslip</h3>
            <p>Take a photo or upload a PDF. Our reader pulls out your hours, rate, allowances and pay period.</p>
          </div>
          <div className="ap-step">
            <div className="num">2</div>
            <h3>We check the official rates</h3>
            <p>We match your role to the right modern award and compare your pay against live Fair Work Commission rates.</p>
          </div>
          <div className="ap-step">
            <div className="num">3</div>
            <h3>See what you're owed</h3>
            <p>A clear, line-by-line breakdown of any missing penalties, overtime or allowances — ready to act on.</p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="ap-wrap ap-section">
        <div className="ap-stats">
          <div className="ap-stat">
            <div className="n">$1.35B</div>
            <div className="l">Recovered for underpaid workers by the Fair Work Ombudsman in a single year</div>
          </div>
          <div className="ap-stat">
            <div className="n">1 in 5</div>
            <div className="l">Young Australian workers report being paid below the lawful minimum</div>
          </div>
          <div className="ap-stat">
            <div className="n">$1,542</div>
            <div className="l">Average amount an underpaid worker loses across a year</div>
          </div>
        </div>
        <div className="ap-note">
          Figures are illustrative placeholders — replace each with a cited Fair Work Ombudsman / research source before publishing.
        </div>
      </section>

      {/* Credibility band */}
      <section className="ap-wrap ap-section">
        <div className="ap-band">
          <div>
            <h2>Built on the official source of truth</h2>
            <p>
              Your pay is checked against live data from the Fair Work Commission — the same modern award rates,
              penalties and allowances that legally apply to your job. Not estimates, not guesses.
            </p>
          </div>
          <div className="creds">
            <div className="cred">
              <span className="cb">✓</span>Live Fair Work Commission rates
            </div>
            <div className="cred">
              <span className="cb">✓</span>Your payslip is read, then discarded
            </div>
            <div className="cred">
              <span className="cb">✓</span>Free to check — no account required
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="ap-wrap ap-final">
        <h2>Find out what you're owed</h2>
        <p>It takes about a minute and costs nothing. You might be surprised.</p>
        <button className="ap-btn ap-btn-gold ap-btn-lg" onClick={startCheck}>
          Check my payslip — free
        </button>
      </section>

      {/* Footer */}
      <footer className="ap-footer">
        <div className="ap-footer-in">
          <div className="ap-brand">
            <span className="ap-mark" />
            AwardPay
          </div>
          <div className="fine">
            © 2026 AwardPay · Pay checks are estimates based on Fair Work Modern Award data. Confirm before lodging a claim.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
