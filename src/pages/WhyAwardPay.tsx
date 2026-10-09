import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
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

function CountUp({ to, duration = 1200 }: { to: number; duration?: number }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { setVal(to); return; }
    const node = ref.current;
    if (!node) return;
    let started = false;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting && !started) {
          started = true;
          io.unobserve(e.target);
          const start = performance.now();
          const tick = (now: number) => {
            const p = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            setVal(Math.round(to * eased));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      });
    }, { threshold: 0.4 });
    io.observe(node);
    return () => io.disconnect();
  }, [to, duration]);
  return <span ref={ref}>${val.toLocaleString()}</span>;
}

const bullet = "flex items-start gap-2";
const checkIcon = <Check className="h-4 w-4 mt-1 shrink-0"  />;
const ulCls = "list-none pl-0 text-left space-y-2 mt-4";

const WhyAwardPay = () => {
  const navigate = useNavigate();
  const start = () => navigate("/check");
  useReveal();

  const problems = [
    "Modern Awards are complex: hundreds of rates, penalties and allowances",
    "Penalties change by the day and the time of day",
    "Small errors in overtime or allowances quietly add up over months",
    "Most workers never realise they've been short-changed",
  ];
  const does = [
    "Reads your payslip in about a minute",
    "Checks it against official Fair Work Commission rates",
    "Flags any missing penalties, overtime or allowances",
    "Shows you exactly what you may be owed",
  ];

  return (
    <div className="ap-marketing">
      <SEO
        title="Why AwardPay — know exactly what you're owed"
        description="Modern Awards are complex. AwardPay reads your payslip and checks it against official Fair Work rates, so you know exactly what you're owed."
        path="/why-awardpay"
      />

      <ApNav />

      <section className="ap-wrap ap-home-section" >
        <div className="mx-auto" >
          <div className="ap-eyebrow" data-reveal>Why AwardPay</div>
          <h1 className="ap-h1" data-reveal>
            Why AwardPay <span className="">exists</span>
          </h1>
          <p className="ap-lede" data-reveal >
            Working out your correct pay under a Modern Award shouldn't take a law degree.
            We make it simple — so you know exactly what you're owed.
          </p>
        </div>
      </section>

      <section className="ap-wrap ap-home-section" >
        <div className="mx-auto" >
          <h2 className="ap-h2" data-reveal>The problem</h2>
          <ul className={ulCls}>
            {problems.map((t, i) => (
              <li key={i} className={bullet} data-reveal >
                {checkIcon}<span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Focal stat — TODO: replace with cited source before publishing */}
      <section className="ap-wrap ap-home-section" >
        <div className="mx-auto" >
          <div className="ap-home-price" data-reveal>
            <CountUp to={1542} />
          </div>
          <div data-reveal >
            lost by the average underpaid worker each year
          </div>
        </div>
      </section>

      <section className="ap-wrap ap-home-section" >
        <div className="mx-auto" >
          <h2 className="ap-h2" data-reveal>What AwardPay does</h2>
          <ul className={ulCls}>
            {does.map((t, i) => (
              <li key={i} className={bullet} data-reveal >
                {checkIcon}<span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="ap-wrap ap-home-section" >
        <div className="mx-auto" >
          <h2 className="ap-h2" data-reveal>Where our data comes from</h2>
          <p className="text-left" data-reveal >
            Built on the Fair Work Commission's official Modern Award data, updated as rates change.
            AwardPay is an interpretation tool, not legal advice.
          </p>
        </div>
      </section>

      <section className="ap-wrap ap-home-section" >
        <div className="mx-auto" >
          <h2 className="ap-h2" data-reveal>Who it's for</h2>
          <p className="text-left" data-reveal >
            Any role under a Modern Award — retail, hospitality, construction, health, trades,
            cleaning, support work and more.
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

export default WhyAwardPay;