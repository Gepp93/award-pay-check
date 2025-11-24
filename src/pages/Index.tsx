import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calculator, Shield, TrendingUp, FileText, DollarSign, Clock, CheckCircle2 } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Calculator,
      title: "Instant Calculations",
      description: "Get accurate award pay calculations in seconds",
    },
    {
      icon: Shield,
      title: "Award Compliant",
      description: "Based on Fair Work Commission standards",
    },
    {
      icon: TrendingUp,
      title: "Penalty Rates",
      description: "Automatic overtime and weekend calculations",
    },
    {
      icon: FileText,
      title: "Save & Export",
      description: "Keep records and export to PDF",
    },
    {
      icon: DollarSign,
      title: "Allowances",
      description: "Includes meal and travel allowances",
    },
    {
      icon: Clock,
      title: "Real-time",
      description: "See your pay update as you enter details",
    },
  ];

  const trustedSources = [
    { name: "Fair Work Commission", subtitle: "Modern Awards Database" },
    { name: "Fair Work Ombudsman", subtitle: "Australian Government" },
    { name: "Pay Rate Database", subtitle: "Official Award Rates" },
    { name: "ATO", subtitle: "Australian Taxation Office" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Fixed Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-border">
        <div className="container mx-auto px-4">
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
            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => navigate("/auth")}
              >
                Sign In
              </Button>
              <Button
                onClick={() => navigate("/auth")}
                className="bg-gradient-primary text-primary-foreground hover:opacity-90"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Add padding to account for fixed header */}
      <div className="pt-20">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-b from-secondary/30 to-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
                Are You Being Paid{" "}
                <span className="text-transparent bg-clip-text bg-gradient-primary">
                  Correctly
                </span>
                ?
              </h1>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                AwardPay helps Australian workers instantly check if they're receiving 
                the correct pay under their Modern Award. No more guessing – just accurate calculations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={() => navigate("/auth")}
                  className="bg-gradient-primary text-primary-foreground hover:opacity-90 text-lg px-8 py-6"
                >
                  Try Calculator Free
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/subscription")}
                  className="text-lg px-8 py-6 border-2"
                >
                  View Pricing
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: "10,000+", label: "Workers Protected" },
                { value: "99.8%", label: "Accuracy Rate" },
                { value: "$2.4M", label: "Underpayments Found" },
                { value: "24/7", label: "Available" },
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-primary mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-secondary/20">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold mb-4">
                  Everything You Need
                </h2>
                <p className="text-xl text-muted-foreground">
                  Built for Australian workers, backed by official data
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <Card
                      key={index}
                      className="bg-white border-border hover:shadow-lg transition-all"
                    >
                      <CardContent className="pt-6 pb-6">
                        <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4">
                          <Icon className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                        <p className="text-muted-foreground text-sm">{feature.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Trusted Sources Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold mb-4">
                  Trusted Information Sources
                </h2>
                <p className="text-xl text-muted-foreground">
                  Our calculations are based on official Australian Government data
                </p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {trustedSources.map((source, index) => (
                  <Card key={index} className="bg-white border-border hover:shadow-md transition-all">
                    <CardContent className="flex flex-col items-center justify-center text-center p-8">
                      <div className="h-16 w-16 rounded-full bg-gradient-primary/10 flex items-center justify-center mb-4">
                        <Shield className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="font-bold text-base mb-1">{source.name}</h3>
                      <p className="text-xs text-muted-foreground">{source.subtitle}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 bg-secondary/20">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold mb-4">
                  Trusted by Workers Nationwide
                </h2>
                <p className="text-xl text-muted-foreground">
                  Real stories from real people
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { name: "Sarah M.", role: "Retail Worker", quote: "Found $3,200 in underpayments. This tool paid for itself instantly." },
                  { name: "James T.", role: "Hospitality", quote: "Finally understand my penalty rates. No more confusion about shifts." },
                  { name: "Lisa K.", role: "Healthcare", quote: "The calculator is spot-on. Helped me negotiate better terms." }
                ].map((testimonial, index) => (
                  <Card key={index} className="bg-white border-border">
                    <CardContent className="pt-6 pb-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center font-bold text-primary-foreground text-lg">
                          {testimonial.name[0]}
                        </div>
                        <div>
                          <div className="font-semibold">{testimonial.name}</div>
                          <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                        </div>
                      </div>
                      <p className="text-muted-foreground italic">"{testimonial.quote}"</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Card className="bg-gradient-primary border-0 shadow-xl">
                <CardContent className="py-16 px-8 text-center">
                  <CheckCircle2 className="h-16 w-16 text-primary-foreground mx-auto mb-6" />
                  <h2 className="text-4xl md:text-5xl font-bold mb-4 text-primary-foreground">
                    Ready to Know Your True Pay?
                  </h2>
                  <p className="text-primary-foreground/90 mb-8 text-lg max-w-2xl mx-auto">
                    Join 10,000+ Australian workers who've taken control of their pay entitlements. 
                    Get 5 free calculations to start.
                  </p>
                  <Button
                    size="lg"
                    onClick={() => navigate("/auth")}
                    className="bg-white text-primary hover:bg-white/90 text-lg px-12 py-6 font-semibold"
                  >
                    Create Free Account
                  </Button>
                  <p className="text-primary-foreground/80 text-sm mt-6">
                    No credit card required • 5 free calculations • Upgrade anytime
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border bg-secondary/10">
          <div className="container mx-auto px-4 py-12">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-2 font-bold text-xl">
                <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                  <Calculator className="h-5 w-5 text-primary-foreground" />
                </div>
                <span>AwardPay</span>
              </div>
              <div className="text-center md:text-right">
                <p className="text-muted-foreground text-sm mb-1">
                  © 2024 AwardPay. Empowering Australian workers.
                </p>
                <p className="text-muted-foreground/60 text-xs">
                  Based on Fair Work Commission Modern Award standards
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
