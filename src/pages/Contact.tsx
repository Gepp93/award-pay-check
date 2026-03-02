import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calculator, Mail, Clock, MessageSquare, Menu, X } from "lucide-react";
import SEO from "@/components/SEO";

const Contact = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/10 via-white to-white">
      <SEO title="Contact Us - AwardPay Support | AwardPay" description="Get in touch with the AwardPay team. Email support@awardpay.com.au for help with your award pay questions." path="/contact" />
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
            
            <nav className="hidden md:flex items-center gap-8">
              <a href="/why-awardpay" className="text-foreground/70 hover:text-foreground transition-colors font-medium">
                Why AwardPay
              </a>
              <a href="/how-it-works" className="text-foreground/70 hover:text-foreground transition-colors font-medium">
                How It Works
              </a>
              <a href="/pricing" className="text-foreground/70 hover:text-foreground transition-colors font-medium">
                Pricing
              </a>
              <a href="/contact" className="text-primary font-medium">
                Contact
              </a>
              <Button variant="ghost" onClick={() => navigate("/auth")}>
                Sign In
              </Button>
              <Button onClick={() => navigate("/auth")} className="bg-gradient-primary">
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
                  className="px-4 py-2 text-primary font-medium hover:bg-secondary/50 rounded-lg transition-colors"
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

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="h-20 w-20 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-8">
            <Mail className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Get In{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Touch
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Have a question about your pay, our service, or need help with your account? 
            We're here to help Australian workers get the pay they deserve.
          </p>
        </div>
      </section>

      {/* Contact Card */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-2xl">
          <Card className="border-2 shadow-xl">
            <CardContent className="p-8 md:p-12">
              <div className="text-center space-y-8">
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold">Email Us</h2>
                  <p className="text-muted-foreground">
                    Our support team is ready to assist you with any questions or concerns.
                  </p>
                </div>

                <a 
                  href="mailto:support@awardpay.com.au"
                  className="inline-flex items-center gap-3 text-lg sm:text-2xl md:text-3xl font-bold text-primary hover:text-primary/80 transition-colors break-all"
                >
                  <Mail className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0" />
                  <span className="break-all">support@awardpay.com.au</span>
                </a>

                <div className="pt-8 border-t border-border">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Clock className="h-5 w-5" />
                    <span>We typically respond within 24-48 hours</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ Hint Section */}
      <section className="py-16 px-6 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-2">Common Questions</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Learn how AwardPay works, what awards we cover, and how to interpret your results.
                </p>
                <Button variant="outline" onClick={() => navigate("/how-it-works")}>
                  How It Works
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                  <Calculator className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-lg font-bold mb-2">Ready to Check Your Pay?</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Create your free account and start checking if you're being paid correctly.
                </p>
                <Button onClick={() => navigate("/auth")} className="bg-gradient-primary">
                  Get Started
                </Button>
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
  );
};

export default Contact;
