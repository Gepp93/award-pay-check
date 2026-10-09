import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calculator, ClipboardCheck, LogOut, FileText, Menu, X, User } from "lucide-react";
import { toast } from "sonner";

export const NavBar = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="ap-nav">
      <div className="ap-wrap">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Button variant="ghost"
              onClick={() => handleNavigation("/")}
              className="flex items-center gap-2 font-semibold text-xl"
            >
              <span className="ap-mark" />
              AwardPay
            </Button>
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => handleNavigation("/reports")}
                className={`h-16 rounded-none flex items-center gap-2 ${pathname === "/reports" ? "text-primary border-b-2 border-primary" : "text-ink-2"}`}
              >
                <FileText className="h-4 w-4" />
                My reports
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleNavigation("/check")}
                className={`h-16 rounded-none flex items-center gap-2 ${pathname === "/check" ? "text-primary border-b-2 border-primary" : "text-ink-2"}`}
              >
                <ClipboardCheck className="h-4 w-4" />
                Check
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleNavigation("/profile")}
                className={`h-16 rounded-none flex items-center gap-2 ${pathname === "/profile" ? "text-primary border-b-2 border-primary" : "text-ink-2"}`}
              >
                <User className="h-4 w-4" />
                Account
              </Button>
            </div>
          </div>

          {/* Desktop Sign Out */}
          <div className="hidden md:block">
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden" aria-label={mobileMenuOpen ? "Close menu" : "Open menu"} aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute left-0 right-0 top-16 bg-background border-b border-border  z-50">
            <div className="flex flex-col p-4 gap-2">
              <Button
                variant="ghost"
                onClick={() => handleNavigation("/reports")}
                className="flex items-center gap-2 justify-start w-full min-h-14"
              >
                <FileText className="h-4 w-4" />
                My reports
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleNavigation("/check")}
                className="flex items-center gap-2 justify-start w-full min-h-14"
              >
                <ClipboardCheck className="h-4 w-4" />
                Check
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleNavigation("/profile")}
                className="flex items-center gap-2 justify-start w-full min-h-14"
              >
                <User className="h-4 w-4" />
                Account
              </Button>
              <hr className="border-border my-2" />
              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="flex items-center gap-2 justify-start w-full min-h-14 text-destructive"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
