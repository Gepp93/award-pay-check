import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Check, AlertCircle } from "lucide-react";
import SEO from "@/components/SEO";
import { ApNav } from "@/components/ApNav";
import { supabase } from "@/integrations/supabase/client";
import { THREE_MONTH_PASS } from "@/lib/plans";
import { startSubscriptionCheckout } from "@/lib/paymentLinks";

function useReveal() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const els = document.querySelectorAll<HTMLElement>("[data-reveal]");
    if (reduced) {
      els.forEach((e) => e.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
}

interface AwardPage {
  slug: string;
  title: string;
  meta_description: string;
  body_json: {
    h1?: string;
    intro?: string[] | string;
    underpayment_signs?: string[];
    rates_note?: string;
    faq?: { q?: string; a?: string }[];
    cta_copy?: string;
  };
  awards: {
    name: string;
    effective_date: string | null;
    rates_json: {
      classifications?: { level?: string; hourly?: number; casual_hourly?: number }[];
    };
  } | null;
}

const bullet = "flex items-start gap-2";
const checkIcon = <Check className="h-4 w-4 mt-1 shrink-0"  />;
const ulCls = "list-none pl-0 text-left space-y-2 mt-4";

const formatCurrency = (n?: number) =>
  typeof n === "number"
    ? new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(n)
    : "—";

const UnderpaidAward = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState<AwardPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ctaLoading, setCtaLoading] = useState(false);

  useReveal();

  useEffect(() => {
    if (!slug) return;

    const fetchPage = async () => {
      const { data, error } = await supabase
        .from("award_pages")
        .select("slug,title,meta_description,body_json,awards(name,effective_date,rates_json)")
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      if (error || !data) {
        setError(error?.message || "Not found");
      } else {
        setPage(data as unknown as AwardPage);
      }
      setLoading(false);
    };

    fetchPage();
  }, [slug]);

  const handleCta = async () => {
    setCtaLoading(true);
    const url = await startSubscriptionCheckout("three_month_pass");
    if (url) {
      window.location.href = url;
    } else {
      setCtaLoading(false);
      navigate("/check");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" >
        Loading…
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <AlertCircle className="h-12 w-12 mb-4"  />
        <h1 className="ap-h1" >Page not found</h1>
        <p className="ap-lede" >
          We couldn't find an award page for "{slug}". It may not be published yet.
        </p>
        <Button className="ap-btn ap-btn-primary" onClick={() => navigate("/")}>
          Back to home
        </Button>
      </div>
    );
  }

  const body = page.body_json || {};
  const intro = Array.isArray(body.intro) ? body.intro : typeof body.intro === "string" ? [body.intro] : [];
  const signs = Array.isArray(body.underpayment_signs) ? body.underpayment_signs : [];
  const faq = Array.isArray(body.faq) ? body.faq : [];
  const rates = page.awards?.rates_json?.classifications || [];
  const hasRates = rates.length > 0;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://www.awardpay.com.au/" },
        { "@type": "ListItem", position: 2, name: page.title, item: `https://www.awardpay.com.au/underpaid/${page.slug}` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq
        .filter((f) => f.q && f.a)
        .map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ];

  return (
    <div className="ap-marketing">
      <SEO
        title={page.title}
        description={page.meta_description}
        path={`/underpaid/${page.slug}`}
        jsonLd={jsonLd}
      />

      <ApNav />

      <section className="ap-wrap ap-home-section" >
        <div className="mx-auto" >
          <div className="ap-eyebrow" data-reveal>Underpaid? Check your payslip</div>
          <h1 className="ap-h1" data-reveal>
            {page.awards?.name || body.h1 || page.title}
          </h1>
          {intro.map((p, i) => (
            <p
              key={i}
              className="ap-lede"
              data-reveal
              
            >
              {p}
            </p>
          ))}
          <Button className="mt-6" onClick={() => navigate("/check")}>Check my payslip</Button>
        </div>
      </section>

      {signs.length > 0 && (
        <section className="ap-wrap ap-home-section" >
          <div className="mx-auto" >
            <h2 className="ap-h2" data-reveal>
              Are you being underpaid?
            </h2>
            <ul className={ulCls}>
              {signs.map((t, i) => (
                <li key={i} className={bullet} data-reveal >
                  {checkIcon}
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="ap-wrap ap-home-section" >
        <div className="mx-auto" >
          <h2 className="ap-h2" data-reveal>
            Key rates — {page.awards?.name || "this award"}
          </h2>

          {hasRates ? (
            <div data-reveal className="overflow-x-auto mt-4">
              <table className="ledger-table">
                <thead>
                  <tr >
                    <th >
                      Classification
                    </th>
                    <th className="text-right">
                      Hourly
                    </th>
                    <th className="text-right">
                      Casual hourly
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rates.map((row, i) => (
                    <tr key={i} >
                      <td >{row.level || "—"}</td>
                      <td className="font-mono text-right">{formatCurrency(row.hourly)}</td>
                      <td className="font-mono text-right">{formatCurrency(row.casual_hourly)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {page.awards?.effective_date && (
                <p className="text-[13px] text-ink-3 mt-3">
                  Rates current from {new Date(page.awards.effective_date).toLocaleDateString("en-AU")}.
                </p>
              )}
            </div>
          ) : (
            <p className="text-left" data-reveal >
              No specific rates are available for this award yet. Check your own payslip to compare your hourly rate.
            </p>
          )}

          {body.rates_note && (
            <p
              className="text-[13px] text-ink-3 mt-4"
              data-reveal
              
            >
              {body.rates_note}
            </p>
          )}
        </div>
      </section>

      {faq.length > 0 && (
        <section className="ap-wrap ap-home-section" >
          <div className="mx-auto" >
            <h2 className="ap-h2" data-reveal>
              Common questions
            </h2>
            <div className="mt-4 space-y-3">
              {faq.map((f, i) => (
                f.q && f.a && (
                  <div
                    key={i}
                    className="border-b border-rule py-5"
                    data-reveal
                    
                  >
                    <h3 >
                      {f.q}
                    </h3>
                    <p >
                      {f.a}
                    </p>
                  </div>
                )
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="ap-wrap ap-home-section" >
        <div className="mx-auto" >
          <h2 className="ap-h2" data-reveal >
            {THREE_MONTH_PASS.name}
          </h2>
          <div data-reveal>
            <Button
              className="ap-btn ap-btn-primary ap-btn-lg"
              onClick={handleCta}
              disabled={ctaLoading}
            >
              {ctaLoading ? "Opening checkout…" : `Get ${THREE_MONTH_PASS.name} — ${THREE_MONTH_PASS.priceLabel}`}
            </Button>
          </div>
          <p
            data-reveal
            
          >
            One payment. Unlimited payslip checks for 90 days.
          </p>
        </div>
      </section>

      <footer className="ap-footer">
        <div className="ap-footer-in">
          <div className="ap-brand">
            <span className="ap-mark" />
            AwardPay
          </div>
          <div className="fine">
            © 2026 AwardPay · Pay checks are estimates based on Fair Work Modern Award data.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default UnderpaidAward;
