import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import SEO from "@/components/SEO";
import { ApNav } from "@/components/ApNav";

const Contact = () => {
  const navigate = useNavigate();

  return (
    <div className="ap-marketing">
      <SEO
        title="Contact AwardPay"
        description="A question about your pay or our checks? Email support@awardpay.com.au — a real person reads every message."
        path="/contact"
      />

      <ApNav />

      {/* Hero */}
      <section className="ap-wrap ap-home-section" >
        <div className="mx-auto" >
          <div className="ledger-label mb-4">Contact</div>
          <h1
            className="ap-h1"
            
          >
            Get in touch
          </h1>
          <p className="ap-lede" >
            A question about your pay, our checks, or something not working? Email us — a real person reads every message.
          </p>
        </div>
      </section>

      {/* Email */}
      <section className="ap-wrap ap-home-section" >
        <a
          href="mailto:support@awardpay.com.au" className="text-primary text-xl md:text-3xl font-semibold underline break-all"
          
        >
          support@awardpay.com.au
        </a>
        <p >
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