import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

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
          <a onClick={() => go("/how-it-works")} style={{ cursor: "pointer" }}>How it works</a>
          <a onClick={() => go("/pricing")} style={{ cursor: "pointer" }}>Pricing</a>
        </nav>
        <div className="ap-nav-cta">
          <a className="ap-sign-in" href="/auth" onClick={(event) => { event.preventDefault(); go("/auth"); }}>Sign in</a>
          <Button size="sm" className="ap-nav-check" onClick={() => go("/check")}>Check my payslip</Button>
        </div>
        <Button variant="ghost" size="icon"
          type="button"
          className="ap-burger [&_svg]:size-6"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen(v => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>
      {open && (
        <div className="ap-mobile-menu">
          <Button onClick={() => go("/check")}>
            Check my payslip
          </Button>
          <a onClick={() => go("/why-awardpay")}>Why AwardPay</a>
          <a onClick={() => go("/how-it-works")}>How it works</a>
          <a onClick={() => go("/pricing")}>Pricing</a>
          <a onClick={() => go("/contact")}>Contact</a>
          <a onClick={() => go("/auth")}>Sign in</a>
        </div>
      )}
    </header>
  );
};

export default ApNav;