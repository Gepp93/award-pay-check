import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calculator, Shield, TrendingUp, FileText, DollarSign, Clock, CheckCircle2, Menu, X } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

// Screenshot carousel component - Images should be placed in public/screenshots/
// To add your screenshots: Save them as dashboard.png, job-details.png, results-underpaid.png, results-correct.png in public/screenshots/
const AppScreenshotCarousel = () => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  const screenshots = [
    { 
      src: "/screenshots/dashboard.png?v=2",
      fallbackTitle: "Dashboard",
      fallbackDesc: "Track your pay checks and see your history",
      alt: "Dashboard - View your saved pay checks" 
    },
    { 
      src: "/screenshots/job-details.png?v=2",
      fallbackTitle: "Job Details",
      fallbackDesc: "Enter your work details in our simple wizard",
      alt: "Job Details - Enter your work information" 
    },
    { 
      src: "/screenshots/results-underpaid.png?v=2",
      fallbackTitle: "Underpayment Detection",
      fallbackDesc: "Find out if you're being underpaid",
      alt: "Results - See underpayment detection" 
    },
    { 
      src: "/screenshots/results-correct.png?v=2",
      fallbackTitle: "Allowance Discovery",
      fallbackDesc: "Discover entitlements you may be missing",
      alt: "Allowances - Discover your entitlements" 
    },
  ];

  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  const handleImageError = (index: number) => {
    setImageErrors(prev => ({ ...prev, [index]: true }));
  };

  return (
    <div className="space-y-6">
      <Carousel
        setApi={setApi}
        opts={{ loop: true }}
        plugins={[
          Autoplay({
            delay: 4000,
            stopOnInteraction: false,
            stopOnMouseEnter: true,
          }),
        ]}
        className="w-full"
      >
        <CarouselContent>
          {screenshots.map((screenshot, index) => (
            <CarouselItem key={index}>
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-border/50 bg-background flex items-center justify-center">
                {imageErrors[index] ? (
                  <div className="w-full aspect-[16/10] bg-gradient-to-br from-secondary/50 to-secondary flex flex-col items-center justify-center p-8">
                    <div className="h-16 w-16 rounded-full bg-gradient-primary flex items-center justify-center mb-4">
                      <Calculator className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">{screenshot.fallbackTitle}</h3>
                    <p className="text-muted-foreground text-center">{screenshot.fallbackDesc}</p>
                  </div>
                ) : (
                  <img
                    src={screenshot.src}
                    alt={screenshot.alt}
                    className="w-auto h-auto max-h-[70vh] mx-auto"
                    onError={() => handleImageError(index)}
                  />
                )}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Navigation Dots */}
      <div className="flex justify-center gap-2">
        {Array.from({ length: count }).map((_, index) => (
          <button
            key={index}
            onClick={() => api?.scrollTo(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === current
                ? "w-8 bg-primary"
                : "w-2 bg-primary/30 hover:bg-primary/50"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

const Index = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
                onClick={() => navigate("/new-check-step-1")}
                className="bg-gradient-primary text-primary-foreground hover:opacity-90 px-6"
              >
                Check My Pay Now
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
                    onClick={() => { navigate("/new-check-step-1"); setMobileMenuOpen(false); }}
                    className="bg-gradient-primary text-primary-foreground hover:opacity-90"
                  >
                    Check My Pay Now
                  </Button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Add padding to account for fixed header */}
      <div className="pt-20">
        {/* Hero Section */}
        <section className="py-24 md:py-32 bg-gradient-to-b from-secondary/10 via-white to-white">
          <div className="container mx-auto px-6">
            <div className="max-w-7xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                {/* Left Column - Text Content */}
                <div className="space-y-8">
                  <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                    Are You Being Paid{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-primary">
                      Correctly
                    </span>
                    ?
                  </h1>
                  <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
                    AwardPay helps Australian workers instantly check if their payslip matches their Modern Award. No confusion. No guessing. Just award-accurate calculations.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Button
                      size="lg"
                      onClick={() => navigate("/new-check-step-1")}
                      className="bg-gradient-primary text-primary-foreground hover:opacity-90 text-lg px-8 py-6 h-14 font-semibold"
                    >
                      Check My Pay Now
                    </Button>
                  </div>
                </div>

                {/* Right Column - Badge/Card Graphic */}
                <div className="flex items-center justify-center lg:justify-end">
                  <div className="relative">
                    {/* Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-3xl rounded-full scale-110"></div>
                    
                    {/* Main Badge */}
                    <div className="relative bg-white border-4 border-primary rounded-3xl p-12 shadow-2xl max-w-md">
                      <div className="text-center space-y-6">
                        {/* Badge Icon */}
                        <div className="mx-auto w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
                          <Shield className="w-12 h-12 text-primary-foreground" />
                        </div>
                        
                        {/* Badge Title */}
                        <div className="space-y-2">
                          <div className="text-sm font-bold text-primary tracking-widest uppercase">
                            Certified
                          </div>
                          <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
                            Award Accurate Calculator
                          </h2>
                        </div>
                        
                        {/* Badge Subtitle */}
                        <div className="pt-4 border-t border-border">
                          <p className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-primary">
                            No More Underpayment
                          </p>
                        </div>
                        
                        {/* Checkmarks */}
                        <div className="space-y-3 pt-4 flex flex-col items-center">
                          {[
                            "Fair Work Compliant",
                            "Modern Award Rules",
                            "Instant Verification",
                            "Tax Deductible"
                          ].map((item, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground w-48">
                              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* App Screenshots Carousel Section */}
        <section className="py-12 bg-gradient-to-b from-white to-secondary/10">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <AppScreenshotCarousel />
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
                    Create your free account and choose the plan that works for you.
                  </p>
                  <Button
                    size="lg"
                    onClick={() => navigate("/auth")}
                    className="bg-white text-primary hover:bg-white/90 text-lg px-12 py-6 font-semibold"
                  >
                    Create Free Account
                  </Button>
                  <p className="text-primary-foreground/80 text-sm mt-6">
                    Free to sign up • $30 for 3 months access • No recurring charges
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
                  © 2025 AwardPay. Empowering Australian workers.
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
