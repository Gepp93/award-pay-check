import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NavBar } from "@/components/NavBar";
import { Check, Zap } from "lucide-react";
import { toast } from "sonner";

const Subscription = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      loadSubscriptionStatus(session.user.id);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadSubscriptionStatus = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("subscription_status")
      .eq("id", userId)
      .single();

    if (data) {
      setSubscriptionStatus(data.subscription_status || "free");
    }
  };

  const handleUpgrade = () => {
    window.location.href = "https://buy.stripe.com/6oUeVe0kk9Zn4XZ5Nz6AM04";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <NavBar />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-xl">Loading plans...</p>
        </div>
      </div>
    );
  }

  const features = [
    "Unlimited award-accurate calculations",
    "All penalty rates & allowances",
    "Save shifts & payslips",
    "Underpayment detection",
    "Export PDF reports",
    "Email summaries",
    "AwardPay AI assistant",
    "Priority support",
  ];

  return (
    <div className="min-h-screen bg-gradient-hero">
      <NavBar />
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Get AwardPay Pro</h1>
          <p className="text-xl text-muted-foreground">
            3 months of full access to protect your pay
          </p>
        </div>

        <div className="max-w-md mx-auto">
          {/* 3 Month Pass */}
          <Card className="bg-gradient-card backdrop-blur-lg border-accent shadow-glow relative flex flex-col">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-accent text-accent-foreground px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                <Zap className="h-4 w-4" />
                Full Access
              </div>
            </div>
            <CardHeader className="pt-8">
              <CardTitle className="text-2xl">3 Month Access Pass</CardTitle>
              <CardDescription className="text-lg">
                Full Pro access for 3 months
              </CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$30</span>
                <span className="text-muted-foreground"> for 3 months</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Just $10/month — one-time payment
              </p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <ul className="space-y-3 mb-6 flex-1">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-accent" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                onClick={handleUpgrade}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                disabled={subscriptionStatus === "active" || subscriptionStatus === "3month"}
              >
                {subscriptionStatus === "active" || subscriptionStatus === "3month" ? "Current Plan" : "Get 3 Month Access"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
