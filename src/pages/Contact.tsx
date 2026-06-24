import { useNavigate } from "react-router-dom";
import SEO from "@/components/SEO";
import { ApNav } from "@/components/ApNav";

const Contact = () => {
  const navigate = useNavigate();

  return (
    <div>
      <SEO
        title="Contact AwardPay"
        description="A question about your pay or our checks? Email support@awardpay.com.au — a real person reads every message."
        path="/contact"
      />

      <ApNav />

      {/* Hero */}
      <section className="ap-wrap ap-section" style={{ paddingBottom: 28 }}>
        <div className="mx-auto" style={{ maxWidth: 760 }}>
          <h1
            className="ap-h1 text-center"
            style={{
              color: "hsl(var(--foreground))",
              background: "none",
              WebkitTextFillColor: "currentColor",
              backgroundClip: "border-box",
              WebkitBackgroundClip: "border-box",
            }}
          >
            Get in touch
          </h1>
          <p className="ap-lede text-center" style={{ marginBottom: 0, maxWidth: "none" }}>
            A question about your pay, our checks, or something not working? Email us — a real person reads every message.
          </p>
        </div>
      </section>

      {/* Email */}
      <section className="ap-wrap" style={{ paddingTop: 32, paddingBottom: 100, textAlign: "center" }}>
        <a
          href="mailto:support@awardpay.com.au"
          style={{
            display: "inline-block",
            fontWeight: 800,
            fontSize: "clamp(24px, 3.6vw, 34px)",
            color: "hsl(var(--primary))",
            textDecoration: "none",
            wordBreak: "break-all",
            letterSpacing: "-0.01em",
          }}
        >
          support@awardpay.com.au
        </a>
        <p style={{ marginTop: 14, fontSize: 14, color: "hsl(var(--muted-foreground))" }}>
          We usually reply within 24–48 hours.
        </p>
      </section>

      {/* Footer */}
      <footer className="ap-footer">
        <div className="ap-footer-in">
          <div className="ap-brand"><span className="ap-mark" />AwardPay</div>
          <div className="fine">© 2026 AwardPay</div>
        </div>
      </footer>
    </div>
  );
};

export default Contact;