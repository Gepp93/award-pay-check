import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calculator, Menu, X } from "lucide-react";

export const PublicNavBar = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="ap-nav">
      <div className="ap-wrap">
        <div className="flex justify-between items-center h-16">
          <Button variant="ghost" size="sm"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 font-semibold text-xl cursor-pointer px-0"
          >
            <span className="ap-mark" />
            <span className="text-foreground">AwardPay</span>
          </Button>
          
          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-4">
            <a href="/why-awardpay" className="text-ink-2 hover:text-foreground transition-colors font-medium">Why AwardPay</a>
            <a href="/how-it-works" className="text-ink-2 hover:text-foreground transition-colors font-medium">How It Works</a>
            <a href="/pricing" className="text-ink-2 hover:text-foreground transition-colors font-medium">Pricing</a>
            <a href="/contact" className="text-ink-2 hover:text-foreground transition-colors font-medium">Contact</a>
            <Button
              variant="link"
              onClick={() => navigate("/auth")}
              className="text-ink-2 hover:text-foreground"
            >
              Sign In
            </Button>
            <Button
              onClick={() => navigate("/auth")}
              size="sm"
            >
              Get Started
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon" aria-label={mobileMenuOpen ? "Close menu" : "Open menu"} aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/50 py-4">
            <nav className="flex flex-col gap-2">
              <a 
                href="/why-awardpay" 
                className="min-h-14 flex items-center px-4 py-2 text-ink-2 hover:text-foreground hover:bg-secondary/50 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Why AwardPay
              </a>
              <a 
                href="/how-it-works" 
                className="min-h-14 flex items-center px-4 py-2 text-ink-2 hover:text-foreground hover:bg-secondary/50 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                How It Works
              </a>
              <a 
                href="/pricing" 
                className="min-h-14 flex items-center px-4 py-2 text-ink-2 hover:text-foreground hover:bg-secondary/50 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </a>
              <a 
                href="/contact" 
                className="min-h-14 flex items-center px-4 py-2 text-ink-2 hover:text-foreground hover:bg-secondary/50 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </a>
              <div className="flex gap-2 px-4 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { navigate("/auth"); setMobileMenuOpen(false); }}
                >
                  Sign In
                </Button>
                <Button
                  size="sm"
                  onClick={() => { navigate("/auth"); setMobileMenuOpen(false); }}
                  className="bg-primary text-primary-foreground hover:opacity-90"
                >
                  Get Started
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
