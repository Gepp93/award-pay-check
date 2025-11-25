import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, X, Shield, FileText, Brain, Heart, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { NavBar } from "@/components/NavBar";

const Pricing = () => {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      {/* Section 1 - Hero Header */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Choose a Plan That Protects Your Pay
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            AwardPay helps Australians check if their payslips match their Modern Award. Start free and upgrade anytime.
          </p>
        </div>
      </section>

      {/* Section 2 - Pricing Cards */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-2xl">Free</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground">$0</span>
                  <span className="text-muted-foreground"> / month</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5" />
                    <span>5 calculations per month</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5" />
                    <span>Basic award presets</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5" />
                    <span>Basic penalties</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5" />
                    <span>Limited allowances</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <span className="text-muted-foreground">No shift saving</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <span className="text-muted-foreground">No payslip comparison</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <span className="text-muted-foreground">No PDF exports</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <span className="text-muted-foreground">No email reports</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/auth">Start Free</Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Pro Monthly Plan */}
            <Card className="flex flex-col border-primary shadow-lg relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </div>
              <CardHeader className="pt-8">
                <CardTitle className="text-2xl">Pro Monthly</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground">$14.99</span>
                  <span className="text-muted-foreground"> / month</span>
                </CardDescription>
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
                <Button className="w-full" asChild>
                  <Link to="/subscription">Get AwardPay Pro</Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Pro Yearly Plan */}
            <Card className="flex flex-col relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-secondary text-secondary-foreground px-4 py-1 rounded-full text-sm font-semibold whitespace-nowrap">
                Best Value — Save 34%
              </div>
              <CardHeader className="pt-8">
                <CardTitle className="text-2xl">Pro Yearly</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground">$119</span>
                  <span className="text-muted-foreground"> / year</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="font-semibold mb-4">All Pro Monthly features plus:</p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5" />
                    <span>Priority email support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5" />
                    <span>Award update alerts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5" />
                    <span>One-click shift history export</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" asChild>
                  <Link to="/subscription">Save With Yearly Plan</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* Section 3 - Feature Comparison Table */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">Compare Plans</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-semibold">Feature</th>
                  <th className="text-center p-4 font-semibold">Free</th>
                  <th className="text-center p-4 font-semibold">Pro Monthly</th>
                  <th className="text-center p-4 font-semibold">Pro Yearly</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Award-accurate calculations", free: "5/month", pro: "Unlimited", yearly: "Unlimited" },
                  { feature: "Penalty rates", free: "Basic", pro: "All", yearly: "All" },
                  { feature: "Allowances", free: "Limited", pro: "All", yearly: "All" },
                  { feature: "RDO tracking", free: false, pro: true, yearly: true },
                  { feature: "Save shifts", free: false, pro: true, yearly: true },
                  { feature: "Save payslips", free: false, pro: true, yearly: true },
                  { feature: "Payslip comparison", free: false, pro: true, yearly: true },
                  { feature: "Underpayment alerts", free: false, pro: true, yearly: true },
                  { feature: "PDF export", free: false, pro: true, yearly: true },
                  { feature: "Email export", free: false, pro: true, yearly: true },
                  { feature: "AI Award explainer", free: false, pro: true, yearly: true },
                  { feature: "Support level", free: "Community", pro: "Priority", yearly: "Priority+" },
                  { feature: "Yearly savings", free: "-", pro: "-", yearly: "$61" },
                ].map((row, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-4">{row.feature}</td>
                    <td className="text-center p-4">
                      {typeof row.free === "boolean" ? (
                        row.free ? <Check className="h-5 w-5 text-primary mx-auto" /> : <X className="h-5 w-5 text-muted-foreground mx-auto" />
                      ) : (
                        row.free
                      )}
                    </td>
                    <td className="text-center p-4">
                      {typeof row.pro === "boolean" ? (
                        row.pro ? <Check className="h-5 w-5 text-primary mx-auto" /> : <X className="h-5 w-5 text-muted-foreground mx-auto" />
                      ) : (
                        row.pro
                      )}
                    </td>
                    <td className="text-center p-4">
                      {typeof row.yearly === "boolean" ? (
                        row.yearly ? <Check className="h-5 w-5 text-primary mx-auto" /> : <X className="h-5 w-5 text-muted-foreground mx-auto" />
                      ) : (
                        row.yearly
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            <Link to="/auth">Try AwardPay Free</Link>
          </Button>
          <p className="mt-4 text-sm opacity-90">No credit card required.</p>
        </div>
      </section>
    </div>
  );
};

export default Pricing;
