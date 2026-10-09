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
        <Button variant="ghost" className="ap-brand" onClick={() => go("/")}>
          <span className="ap-mark" />
          AwardPay
        </Button>
        <nav className="ap-links">
          <a href="/how-it-works" onClick={(event) => { event.preventDefault(); go("/how-it-works"); }}>How it works</a>
          <a href="/pricing" onClick={(event) => { event.preventDefault(); go("/pricing"); }}>Pricing</a>
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
          <a href="/why-awardpay" onClick={(event) => { event.preventDefault(); go("/why-awardpay"); }}>Why AwardPay</a>
          <a href="/how-it-works" onClick={(event) => { event.preventDefault(); go("/how-it-works"); }}>How it works</a>
          <a href="/pricing" onClick={(event) => { event.preventDefault(); go("/pricing"); }}>Pricing</a>
          <a href="/contact" onClick={(event) => { event.preventDefault(); go("/contact"); }}>Contact</a>
          <a href="/auth" onClick={(event) => { event.preventDefault(); go("/auth"); }}>Sign in</a>
        </div>
      )}
    </header>
  );
};

export default ApNav;