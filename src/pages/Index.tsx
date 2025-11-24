import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calculator, Shield, TrendingUp, FileText, DollarSign, Clock } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Calculator,
      title: "Instant Calculations",
      description: "Get accurate award pay calculations in seconds with our smart calculator",
    },
    {
      icon: Shield,
      title: "Award Compliant",
      description: "Based on Fair Work Commission Modern Award standards",
    },
    {
      icon: TrendingUp,
      title: "Penalty Rates",
      description: "Automatic calculation of overtime, weekend, and night shift penalties",
    },
    {
      icon: FileText,
      title: "Save & Export",
      description: "Keep records of your calculations and export to PDF",
    },
    {
      icon: DollarSign,
      title: "Allowances",
      description: "Includes meal, travel, and other award-specific allowances",
    },
    {
      icon: Clock,
      title: "Real-time",
      description: "See your pay breakdown update live as you enter shift details",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <nav className="flex justify-between items-center mb-16">
          <div className="flex items-center gap-2 font-bold text-2xl">
            <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Calculator className="h-6 w-6 text-primary-foreground" />
            </div>
            AwardPay
          </div>
          <div className="flex gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/auth")}
              className="hover:text-accent"
            >
              Sign In
            </Button>
            <Button
              onClick={() => navigate("/auth")}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              Get Started
            </Button>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto text-center mb-20">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Are You Being Paid
            <span className="text-transparent bg-clip-text bg-gradient-primary"> Correctly</span>?
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            AwardPay helps Australian workers instantly check if they're receiving the correct
            pay under their Modern Award. No more guessing – just accurate calculations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8"
            >
              Try Calculator Free
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/subscription")}
              className="text-lg px-8"
            >
              View Pricing
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-6xl mx-auto mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything You Need to Check Your Pay
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  className="bg-card/50 backdrop-blur-lg border-border hover:shadow-glow transition-all"
                >
                  <CardContent className="pt-6">
                    <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-3xl mx-auto text-center">
          <Card className="bg-gradient-card backdrop-blur-lg border-accent shadow-glow">
            <CardContent className="py-12">
              <h2 className="text-3xl font-bold mb-4">
                Start Checking Your Pay Today
              </h2>
              <p className="text-muted-foreground mb-8 text-lg">
                Join thousands of Australian workers ensuring they're paid fairly.
                Get 5 free calculations to start.
              </p>
              <Button
                size="lg"
                onClick={() => navigate("/auth")}
                className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8"
              >
                Create Free Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 font-bold text-xl">
              <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Calculator className="h-5 w-5 text-primary-foreground" />
              </div>
              AwardPay
            </div>
            <p className="text-muted-foreground text-sm">
              © 2024 AwardPay. Helping Australian workers get paid correctly.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
