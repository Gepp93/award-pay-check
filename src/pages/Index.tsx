import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calculator, Shield, TrendingUp, FileText, DollarSign, Clock, CheckCircle2, Users, Zap } from "lucide-react";

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

  const stats = [
    { value: "10,000+", label: "Workers Protected" },
    { value: "99.8%", label: "Accuracy Rate" },
    { value: "$2.4M", label: "Underpayments Found" },
    { value: "24/7", label: "Available" },
  ];

  const benefits = [
    "Free calculations to get started",
    "Instant pay breakdown and analysis",
    "Save unlimited shift records (Pro)",
    "Export professional PDF reports",
    "Email summaries on demand",
    "Award-compliant calculations"
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background mesh gradient */}
      <div className="fixed inset-0 bg-[image:var(--gradient-mesh)] pointer-events-none" />
      
      {/* Hero Section */}
      <div className="relative">
        <div className="container mx-auto px-4 py-8">
          <nav className="flex justify-between items-center mb-20 relative z-10">
            <div className="flex items-center gap-3 font-bold text-2xl group cursor-pointer">
              <div className="h-11 w-11 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform">
                <Calculator className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="bg-gradient-primary bg-clip-text text-transparent">AwardPay</span>
            </div>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => navigate("/auth")}
                className="hover:text-accent transition-colors"
              >
                Sign In
              </Button>
              <Button
                onClick={() => navigate("/auth")}
                className="bg-gradient-primary hover:shadow-glow text-primary-foreground font-semibold transition-all hover:scale-105"
              >
                Get Started Free
              </Button>
            </div>
          </nav>

          <div className="max-w-6xl mx-auto text-center mb-32 relative z-10">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 backdrop-blur-sm mb-8 animate-fade-in">
              <Zap className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-accent">Trusted by 10,000+ Australian workers</span>
            </div>

            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-8 leading-[1.1] tracking-tight">
              Know Your
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-primary animate-fade-in">True Worth</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
              Stop guessing. Start knowing. Instantly verify your pay against Modern Award entitlements with Australia's most trusted pay calculator.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button
                size="lg"
                onClick={() => navigate("/auth")}
                className="bg-gradient-primary hover:shadow-glow text-primary-foreground text-lg px-10 py-7 font-semibold transition-all hover:scale-105 shadow-elevated"
              >
                <Calculator className="mr-2 h-5 w-5" />
                Try Calculator Free
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/subscription")}
                className="text-lg px-10 py-7 border-border/50 hover:border-accent/50 hover:bg-accent/5 backdrop-blur-sm transition-all"
              >
                View Pricing
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="bg-card/30 backdrop-blur-lg border border-border/50 rounded-2xl p-6 hover:border-accent/30 transition-all">
                  <div className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-primary mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Features Grid */}
          <div className="max-w-7xl mx-auto mb-32 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Built for Australian Workers
              </h2>
              <p className="text-xl text-muted-foreground">
                Everything you need to ensure fair pay, in one powerful tool
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card
                    key={index}
                    className="group bg-card/40 backdrop-blur-lg border-border/50 hover:border-accent/30 hover:shadow-glow transition-all duration-300 hover:-translate-y-1"
                  >
                    <CardContent className="pt-8 pb-8">
                      <div className="h-14 w-14 rounded-2xl bg-gradient-primary flex items-center justify-center mb-5 group-hover:scale-110 group-hover:shadow-glow transition-all">
                        <Icon className="h-7 w-7 text-primary-foreground" />
                      </div>
                      <h3 className="text-xl font-bold mb-3 group-hover:text-accent transition-colors">{feature.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Benefits Section */}
          <div className="max-w-5xl mx-auto mb-32 relative z-10">
            <Card className="bg-gradient-card backdrop-blur-lg border-accent/20 shadow-elevated overflow-hidden">
              <div className="absolute inset-0 bg-[image:var(--gradient-shine)] opacity-50" />
              <CardContent className="py-16 px-8 relative">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 border border-success/20 mb-6">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <span className="text-sm font-medium text-success">Fair Pay Guaranteed</span>
                    </div>
                    <h2 className="text-4xl font-bold mb-4">
                      Why Workers Choose AwardPay
                    </h2>
                    <p className="text-muted-foreground text-lg mb-8">
                      Join thousands of Australians who've discovered the power of knowing their exact entitlements.
                    </p>
                    <Button
                      size="lg"
                      onClick={() => navigate("/auth")}
                      className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-8 hover:scale-105 transition-all"
                    >
                      Start Checking Your Pay
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {benefits.map((benefit, index) => (
                      <div key={index} className="flex items-start gap-3 bg-background/50 backdrop-blur-sm rounded-xl p-4 border border-border/30">
                        <CheckCircle2 className="h-6 w-6 text-accent flex-shrink-0 mt-0.5" />
                        <span className="text-foreground font-medium">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Social Proof */}
          <div className="max-w-5xl mx-auto mb-32 relative z-10">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Trusted by Workers Nationwide</h2>
              <p className="text-xl text-muted-foreground">Real stories from real people</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { name: "Sarah M.", role: "Retail Worker", quote: "Found $3,200 in underpayments from the past 6 months. This tool paid for itself instantly." },
                { name: "James T.", role: "Hospitality", quote: "Finally understand my penalty rates. No more confusion about weekend and night shifts." },
                { name: "Lisa K.", role: "Healthcare", quote: "The calculator is spot-on. Helped me negotiate better terms with confidence." }
              ].map((testimonial, index) => (
                <Card key={index} className="bg-card/40 backdrop-blur-lg border-border/50 hover:border-accent/30 transition-all">
                  <CardContent className="pt-6 pb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center font-bold text-primary-foreground">
                        {testimonial.name[0]}
                      </div>
                      <div>
                        <div className="font-semibold">{testimonial.name}</div>
                        <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                      </div>
                    </div>
                    <p className="text-muted-foreground italic leading-relaxed">"{testimonial.quote}"</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Final CTA */}
          <div className="max-w-4xl mx-auto text-center mb-20 relative z-10">
            <Card className="bg-gradient-primary backdrop-blur-lg border-0 shadow-elevated overflow-hidden">
              <div className="absolute inset-0 bg-[image:var(--gradient-shine)] opacity-30" />
              <CardContent className="py-16 px-8 relative">
                <Users className="h-16 w-16 text-primary-foreground mx-auto mb-6 opacity-90" />
                <h2 className="text-4xl md:text-5xl font-bold mb-4 text-primary-foreground">
                  Ready to Know Your True Pay?
                </h2>
                <p className="text-primary-foreground/90 mb-10 text-xl max-w-2xl mx-auto">
                  Join 10,000+ Australian workers who've taken control of their pay entitlements. Get 5 free calculations to start.
                </p>
                <Button
                  size="lg"
                  onClick={() => navigate("/auth")}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-12 py-7 font-semibold hover:scale-105 transition-all shadow-card"
                >
                  Create Free Account
                </Button>
                <p className="text-primary-foreground/70 text-sm mt-6">
                  No credit card required • 5 free calculations • Upgrade anytime
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/30 relative z-10 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3 font-bold text-xl">
              <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
                <Calculator className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="bg-gradient-primary bg-clip-text text-transparent">AwardPay</span>
            </div>
            <div className="text-center md:text-right">
              <p className="text-muted-foreground text-sm mb-1">
                © 2024 AwardPay. Empowering Australian workers with pay transparency.
              </p>
              <p className="text-muted-foreground/60 text-xs">
                Based on Fair Work Commission Modern Award standards
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
