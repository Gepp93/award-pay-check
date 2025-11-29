import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calculator, ClipboardCheck, CreditCard, LogOut } from "lucide-react";
import { toast } from "sonner";

export const NavBar = () => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 font-bold text-xl"
            >
              <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Calculator className="h-5 w-5 text-primary-foreground" />
              </div>
              AwardPay
            </button>
            <div className="hidden md:flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/new-check-step-1")}
                className="flex items-center gap-2"
              >
                <ClipboardCheck className="h-4 w-4" />
                New Check
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate("/subscription")}
                className="flex items-center gap-2"
              >
                <CreditCard className="h-4 w-4" />
                Subscription
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </nav>
  );
};
