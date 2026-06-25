import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calculator, ClipboardCheck, LogOut, Home, Menu, X, User } from "lucide-react";
import { toast } from "sonner";

export const NavBar = () => {
  const navigate = useNavigate();
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
    <nav className="border-b border-border bg-card/50 backdrop-blur-lg relative z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <button
              onClick={() => handleNavigation("/")}
              className="flex items-center gap-2 font-bold text-xl"
            >
              <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Calculator className="h-5 w-5 text-primary-foreground" />
              </div>
              AwardPay
            </button>
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => handleNavigation("/app-dashboard")}
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Dashboard
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleNavigation("/check")}
                className="flex items-center gap-2"
              >
                <ClipboardCheck className="h-4 w-4" />
                New Check
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleNavigation("/profile")}
                className="flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                Profile
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
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute left-0 right-0 top-16 bg-card border-b border-border shadow-lg z-50">
            <div className="flex flex-col p-4 gap-2">
              <Button
                variant="ghost"
                onClick={() => handleNavigation("/app-dashboard")}
                className="flex items-center gap-2 justify-start w-full"
              >
                <Home className="h-4 w-4" />
                Dashboard
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleNavigation("/check")}
                className="flex items-center gap-2 justify-start w-full"
              >
                <ClipboardCheck className="h-4 w-4" />
                New Check
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleNavigation("/profile")}
                className="flex items-center gap-2 justify-start w-full"
              >
                <User className="h-4 w-4" />
                Profile
              </Button>
              <hr className="border-border my-2" />
              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="flex items-center gap-2 justify-start w-full text-destructive"
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
