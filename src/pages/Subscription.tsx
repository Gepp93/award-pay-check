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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      loadSubscriptionStatus(session.user.id);
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
    toast.info("Stripe integration coming soon! This will redirect to checkout.");
    // TODO: Implement Stripe checkout
  };

  const features = [
    "Unlimited calculations",
    "Save calculation history",
    "Export to PDF",
    "Email reports",
    "Priority support",
    "Advanced award rules",
  ];

  return (
    <div className="min-h-screen bg-gradient-hero">
      <NavBar />
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground">
            Get the most out of AwardPay
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <Card className="bg-card/50 backdrop-blur-lg border-border">
            <CardHeader>
              <CardTitle className="text-2xl">Free</CardTitle>
              <CardDescription className="text-lg">
                Perfect for trying out AwardPay
              </CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-accent" />
                  <span>5 free calculations</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-accent" />
                  <span>Basic award calculations</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-accent" />
                  <span>Penalty rate breakdowns</span>
                </li>
              </ul>
              <Button
                variant="outline"
                className="w-full"
                disabled={subscriptionStatus === "free"}
              >
                {subscriptionStatus === "free" ? "Current Plan" : "Downgrade"}
              </Button>
            </CardContent>
          </Card>

          {/* Pro Tier */}
          <Card className="bg-gradient-card backdrop-blur-lg border-accent shadow-glow relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-accent text-accent-foreground px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                <Zap className="h-4 w-4" />
                Most Popular
              </div>
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">Pro</CardTitle>
              <CardDescription className="text-lg">
                For professionals who need unlimited access
              </CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$29</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
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
                disabled={subscriptionStatus === "active"}
              >
                {subscriptionStatus === "active" ? "Current Plan" : "Upgrade to Pro"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
