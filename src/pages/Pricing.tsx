import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, Shield, FileText, Brain, Heart, Info } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { PublicNavBar } from "@/components/PublicNavBar";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";

const Pricing = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUpgrade = () => {
    if (!user) {
      // Not logged in - redirect to auth with plan info
      navigate(`/auth?redirect=checkout&plan=3month`);
      return;
    }

    // Logged in - go directly to Stripe
    window.location.href = "https://buy.stripe.com/6oUeVe0kk9Zn4XZ5Nz6AM04";
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Pricing - Affordable Award Pay Checking | AwardPay"
        description="Check your Australian award pay from $10/month. Verify overtime, penalty rates and allowances with AwardPay's accurate calculator."
        path="/pricing"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "How does AwardPay calculate pay?",
              "acceptedAnswer": { "@type": "Answer", "text": "AwardPay uses the Fair Work Commission Modern Awards Pay Database and applies built-in logic for overtime, penalties, allowances, and other award conditions. We interpret the award rules so you don't have to read complex PDFs." }
            },
            {
              "@type": "Question",
              "name": "Where does AwardPay get its data?",
              "acceptedAnswer": { "@type": "Answer", "text": "All award rates, penalty multipliers, and allowances come from the official Fair Work Commission Modern Awards Pay Database. We update our data regularly to match current pay tables and award variations." }
            },
            {
              "@type": "Question",
              "name": "Can I cancel anytime?",
              "acceptedAnswer": { "@type": "Answer", "text": "Yes, you can cancel your subscription at any time. You'll continue to have access to Pro features until the end of your billing period. No questions asked, no cancellation fees." }
            },
            {
              "@type": "Question",
              "name": "Is my data secure?",
              "acceptedAnswer": { "@type": "Answer", "text": "Absolutely. We use industry-standard encryption for all data storage and transmission. Your personal information and pay data are never shared with third parties." }
            },
            {
              "@type": "Question",
              "name": "Does AwardPay support my award?",
              "acceptedAnswer": { "@type": "Answer", "text": "AwardPay supports all major Modern Awards across industries including construction, retail, hospitality, healthcare, manufacturing, trades, and more." }
            }
          ]
        }}
      />
      <PublicNavBar />
      
      {/* Section 1 - Hero Header */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Choose a Plan That Protects Your Pay
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            AwardPay helps Australians check if their payslips match their Modern Award. Free to sign up, choose your plan.
          </p>
        </div>
      </section>

      {/* Section 2 - Pricing Card */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-md">
          {/* 3 Month Access Pass */}
          <Card className="flex flex-col border-primary shadow-lg relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
              Full Access
            </div>
            <CardHeader className="pt-8">
              <CardTitle className="text-2xl">3 Month Access Pass</CardTitle>
              <CardDescription>
                <span className="text-3xl font-bold text-foreground">$30</span>
                <span className="text-muted-foreground"> for 3 months</span>
              </CardDescription>
              <p className="text-sm text-muted-foreground mt-2">
                Just $10/month — one-time payment
              </p>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5" />
                  <span className="font-semibold">Unlimited award-accurate calculations</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5" />
                  <span>All penalty rates</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5" />
                  <span>All allowances</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5" />
                  <span>RDO tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5" />
                  <span>Save shifts</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5" />
                  <span>Save payslips</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5" />
                  <span>Underpayment detection</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5" />
                  <span>Side-by-side payslip comparison</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5" />
                  <span>Export PDF reports</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5" />
                  <span>Email summaries</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5" />
                  <span>AwardPay AI assistant</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5" />
                  <span>Priority support</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleUpgrade}>
                Get 3 Month Access — $30
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* Section 3 - What's Included */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">What's Included</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              "Unlimited award-accurate calculations",
              "All penalty rates",
              "All allowances",
              "RDO tracking",
              "Save shifts",
              "Save payslips",
              "Payslip comparison",
              "Underpayment alerts",
              "PDF export",
              "Email export",
              "AI Award explainer",
              "Priority support",
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-2 p-3 bg-background rounded-lg">
                <Check className="h-5 w-5 text-primary" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4 - Why Upgrade */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">Why Upgrade</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-primary mb-2" />
                <CardTitle>One underpayment can cost you hundreds</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Even a single missed allowance or penalty rate covers months of AwardPay Pro.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <FileText className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Instant evidence for your employer</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  PDF reports and saved payslips make discussions simple and respectful.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Brain className="h-10 w-10 text-primary mb-2" />
                <CardTitle>AwardPay understands the rules for you</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Overtime triggers, night penalties, public holidays — AwardPay interprets everything.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Heart className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Peace of mind every pay cycle</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Know you're being paid correctly, every shift, every week.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Section 5 - Tax Deduction Message */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader>
              <div className="flex items-start gap-3">
                <Info className="h-6 w-6 text-primary mt-1" />
                <div>
                  <CardTitle className="text-2xl mb-2">Can I claim AwardPay on tax?</CardTitle>
                  <CardDescription className="text-base">
                    Many Australian workers may be able to claim their AwardPay subscription as a work-related expense, 
                    because the service helps manage and verify employment income. This may reduce your tax payable.
                  </CardDescription>
                  <p className="text-sm text-muted-foreground mt-4">
                    Check with your accountant or the ATO to confirm your eligibility.
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Section 6 - Real Results */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">Real Results</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <p className="text-lg italic mb-4">
                  "AwardPay found $2,600 in missed Sunday penalties over six months."
                </p>
                <p className="text-sm text-muted-foreground">— Construction Worker, NSW</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-lg italic mb-4">
                  "My employer wasn't applying meal allowances — AwardPay caught it instantly."
                </p>
                <p className="text-sm text-muted-foreground">— Retail Manager, VIC</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-lg italic mb-4">
                  "This app gave me the confidence to understand my award properly."
                </p>
                <p className="text-sm text-muted-foreground">— Healthcare Worker, QLD</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Section 7 - FAQ */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>How does AwardPay calculate pay?</AccordionTrigger>
              <AccordionContent>
                AwardPay uses the Fair Work Commission Modern Awards Pay Database and applies built-in logic 
                for overtime, penalties, allowances, and other award conditions. We interpret the award rules 
                so you don't have to read complex PDFs.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>Where does AwardPay get its data?</AccordionTrigger>
              <AccordionContent>
                All award rates, penalty multipliers, and allowances come from the official Fair Work Commission 
                Modern Awards Pay Database. We update our data regularly to match current pay tables and award variations.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger>Can I cancel anytime?</AccordionTrigger>
              <AccordionContent>
                Yes, you can cancel your subscription at any time. You'll continue to have access to Pro features 
                until the end of your billing period. No questions asked, no cancellation fees.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger>Is my data secure?</AccordionTrigger>
              <AccordionContent>
                Absolutely. We use industry-standard encryption for all data storage and transmission. Your personal 
                information and pay data are never shared with third parties. We take your privacy seriously.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger>Does AwardPay support my award?</AccordionTrigger>
              <AccordionContent>
                AwardPay supports all major Modern Awards across industries including construction, retail, hospitality, 
                healthcare, manufacturing, trades, and more. If your employment is covered by a Modern Award, AwardPay can 
                help you check your pay.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Section 8 - Final CTA */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to check your next payslip?</h2>
          <Button size="lg" variant="secondary" asChild>
            <Link to="/auth">Create Free Account</Link>
          </Button>
          <p className="mt-4 text-sm opacity-90">Free to sign up • Choose your plan</p>
        </div>
      </section>
    </div>
  );
};

export default Pricing;
