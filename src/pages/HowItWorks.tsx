import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import {
  Calculator,
  Calendar,
  FileText,
  CheckCircle2,
  Clock,
  DollarSign,
  Award,
  Briefcase,
  Sun,
  Moon,
  AlertCircle,
  Zap,
  Shield,
  TrendingUp,
  Download,
  Mail,
  Save,
  Database,
  RefreshCw,
  ArrowRight,
} from "lucide-react";

const HowItWorks = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/10 via-white to-white">
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
              <a href="/" className="text-foreground/70 hover:text-foreground transition-colors">
                Why AwardPay
              </a>
              <a href="/how-it-works" className="text-primary font-medium">
                How It Works
              </a>
              <a href="#" className="text-foreground/70 hover:text-foreground transition-colors">
                Pricing
              </a>
              <Button variant="ghost" onClick={() => navigate("/auth")}>
                Sign In
              </Button>
              <Button onClick={() => navigate("/auth")} className="bg-gradient-primary">
                Get Started
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* SECTION 1 - Hero Explainer */}
      <section className="pt-32 pb-16 px-6">
        <div className="container mx-auto max-w-5xl text-center">
          <div className="flex justify-center gap-4 mb-8">
            <div className="h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center">
              <Calendar className="h-8 w-8 text-accent" />
            </div>
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <div className="h-16 w-16 rounded-2xl bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            How AwardPay Checks Your Pay —{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Step by Step
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            AwardPay turns your roster into a complete award-accurate pay breakdown using real Modern Award rules, 
            penalties, allowances, and overtime conditions.
          </p>
        </div>
      </section>

      {/* SECTION 2 - 4-Step Process */}
      <section className="py-16 px-6 bg-white">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">The Complete Process</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <Card className="relative overflow-hidden border-2 hover:shadow-elevated transition-shadow">
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-primary opacity-10 rounded-bl-full" />
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-gradient-primary text-primary-foreground flex items-center justify-center font-bold text-xl mb-4">
                  1
                </div>
                <CardTitle className="text-xl">Enter Your Shift Details</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Clock className="h-4 w-4 mt-0.5 text-accent shrink-0" />
                    <span>Start time, finish time, break duration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 mt-0.5 text-accent shrink-0" />
                    <span>Day of week</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Award className="h-4 w-4 mt-0.5 text-accent shrink-0" />
                    <span>Award classification (e.g., Level 3 Electrical Worker)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <DollarSign className="h-4 w-4 mt-0.5 text-accent shrink-0" />
                    <span>Optional allowances (we'll verify)</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card className="relative overflow-hidden border-2 hover:shadow-elevated transition-shadow">
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-primary opacity-10 rounded-bl-full" />
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-gradient-primary text-primary-foreground flex items-center justify-center font-bold text-xl mb-4">
                  2
                </div>
                <CardTitle className="text-xl">Fetch Award Data</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Database className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span>Fair Work Commission Modern Awards API</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span>Base rates, overtime multipliers, penalties</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sun className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span>Weekend & public holiday rates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <RefreshCw className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span>Cross-checks with internal rule logic</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card className="relative overflow-hidden border-2 hover:shadow-elevated transition-shadow">
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-primary opacity-10 rounded-bl-full" />
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-gradient-primary text-primary-foreground flex items-center justify-center font-bold text-xl mb-4">
                  3
                </div>
                <CardTitle className="text-xl">Apply Award Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Zap className="h-4 w-4 mt-0.5 text-accent shrink-0" />
                    <span>Calculate ordinary, 1.5×, and 2× hours</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Moon className="h-4 w-4 mt-0.5 text-accent shrink-0" />
                    <span>Apply shift penalties automatically</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Briefcase className="h-4 w-4 mt-0.5 text-accent shrink-0" />
                    <span>Check allowance eligibility (meal, travel, site)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 mt-0.5 text-accent shrink-0" />
                    <span>RDO accrual logic for construction awards</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Step 4 */}
            <Card className="relative overflow-hidden border-2 hover:shadow-elevated transition-shadow">
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-primary opacity-10 rounded-bl-full" />
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-gradient-primary text-primary-foreground flex items-center justify-center font-bold text-xl mb-4">
                  4
                </div>
                <CardTitle className="text-xl">Complete Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <FileText className="h-4 w-4 mt-0.5 text-success shrink-0" />
                    <span>Base pay, 1.5×, 2×, penalties, allowances</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-success shrink-0" />
                    <span>RDO credits tracked</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 mt-0.5 text-success shrink-0" />
                    <span>Total expected pay calculated</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 text-success shrink-0" />
                    <span>Comparison vs your payslip</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* SECTION 3 - Deep Dive Grid */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What AwardPay Checks For You</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our award interpretation engine validates every aspect of your pay against Modern Award rules
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-card transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Ordinary Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Correct application of 7.6h rules or award-specific ordinary hours.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-card transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Overtime Rates</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Time & a half and double time applied automatically.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-card transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center mb-4">
                  <Sun className="h-6 w-6 text-success" />
                </div>
                <CardTitle>Penalty Rates</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Saturday, Sunday, public holidays, night work, early mornings, split shifts.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-card transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Allowances</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Meal allowance, travel, site allowance, first aid, leading hand, tools, uniform, level allowances.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-card transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>RDO Accrual</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Accurate tracking of RDO hours (construction-style awards).
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-card transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-success" />
                </div>
                <CardTitle>Broken Shifts</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Automatically detects split shifts and adds penalty multipliers.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-card transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <AlertCircle className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Minimum Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Ensures you're paid correctly if rostered for too few hours.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-card transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                  <RefreshCw className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Rounding Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  AwardPay follows official rounding rules for minutes vs hours.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-card transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center mb-4">
                  <Award className="h-6 w-6 text-success" />
                </div>
                <CardTitle>Higher Duties</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Checks if you worked above your classification temporarily.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* SECTION 4 - Data Sources */}
      <section className="py-16 px-6 bg-white">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-success/10 text-success border-success/20">
              Trusted Data Sources
            </Badge>
            <h2 className="text-3xl font-bold mb-4">Where AwardPay Gets Its Data</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We use official Fair Work Commission data combined with sophisticated rule engines
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Database className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Reliable, Official Award Data</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success mt-0.5 shrink-0" />
                  <span className="text-sm">Fair Work Commission Modern Awards Pay Database</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success mt-0.5 shrink-0" />
                  <span className="text-sm">Current year pay tables</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success mt-0.5 shrink-0" />
                  <span className="text-sm">Allowance updates</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success mt-0.5 shrink-0" />
                  <span className="text-sm">Penalty rate changes</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success mt-0.5 shrink-0" />
                  <span className="text-sm">Public holiday dates (auto-integrated)</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-accent" />
                  </div>
                  <CardTitle>Built-In Logic</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success mt-0.5 shrink-0" />
                  <span className="text-sm">Overtime triggers</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success mt-0.5 shrink-0" />
                  <span className="text-sm">Daily/weekly ordinary hours</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success mt-0.5 shrink-0" />
                  <span className="text-sm">Allowance conditions</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success mt-0.5 shrink-0" />
                  <span className="text-sm">Night shift loadings</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success mt-0.5 shrink-0" />
                  <span className="text-sm">RDO bank rules</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-muted/30 border-muted">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  <strong>Important:</strong> AwardPay is not legal advice — it is a powerful award interpretation tool 
                  based on official Fair Work data. For legal advice about your specific situation, consult a qualified professional.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SECTION 5 - What User Receives */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What You Receive</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Complete transparency with multiple ways to review and share your results
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="h-20 w-20 rounded-2xl bg-gradient-primary mx-auto mb-6 flex items-center justify-center">
                <FileText className="h-10 w-10 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Pay Breakdown</h3>
              <p className="text-muted-foreground">
                A complete award-accurate calculation showing every component of your pay.
              </p>
            </div>

            <div className="text-center">
              <div className="h-20 w-20 rounded-2xl bg-gradient-primary mx-auto mb-6 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Payslip Comparison</h3>
              <p className="text-muted-foreground">
                Enter what you were paid and AwardPay highlights discrepancies automatically.
              </p>
            </div>

            <div className="text-center">
              <div className="h-20 w-20 rounded-2xl bg-gradient-primary mx-auto mb-6 flex items-center justify-center">
                <Download className="h-10 w-10 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Export Options</h3>
              <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  <span>PDF report</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>Email summary</span>
                </div>
                <div className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  <span>Save to account (Pro)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6 - CTA */}
      <section className="py-16 px-6 bg-gradient-to-br from-primary/5 via-accent/5 to-white">
        <div className="container mx-auto max-w-4xl">
          <Card className="border-2 shadow-elevated">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-3xl mb-4">
                Protect Your Earnings with{" "}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  Clarity & Confidence
                </span>
              </CardTitle>
              <CardDescription className="text-base">
                Most underpayments are hidden in small award mistakes on overtime, penalties, and allowances. 
                AwardPay helps Australians protect their rights and earnings with precision and transparency.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button
                size="lg"
                className="bg-gradient-primary text-lg"
                onClick={() => navigate("/auth")}
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg"
                onClick={() => navigate("/")}
              >
                View Pricing
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border/50 bg-white">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>© 2024 AwardPay. Empowering Australian workers with award-accurate pay calculations.</p>
        </div>
      </footer>
    </div>
  );
};

export default HowItWorks;
