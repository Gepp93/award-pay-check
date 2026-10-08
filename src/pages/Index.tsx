import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import SEO from "@/components/SEO";
import { ApNav } from "@/components/ApNav";
import { supabase } from "@/integrations/supabase/client";
import { startSubscriptionCheckout } from "@/lib/paymentLinks";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { UploadCloud, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { preloadPayslip } from "@/lib/pendingPayslip";


const PayslipStage = () => (
  <div className="ap-stage" aria-hidden="true">
    {/* Scan card (top left, rotated) */}
    <div className="ap-float ap-scan">
      <div className="ap-scan-head">
        <div className="ap-scan-ic">📄</div>
        <div className="ap-scan-t">
          payslip_june.jpg
          <span>AI reading… done ✓</span>
        </div>
      </div>
      <div className="ph m"></div>
      <div className="ph s"></div>
      <div className="ph m"></div>
      <div className="ph s"></div>
    </div>

    {/* Ledger card */}
    <div className="ap-float ap-ledger">
      <div className="ap-ledger-perf"></div>
      <div className="ap-ledger-in">
        <div className="ap-l-head">
          <div className="ap-l-title">Pay check</div>
          <div className="ap-l-week">WK ENDING 14 JUN</div>
        </div>
        <div className="ap-l-sub">Casual · General Retail</div>

        <div className="ap-lrow">
          <div className="lab">
            Ordinary hours
            <span className="sub">30h @ $27.42</span>
          </div>
          <div className="ap-lamt ok">PAID ✓</div>
        </div>

        <div className="ap-lrow">
          <div className="lab">
            <span className="miss">MISSING</span>
            <br />
            Saturday penalty (+25%)
          </div>
          <div className="ap-lamt add">+ $41.13</div>
        </div>

        <div className="ap-lrow">
          <div className="lab">
            <span className="miss">MISSING</span>
            <br />
            Evening loading
          </div>
          <div className="ap-lamt add">+ $13.71</div>
        </div>

        <div className="ap-lrow">
          <div className="lab">
            <span className="miss">MISSING</span>
            <br />
            Meal allowance
          </div>
          <div className="ap-lamt add">+ $21.30</div>
        </div>

        <div className="ap-l-total">
          <div className="tl">This week</div>
          <div className="tn">
            +$76.14
          </div>
        </div>
      </div>
    </div>

    {/* Floating chips */}
    <div className="ap-chip ap-chip-found">
      <span className="c">✓</span>
      Underpayment found
    </div>

    <div className="ap-chip ap-chip-pen">
      <span className="pd"></span>
      Saturday penalty <span className="pa">+$41.13</span>
    </div>
  </div>
);

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const startCheck = () => navigate("/check");
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const openFile = (file?: File) => {
    if (!file) return;
    if (!/\.(pdf|jpe?g|png|heic|heif)$/i.test(file.name) && !["application/pdf", "image/jpeg", "image/png", "image/heic", "image/heif"].includes(file.type)) {
      toast.error("Please choose a PDF, JPG or PNG payslip.");
      return;
    }
    preloadPayslip(file);
    startCheck();
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUser({ id: user.id, email: user.email });
    });
  }, []);

  const handleYearlyCheckout = async () => {
    if (checkingOut) return;
    setCheckingOut(true);
    try {
      const url = await startSubscriptionCheckout("yearly_access", user?.email, user?.id);
      if (url) {
        window.location.href = url;
      } else {
        toast.error("Could not start checkout — please try again.");
      }
    } finally {
      setCheckingOut(false);
    }
  };

  return (

    <div className="ap-home">
      <SEO
        title="Am I Being Underpaid? Free Award Pay Check | AwardPay"
        description="Check Australian award pay in 60 seconds. 1 in 5 workers lose $1,542/year on penalty rates, overtime and allowances."
        path="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "AwardPay Calculator",
          applicationCategory: "FinanceApplication",
          operatingSystem: "Web",
          url: "https://www.awardpay.com.au/",
          description:
            "Free Australian award pay checker that reads your payslip and compares it to Fair Work Modern Awards.",
          offers: { "@type": "Offer", price: "0", priceCurrency: "AUD" },
        }}
      />

      {/* Nav */}
      <ApNav />

      {/* Hero */}
      <header className="ap-wrap ap-hero">
        <div>
          <div className="ap-pill">
            <span className="d" />
            Free award pay check
          </div>
          <h1 className="ap-h1">
            Are you being <span className="ap-hl">underpaid?</span>
          </h1>
          <p className="ap-lede">
            One in five Australian workers are short-changed on penalty rates, overtime and
            allowances — on average <strong>$1,542 a year</strong>. Snap a photo of your payslip
            and we'll check it against the official Fair Work rates in about a minute.
          </p>
          <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.heic,.heif" className="hidden" aria-label="Upload your payslip" onChange={(event) => openFile(event.target.files?.[0])} />
          <Button variant="outline" className={`ap-home-upload rounded-lg ${dragging ? "is-dragging" : ""}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => { event.preventDefault(); setDragging(false); openFile(event.dataTransfer.files[0]); }}>
            <UploadCloud aria-hidden="true" />
            <span>Drop your payslip or take a photo<small>PDF / JPG / PNG</small></span>
          </Button>
          <div className="ap-cta-row">
            <Button variant="ghost" className="ap-btn ap-btn-primary ap-btn-lg" onClick={startCheck}>
              Check my payslip — free
            </Button>
            <a href="/how-it-works" className="ap-btn ap-btn-outline ap-btn-lg">
              See how it works
            </a>
          </div>
          <div className="ap-trust">
            <span>
              <span className="ap-tick">✓</span>Official Fair Work rates
            </span>
            <span>
              <span className="ap-tick">✓</span>No account needed
            </span>
            <span>
              <span className="ap-tick">✓</span>Your payslip is never stored
            </span>
          </div>
        </div>
        <PayslipStage />
      </header>

      {/* How it works */}

      <section className="ap-wrap ap-section">
        <div className="ap-eyebrow">How it works</div>
        <h2 className="ap-h2">Three steps. About a minute.</h2>
        <p className="ap-sub">
          No spreadsheets, no award-code hunting. Show us your payslip and we do the rest.
        </p>
        <div className="ap-steps">
          <div className="ap-step">
            <div className="ap-step-snippet"><UploadCloud className="h-7 w-7" /><span>payslip.pdf</span><CheckCircle2 className="h-4 w-4" /></div><div className="num">1</div>
            <h3>Snap your payslip</h3>
            <p>Take a photo or upload a PDF. Our reader pulls out your hours, rate, allowances and pay period.</p>
          </div>
          <div className="ap-step">
            <div className="ap-step-snippet"><span className="ap-award-chip"><CheckCircle2 className="h-4 w-4" /> General Retail Award</span></div><div className="num">2</div>
            <h3>We check the official rates</h3>
            <p>We match your role to the right modern award and compare your pay against live Fair Work Commission rates.</p>
          </div>
          <div className="ap-step">
            <div className="ap-step-snippet ap-result-snippet"><span>Saturday penalty</span><strong>+$41.13</strong></div><div className="num">3</div>
            <h3>See what you're owed</h3>
            <p>A clear, line-by-line breakdown of any missing penalties, overtime or allowances — ready to act on.</p>
          </div>
        </div>
      </section>

      {/* Credibility band */}
      <section className="ap-wrap ap-section">
        <div className="ap-band">
          <div>
            <h2>Built on the official source of truth</h2>
            <p>
              Your pay is checked against live data from the Fair Work Commission — the same modern award rates,
              penalties and allowances that legally apply to your job. Calculated from official Fair Work rates.
            </p>
          </div>
          <div className="creds">
            <div className="cred">
              <span className="cb">✓</span>Live Fair Work Commission rates
            </div>
            <div className="cred">
              <span className="cb">✓</span>Your payslip is read, then discarded
            </div>
            <div className="cred">
              <span className="cb">✓</span>Free to check — no account required
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="ap-wrap ap-section">
        <div className="ap-stats">
          <div className="ap-stat">
            <div className="n">$1.35B</div>
            <div className="l">Recovered for underpaid workers by the Fair Work Ombudsman in a single year</div>
            <a className="ap-stat-source" href="#">Source: Fair Work Ombudsman</a>
          </div>
          <div className="ap-stat">
            <div className="n">1 in 5</div>
            <div className="l">Young Australian workers report being paid below the lawful minimum</div>
            <a className="ap-stat-source" href="#">Source: worker research</a>
          </div>
          <div className="ap-stat">
            <div className="n">$1,542</div>
            <div className="l">Average amount an underpaid worker loses across a year</div>
            <a className="ap-stat-source" href="#">Source: underpayment research</a>
          </div>
        </div>
      </section>

      <section className="ap-wrap ap-section" aria-labelledby="home-pricing-title">
        <div className="ap-home-pricing">
          <div className="ap-eyebrow">Pricing</div>
          <h2 id="home-pricing-title" className="ap-h2">A simple check. A clear price.</h2>
          <div className="ap-home-pricing-grid">
            <div className="ap-home-tier">
              <h3><span>First check</span> — Free</h3>
              <div className="ap-home-price">$0</div>
              <p>Find out whether your payslip adds up.</p>
              <ul><li>One payslip check</li><li>Official Fair Work rates</li><li>No account needed</li></ul>
              <Button variant="outline" className="ap-btn ap-btn-outline" onClick={startCheck}>Check my payslip — free</Button>
            </div>
            <div className="ap-home-tier ap-home-tier-paid">
              <span className="ap-home-best-value">BEST VALUE</span>
              <h3><span>12 months unlimited</span> — $10</h3>
              <div className="ap-home-price">$10<small> / 12 months</small></div>
              <p>Check any payslip, anytime, for a full year.</p>
              <ul><li>Unlimited payslip checks</li><li>AI underpayment detection</li><li>One payment — no subscription</li></ul>
              <Button variant="ghost" className="ap-btn ap-btn-primary" onClick={handleYearlyCheckout} disabled={checkingOut}>
                {checkingOut ? "Opening checkout…" : "Get 12 months for $10 →"}
              </Button>
              <p className="ap-home-price-note">Launch price. Prices in AUD.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="ap-wrap ap-section" aria-labelledby="home-faq-title">
        <div className="ap-home-faq">
          <div className="ap-eyebrow">FAQ</div>
          <h2 id="home-faq-title" className="ap-h2">Your questions, answered.</h2>
          <Accordion type="single" collapsible>
            {[
              ["Is this legal advice?", "No. AwardPay is a pay-checking and interpretation tool, not legal advice. Confirm your entitlements with the Fair Work Ombudsman, your union or a qualified adviser before making a claim."],
              ["Which awards are covered?", "You can search for your modern award in the checker. Coverage depends on the award and classification data available. If you cannot find yours, confirm it with the Fair Work Ombudsman."],
              ["What happens to my payslip?", "Your payslip is sent to an AI service to read your pay details, then discarded. The payslip file is not stored by AwardPay; extracted details may be included in your saved report."],
              ["What if I'm underpaid?", "Review the breakdown and check that your role, hours and employment type are correct. Keep your payslips and speak to your employer. If you need more help, contact the Fair Work Ombudsman or your union."],
              ["What does the $10 include?", "One payment gives you 12 months of unlimited payslip checks with the AI Payslip Checker and underpayment detection. It is not a recurring subscription."]
            ].map(([question, answer], index) => (
              <AccordionItem key={question} value={`faq-${index}`}>
                <AccordionTrigger className="text-left gap-4">{question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">{answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="ap-wrap ap-final">
        <h2>Find out what you're owed</h2>
        <p>It takes about a minute and costs nothing. You might be surprised.</p>
        <Button variant="ghost" className="ap-btn ap-btn-primary ap-btn-lg" onClick={startCheck}>
          Check my payslip — free
        </Button>
      </section>

      {/* Footer */}
      <footer className="ap-footer">
        <div className="ap-footer-in">
          <div className="ap-brand">
            <span className="ap-mark" />
            AwardPay
          </div>
          <nav className="ap-home-footer-links" aria-label="Footer">
            <a href="#" onClick={(event) => { event.preventDefault(); toast.info("Privacy Policy is not available yet."); }}>Privacy Policy</a>
            <a href="#" onClick={(event) => { event.preventDefault(); toast.info("Terms are not available yet."); }}>Terms</a>
            <Link to="/contact">Contact</Link>
          </nav>
          <div className="fine">
            <div>ABN: pending confirmation</div>
            © 2026 AwardPay · Pay checks are estimates based on Fair Work Modern Award data. Confirm before lodging a claim.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
