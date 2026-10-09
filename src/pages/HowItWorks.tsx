import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Camera, Scale, DollarSign } from "lucide-react";
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

const ulCls = "list-none pl-0 text-left space-y-2 mt-4";


const HowItWorks = () => {
  const navigate = useNavigate();
  const start = () => navigate("/check");
  useReveal();

  const steps = [
    "Snap your payslip — a photo or PDF",
    "We match the right award and pull live Fair Work rates",
    "See what you're owed, line by line",
  ];
  const checks = [
    "Ordinary hours and overtime",
    "Saturday, Sunday, public holiday and night penalties",
    "Meal, travel, tool and site allowances",
    "RDO accrual and broken / split shifts",
  ];

  return (
    <div className="ap-marketing">
      <SEO
        title="How AwardPay checks your pay"
        description="We turn your payslip into an award-accurate breakdown using real Fair Work rates — penalties, overtime and allowances included."
        path="/how-it-works"
      />

      <ApNav />

      <section className="ap-wrap ap-home-section" >
        <div className="mx-auto" >
          <div className="ap-eyebrow" data-reveal>How it works</div>
          <h1 className="ap-h1" data-reveal>
            How AwardPay checks your <span className="">pay</span>
          </h1>
          <p className="ap-lede" data-reveal >
            We turn your payslip into an award-accurate breakdown using real Fair Work rates.
          </p>
        </div>
      </section>

      <section className="ap-wrap ap-home-section" >
        <div className="mx-auto" >
          <h2 className="ap-h2" data-reveal>Three steps</h2>
          <ol className="ap-steps">
            {steps.map((t, i) => (
              <li key={i} className="ap-step flex items-start gap-3" data-reveal >
                <span
                  className="num shrink-0"
                  
                >{String(i + 1).padStart(2, "0")}</span>
                <div><div className="ap-step-snippet">{i === 0 ? <Camera size={24} /> : i === 1 ? <Scale size={24} /> : <DollarSign size={24} />}</div><h3>{t}</h3></div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="ap-wrap ap-home-section" >
        <div className="mx-auto" >
          <h2 className="ap-h2" data-reveal>What we check</h2>
          <ul className={ulCls}>
            {checks.map((t, i) => (
              <li key={i} className="flex items-start gap-2" data-reveal >
                <Check className="h-4 w-4 mt-1 shrink-0"  />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="ap-wrap ap-home-section" >
        <div className="mx-auto" >
          <p className="text-left" data-reveal >
            AwardPay is an interpretation tool based on official Fair Work data, not legal advice.
          </p>
        </div>
      </section>

      <section className="ap-wrap ap-home-section" >
        <div className="mx-auto" >
          <h2 className="ap-h2" data-reveal >See what you're owed</h2>
          <div data-reveal>
            <Button className="ap-btn ap-btn-primary ap-btn-lg" onClick={start}>
              Check my payslip — free
            </Button>
          </div>
        </div>
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

export default HowItWorks;