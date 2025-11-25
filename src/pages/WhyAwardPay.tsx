import { NavBar } from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale, MapPin, CheckCircle2, FileText, AlertTriangle, Users, Clock, DollarSign, Shield, RefreshCw, Calculator, TrendingUp, Hammer, ShoppingCart, Heart, Factory, Wrench, Utensils, UserCheck, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const WhyAwardPay = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20">
      <NavBar />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-32 pb-20 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-center gap-4 mb-6">
            <Scale className="w-16 h-16 text-primary" />
            <MapPin className="w-16 h-16 text-accent" />
            <CheckCircle2 className="w-16 h-16 text-success" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold">
            <span className="text-foreground">Why </span>
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              AwardPay Exists
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Because figuring out your correct pay under a Modern Award shouldn't require a law degree. 
            AwardPay makes award rules simple, clear, and accurate — so every worker knows exactly what they're owed.
          </p>
        </div>
      </section>

      {/* Problem Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-4">The Problem With Australia's Award System</h2>
        <p className="text-center text-muted-foreground mb-12 text-lg">Understanding your correct pay shouldn't be this difficult</p>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="border-2 hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <FileText className="w-12 h-12 text-destructive mb-4" />
              <CardTitle className="text-2xl">Awards Are Extremely Complex</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0 text-destructive" />
                  <span>Dozens of pay rates</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0 text-destructive" />
                  <span>Penalties change depending on time of day and day of week</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0 text-destructive" />
                  <span>Rules differ between industries and classifications</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0 text-destructive" />
                  <span>PDFs are unclear and difficult to interpret</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <Users className="w-12 h-12 text-destructive mb-4" />
              <CardTitle className="text-2xl">Most Underpayments Are Unintentional</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0 text-destructive" />
                  <span>Employers think they are doing it right but misread the award</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0 text-destructive" />
                  <span>Small mistakes in overtime or allowances compound over months</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0 text-destructive" />
                  <span>Workers often never realise they're short</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <Calculator className="w-12 h-12 text-destructive mb-4" />
              <CardTitle className="text-2xl">Workers Have No Simple Way to Check Their Pay</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0 text-destructive" />
                  <span>Fair Work tools are helpful but not built for detailed shift checking</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0 text-destructive" />
                  <span>Award PDFs are overwhelming</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0 text-destructive" />
                  <span>Industry calculators rarely include allowances or exact award clauses</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0 text-destructive" />
                  <span>Workers don't know what they don't know</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Solution Section */}
      <section className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4">The AwardPay Solution</h2>
          <p className="text-center text-muted-foreground mb-12 text-lg">Complete award accuracy, simplified</p>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <Card className="border-2 border-primary/20 hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CheckCircle2 className="w-10 h-10 text-primary mb-3" />
                <CardTitle className="text-xl">Built for Modern Awards</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  AwardPay interprets award rules using official Fair Work Commission data and turns them into simple calculations anyone can understand.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20 hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <FileText className="w-10 h-10 text-accent mb-3" />
                <CardTitle className="text-xl">Checks Every Component of Your Pay</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Ordinary hours, penalties, overtime, allowances, RDOs, public holiday rates — all calculated and displayed clearly.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20 hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <Sparkles className="w-10 h-10 text-success mb-3" />
                <CardTitle className="text-xl">Transparent & Easy to Use</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Enter your shift → get a full breakdown → compare with your payslip.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20 hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <Shield className="w-10 h-10 text-primary mb-3" />
                <CardTitle className="text-xl">Protection From Underpayment</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Even small errors matter. AwardPay helps you catch them early.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Unique Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-4">What AwardPay Does That Others Don't</h2>
        <p className="text-center text-muted-foreground mb-12 text-lg">Complete coverage of every award component</p>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <Clock className="w-8 h-8 text-primary mb-2" />
              <CardTitle className="text-lg">Accurately applies overtime triggers</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Daily overtime, weekly overtime, time & a half, double time — automates complex boundary rules.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <DollarSign className="w-8 h-8 text-accent mb-2" />
              <CardTitle className="text-lg">Detects missing allowances</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Meal allowances, travel, first aid, leading hand, site allowances, tool allowances — AwardPay checks everything.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <Clock className="w-8 h-8 text-success mb-2" />
              <CardTitle className="text-lg">Reads weekend & night penalties properly</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Saturday, Sunday, early morning, evening, and night shift penalties all applied automatically.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CheckCircle2 className="w-8 h-8 text-primary mb-2" />
              <CardTitle className="text-lg">Handles public holidays</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Integrates public holiday dates for every Australian state & territory.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <RefreshCw className="w-8 h-8 text-accent mb-2" />
              <CardTitle className="text-lg">Smart RDO logic</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Understands RDO accrual rules for construction and civil awards.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <TrendingUp className="w-8 h-8 text-success mb-2" />
              <CardTitle className="text-lg">Shows "expected pay vs. paid" instantly</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Your payslip amount goes in; AwardPay reveals the difference.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Trust Section */}
      <section className="bg-secondary/30 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4">Where AwardPay's Data Comes From</h2>
          <p className="text-center text-muted-foreground mb-12 text-lg">Built on official sources you can trust</p>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <Shield className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Official Award Data</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  AwardPay uses the Modern Awards Pay Database provided by the Fair Work Commission.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20">
              <CardHeader>
                <RefreshCw className="w-12 h-12 text-accent mb-4" />
                <CardTitle>Regular Updates</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  AwardPay automatically updates when new wage tables, allowance rates, or award variations are published.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CheckCircle2 className="w-12 h-12 text-success mb-4" />
                <CardTitle>Award-Compliant Calculations</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Our rule engine follows real award conditions — multipliers, triggers, allowances, and minimum engagements.
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8 max-w-2xl mx-auto">
            <strong>Disclaimer:</strong> AwardPay is an interpretation tool, not legal advice. Always refer to the award for confirmation.
          </p>
        </div>
      </section>

      {/* Impact Stories Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-4">Real Impact for Real Workers</h2>
        <p className="text-center text-muted-foreground mb-12 text-lg">Stories from workers who discovered the truth</p>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-2">
            <CardHeader>
              <CardTitle className="text-xl">"I found out I was underpaid $2,600 over six months."</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base italic">
                Construction worker discovering missing penalty rates and RDO calculations
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-accent/5 to-success/5 border-2">
            <CardHeader>
              <CardTitle className="text-xl">"My employer wasn't applying Saturday penalties correctly."</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base italic">
                Retail worker catching systematic weekend rate errors
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-success/5 to-primary/5 border-2">
            <CardHeader>
              <CardTitle className="text-xl">"I discovered I should have been receiving meal allowances for long shifts."</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base italic">
                Healthcare worker learning about missed allowance entitlements
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8">
          <Button size="lg" onClick={() => navigate("/how-it-works")}>
            See how AwardPay works
          </Button>
        </div>
      </section>

      {/* Industries Section */}
      <section className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4">Designed for All Industries</h2>
          <p className="text-center text-muted-foreground mb-12 text-lg">If it's under a Modern Award, AwardPay can calculate it</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <Card className="text-center hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <Hammer className="w-12 h-12 text-primary mx-auto mb-2" />
                <CardTitle className="text-lg">Construction & Civil</CardTitle>
              </CardHeader>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <ShoppingCart className="w-12 h-12 text-accent mx-auto mb-2" />
                <CardTitle className="text-lg">Retail & Fast Food</CardTitle>
              </CardHeader>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <Heart className="w-12 h-12 text-success mx-auto mb-2" />
                <CardTitle className="text-lg">Health & Aged Care</CardTitle>
              </CardHeader>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <Factory className="w-12 h-12 text-primary mx-auto mb-2" />
                <CardTitle className="text-lg">Manufacturing</CardTitle>
              </CardHeader>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <Wrench className="w-12 h-12 text-accent mx-auto mb-2" />
                <CardTitle className="text-lg">Trades & Electrical</CardTitle>
              </CardHeader>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <Utensils className="w-12 h-12 text-success mx-auto mb-2" />
                <CardTitle className="text-lg">Hospitality & Tourism</CardTitle>
              </CardHeader>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <UserCheck className="w-12 h-12 text-primary mx-auto mb-2" />
                <CardTitle className="text-lg">NDIS & Support Work</CardTitle>
              </CardHeader>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <Sparkles className="w-12 h-12 text-accent mx-auto mb-2" />
                <CardTitle className="text-lg">Cleaning & Security</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Impact Stats Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <h2 className="text-4xl font-bold">Why It Matters</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <div className="text-5xl font-bold text-primary">1 in 4</div>
              <p className="text-lg text-muted-foreground">Workers are underpaid in Australia</p>
            </div>
            
            <div className="space-y-2">
              <div className="text-5xl font-bold text-accent">Most</div>
              <p className="text-lg text-muted-foreground">Never realise it</p>
            </div>
            
            <div className="space-y-2">
              <div className="text-5xl font-bold text-success">$1000s</div>
              <p className="text-lg text-muted-foreground">Lost annually per worker</p>
            </div>
          </div>

          <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl md:text-3xl">
                AwardPay empowers workers with clarity, fairness, and transparency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-muted-foreground">
                Even small errors (5–10 min per shift) add up over months. Don't let systematic underpayment continue.
              </p>
            </CardContent>
          </Card>

          <blockquote className="text-3xl font-semibold italic border-l-4 border-primary pl-6 py-4">
            "Workers shouldn't need accountants or lawyers to understand their pay."
          </blockquote>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary to-accent py-20 text-white">
        <div className="container mx-auto px-4 text-center space-y-6">
          <h2 className="text-4xl md:text-5xl font-bold">
            Ready to see if you're being paid correctly?
          </h2>
          <Button 
            size="lg" 
            variant="secondary"
            className="text-lg px-8 py-6"
            onClick={() => navigate("/calculator")}
          >
            Try AwardPay Free
          </Button>
          <p className="text-white/90">
            No credit card needed for the basic calculator
          </p>
        </div>
      </section>
    </div>
  );
};

export default WhyAwardPay;
