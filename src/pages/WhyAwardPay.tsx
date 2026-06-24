import { useNavigate } from "react-router-dom";
import SEO from "@/components/SEO";

const WhyAwardPay = () => {
  const navigate = useNavigate();
  const start = () => navigate("/new-check-step-1");

  return (
    <div>
      <SEO
        title="Why AwardPay — know exactly what you're owed"
        description="Modern Awards are complex. AwardPay reads your payslip and checks it against official Fair Work rates, so you know exactly what you're owed."
        path="/why-awardpay"
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
        <h1 className="ap-h1" style={{ maxWidth: "14ch" }}>Why AwardPay exists</h1>
        <p className="ap-lede" style={{ marginBottom: 0 }}>
          Working out your correct pay under a Modern Award shouldn't take a law degree.
          We make it simple — so you know exactly what you're owed.
        </p>
      </section>

      {/* The problem */}
      <section className="ap-wrap" style={{ paddingTop: 24, paddingBottom: 24, maxWidth: 760 }}>
        <h2 className="ap-h2" style={{ fontSize: "clamp(22px, 2.6vw, 28px)" }}>The problem</h2>
        <ul className="list-disc pl-5 space-y-2" style={{ fontSize: 17, lineHeight: 1.6, color: "hsl(150 6% 22%)" }}>
          <li>Modern Awards are complex: hundreds of rates, penalties and allowances</li>
          <li>Penalties change by the day and the time of day</li>
          <li>Small errors in overtime or allowances quietly add up over months</li>
          <li>Most workers never realise they've been short-changed</li>
        </ul>
      </section>

      {/* What AwardPay does */}
      <section className="ap-wrap" style={{ paddingTop: 24, paddingBottom: 24, maxWidth: 760 }}>
        <h2 className="ap-h2" style={{ fontSize: "clamp(22px, 2.6vw, 28px)" }}>What AwardPay does</h2>
        <ul className="list-disc pl-5 space-y-2" style={{ fontSize: 17, lineHeight: 1.6, color: "hsl(150 6% 22%)" }}>
          <li>Reads your payslip in about a minute</li>
          <li>Checks it against official Fair Work Commission rates</li>
          <li>Flags any missing penalties, overtime or allowances</li>
          <li>Shows you exactly what you may be owed</li>
        </ul>
      </section>

      {/* Where our data comes from */}
      <section className="ap-wrap" style={{ paddingTop: 24, paddingBottom: 24, maxWidth: 760 }}>
        <h2 className="ap-h2" style={{ fontSize: "clamp(22px, 2.6vw, 28px)" }}>Where our data comes from</h2>
        <p style={{ fontSize: 17, lineHeight: 1.6, color: "hsl(150 6% 22%)", margin: 0 }}>
          Built on the Fair Work Commission's official Modern Award data, updated as rates change.
          AwardPay is an interpretation tool, not legal advice.
        </p>
      </section>

      {/* Who it's for */}
      <section className="ap-wrap" style={{ paddingTop: 24, paddingBottom: 56, maxWidth: 760 }}>
        <h2 className="ap-h2" style={{ fontSize: "clamp(22px, 2.6vw, 28px)" }}>Who it's for</h2>
        <p style={{ fontSize: 17, lineHeight: 1.6, color: "hsl(150 6% 22%)", margin: 0 }}>
          Any role under a Modern Award — retail, hospitality, construction, health, trades,
          cleaning, support work and more.
        </p>
      </section>

      {/* Final CTA */}
      <section className="ap-wrap" style={{ paddingTop: 40, paddingBottom: 80, maxWidth: 760 }}>
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

export default WhyAwardPay;