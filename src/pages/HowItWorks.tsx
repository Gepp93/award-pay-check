import { useNavigate } from "react-router-dom";
import SEO from "@/components/SEO";

const HowItWorks = () => {
  const navigate = useNavigate();
  const start = () => navigate("/new-check-step-1");

  return (
    <div>
      <SEO
        title="How AwardPay checks your pay"
        description="We turn your payslip into an award-accurate breakdown using real Fair Work rates — penalties, overtime and allowances included."
        path="/how-it-works"
      />

      {/* Nav */}
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

      {/* Hero */}
      <section className="ap-wrap ap-section" style={{ paddingBottom: 28 }}>
        <h1 className="ap-h1" style={{ maxWidth: "18ch" }}>How AwardPay checks your pay</h1>
        <p className="ap-lede" style={{ marginBottom: 0 }}>
          We turn your payslip into an award-accurate breakdown using real Fair Work rates.
        </p>
      </section>

      {/* Three steps */}
      <section className="ap-wrap" style={{ paddingTop: 24, paddingBottom: 24, maxWidth: 760 }}>
        <h2 className="ap-h2" style={{ fontSize: "clamp(22px, 2.6vw, 28px)" }}>Three steps</h2>
        <ol className="list-decimal pl-5 space-y-2" style={{ fontSize: 17, lineHeight: 1.6, color: "hsl(150 6% 22%)" }}>
          <li>Snap your payslip — a photo or PDF</li>
          <li>We match the right award and pull live Fair Work rates</li>
          <li>See what you're owed, line by line</li>
        </ol>
      </section>

      {/* What we check */}
      <section className="ap-wrap" style={{ paddingTop: 24, paddingBottom: 24, maxWidth: 760 }}>
        <h2 className="ap-h2" style={{ fontSize: "clamp(22px, 2.6vw, 28px)" }}>What we check</h2>
        <ul className="list-disc pl-5 space-y-2" style={{ fontSize: 17, lineHeight: 1.6, color: "hsl(150 6% 22%)" }}>
          <li>Ordinary hours and overtime</li>
          <li>Saturday, Sunday, public holiday and night penalties</li>
          <li>Meal, travel, tool and site allowances</li>
          <li>RDO accrual and broken / split shifts</li>
        </ul>
      </section>

      {/* Disclaimer */}
      <section className="ap-wrap" style={{ paddingTop: 16, paddingBottom: 40, maxWidth: 760 }}>
        <p style={{ fontSize: 14, color: "hsl(var(--muted-foreground))", margin: 0 }}>
          AwardPay is an interpretation tool based on official Fair Work data, not legal advice.
        </p>
      </section>

      {/* Final CTA */}
      <section className="ap-wrap" style={{ paddingTop: 24, paddingBottom: 80, maxWidth: 760 }}>
        <h2 className="ap-h2" style={{ marginBottom: 18 }}>See what you're owed</h2>
        <button className="ap-btn ap-btn-gold ap-btn-lg" onClick={start}>
          Check my payslip — free
        </button>
      </section>

      {/* Footer */}
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