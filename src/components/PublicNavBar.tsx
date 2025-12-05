import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calculator, Menu, X } from "lucide-react";

export const PublicNavBar = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border/50">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center h-20">
          <div 
            onClick={() => navigate("/")}
            className="flex items-center gap-2 font-bold text-xl cursor-pointer"
          >
            <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Calculator className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-foreground">AwardPay</span>
          </div>
          
          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="/why-awardpay" className="text-foreground/70 hover:text-foreground transition-colors font-medium">Why AwardPay</a>
            <a href="/how-it-works" className="text-foreground/70 hover:text-foreground transition-colors font-medium">How It Works</a>
            <a href="/pricing" className="text-foreground/70 hover:text-foreground transition-colors font-medium">Pricing</a>
            <a href="/contact" className="text-foreground/70 hover:text-foreground transition-colors font-medium">Contact</a>
            <Button
              variant="ghost"
              onClick={() => navigate("/auth")}
              className="text-foreground/70 hover:text-foreground"
            >
              Sign In
            </Button>
            <Button
              onClick={() => navigate("/auth")}
              className="bg-gradient-primary text-primary-foreground hover:opacity-90 px-6"
            >
              Get Started
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
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
                className="px-4 py-2 text-foreground/70 hover:text-foreground hover:bg-secondary/50 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Why AwardPay
              </a>
              <a 
                href="/how-it-works" 
                className="px-4 py-2 text-foreground/70 hover:text-foreground hover:bg-secondary/50 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                How It Works
              </a>
              <a 
                href="/pricing" 
                className="px-4 py-2 text-foreground/70 hover:text-foreground hover:bg-secondary/50 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </a>
              <a 
                href="/contact" 
                className="px-4 py-2 text-foreground/70 hover:text-foreground hover:bg-secondary/50 rounded-lg transition-colors"
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
                  className="bg-gradient-primary text-primary-foreground hover:opacity-90"
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
