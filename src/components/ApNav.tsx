import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";

export const ApNav = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const go = (path: string) => { setOpen(false); navigate(path); };

  return (
    <header className="ap-nav">
      <div className="ap-nav-row">
        <div className="ap-brand" onClick={() => go("/")}>
          <span className="ap-mark" />
          AwardPay
        </div>
        <nav className="ap-links">
          <a onClick={() => go("/why-awardpay")} style={{ cursor: "pointer" }}>Why AwardPay</a>
          <a onClick={() => go("/how-it-works")} style={{ cursor: "pointer" }}>How it works</a>
          <a onClick={() => go("/pricing")} style={{ cursor: "pointer" }}>Pricing</a>
          <a onClick={() => go("/contact")} style={{ cursor: "pointer" }}>Contact</a>
        </nav>
        <div className="ap-nav-cta">
          <a className="ap-ghost" onClick={() => go("/auth")} style={{ cursor: "pointer" }}>Sign in</a>
          <button className="ap-btn ap-btn-gold" onClick={() => go("/new-check-step-1")}>Check my payslip</button>
        </div>
        <button
          type="button"
          className="ap-burger"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen(v => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {open && (
        <div className="ap-mobile-menu">
          <a onClick={() => go("/why-awardpay")}>Why AwardPay</a>
          <a onClick={() => go("/how-it-works")}>How it works</a>
          <a onClick={() => go("/pricing")}>Pricing</a>
          <a onClick={() => go("/contact")}>Contact</a>
          <a onClick={() => go("/auth")}>Sign in</a>
          <button className="ap-btn ap-btn-gold" onClick={() => go("/new-check-step-1")}>
            Check my payslip
          </button>
        </div>
      )}
    </header>
  );
};

export default ApNav;