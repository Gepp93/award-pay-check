import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import SEO from "@/components/SEO";
import { ApNav } from "@/components/ApNav";

function useReveal() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const els = document.querySelectorAll<HTMLElement>("[data-reveal]");
    if (reduced) { els.forEach(e => e.classList.add("is-visible")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.15 });
    els.forEach(e => io.observe(e));
    return () => io.disconnect();
  }, []);
}

type Tier = {
  name: string;
  price: string;
  priceSuffix?: string;
  who: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
};

const tiers: Tier[] = [
  {
    name: "Free",
    price: "$0",
    who: "See if you're underpaid",
    features: [
      "Snap one payslip",
      "We check it against official Fair Work rates",
      "See your headline result: roughly how much you may be owed, and how many issues we found",
      "No account needed",
    ],
    cta: "Check my payslip — free",
  },
  {
    name: "Full report",
    price: "$10",
    priceSuffix: "one-time",
    who: "Find out exactly what's missing and how to claim it",
    features: [
      "Everything in Free",
      "Every missing penalty, loading and allowance — itemised, with amounts",
      "Your total owed for that pay period",
      "Step-by-step instructions to recover it",
      "Downloadable PDF report",
    ],
    cta: "Check my payslip",
    highlighted: true,
  },
  {
    name: "Back-pay pack",
    price: "$30",
    priceSuffix: "one-time",
    who: "Build your full claim across multiple payslips",
    features: [
      "Everything in Full report",
      "Up to 5 payslips checked",
      "Combined into one total back-pay figure",
      "A single claim summary with recovery steps for the whole period",
    ],
    cta: "Check my payslip",
  },
];

const Pricing = () => {
  const navigate = useNavigate();
  const start = () => navigate("/check");
  useReveal();

  return (
    <div className="ap-marketing">
      <SEO
        title="Pricing — Free pay check, pay only if you're owed | AwardPay"
        description="Checking your pay is always free. Pay only once you've seen what you're owed. $10 Full report, $30 Back-pay pack. Prices in AUD."
        path="/pricing"
      />

      <ApNav />

      <section className="ap-wrap ap-home-section" >
        <div className="mx-auto" >
          <div className="ap-eyebrow" data-reveal>Pricing</div>
          <h1 className="ap-h1" data-reveal>
            Simple pricing. Pay only when it's <span className="">worth&nbsp;it</span>.
          </h1>
          <p className="ap-lede" data-reveal >
            Checking your pay is always free. You only pay once you've seen what you're owed.
          </p>
        </div>
      </section>

      <section className="ap-wrap ap-home-section" >
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          
        >
          {tiers.map((t, i) => {
            const highlighted = t.highlighted;
            return (
              <div
                key={t.name}
                className={`ap-home-tier ${highlighted ? "ap-home-tier-paid" : ""}`}
                data-reveal
                
              >
                {highlighted && (
                  <div className="ap-home-best-value">
                    Most popular
                  </div>
                )}

                <h3>
                  {t.name}
                </h3>

                <div >
                  <span className="ap-home-price">
                    {t.price}
                  </span>
                  {t.priceSuffix && (
                    <span >
                      {t.priceSuffix}
                    </span>
                  )}
                </div>

                <p >
                  {t.who}
                </p>

                <ul className="list-none pl-0 text-left" >
                  {t.features.map((f, j) => (
                    <li key={j} >
                      <Check className="hidden"  />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={highlighted ? "default" : "secondary"} className="w-full mt-6"
                  onClick={start}
                  
                >
                  {t.cta}
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="ap-wrap ap-home-section" >
        <p
          className="text-center"
          data-reveal
          
        >
          Every check starts free — you only pay once you've seen what you're owed. Prices in AUD.
          Your payslip is read, then discarded. AwardPay is an interpretation tool, not legal advice.
        </p>
      </section>

      <footer className="ap-footer">
        <div className="ap-footer-in">
          <div className="ap-brand"><span className="ap-mark" />AwardPay</div>
          <div className="fine">© 2026 AwardPay · Pay checks are estimates based on Fair Work Modern Award data.</div>
        </div>
      </footer>

    </div>
  );
};

export default Pricing;
