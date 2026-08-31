import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Check, AlertCircle } from "lucide-react";
import SEO from "@/components/SEO";
import { ApNav } from "@/components/ApNav";
import { supabase } from "@/integrations/supabase/client";
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
const checkIcon = <Check className="h-4 w-4 mt-1 shrink-0" style={{ color: "hsl(var(--primary))" }} />;
const ulCls = "list-none pl-0 text-left space-y-2 mt-4";
const ulStyle = { fontSize: 17, lineHeight: 1.6, color: "hsl(150 6% 22%)" } as const;
const h2Style = { fontSize: "clamp(22px, 2.6vw, 28px)" } as const;

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
    const url = await startSubscriptionCheckout("yearly_access");
    if (url) {
      window.location.href = url;
    } else {
      setCtaLoading(false);
      navigate("/check");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ color: "hsl(var(--muted-foreground))" }}>
        Loading…
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <AlertCircle className="h-12 w-12 mb-4" style={{ color: "hsl(var(--muted-foreground))" }} />
        <h1 className="ap-h1 text-center" style={{ fontSize: 32 }}>Page not found</h1>
        <p className="ap-lede text-center" style={{ marginBottom: 24 }}>
          We couldn't find an award page for "{slug}". It may not be published yet.
        </p>
        <button className="ap-btn ap-btn-gold" onClick={() => navigate("/")}>
          Back to home
        </button>
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
    <div>
      <SEO
        title={page.title}
        description={page.meta_description}
        path={`/underpaid/${page.slug}`}
        jsonLd={jsonLd}
      />

      <ApNav />

      <section className="ap-wrap ap-section" style={{ paddingBottom: 28 }}>
        <div className="mx-auto text-center" style={{ maxWidth: 760 }}>
          <div className="ap-eyebrow" data-reveal>Underpaid? Check your payslip</div>
          <h1 className="ap-h1 text-center" data-reveal>
            {body.h1 || page.title}
          </h1>
          {intro.map((p, i) => (
            <p
              key={i}
              className="ap-lede text-center"
              data-reveal
              style={{ marginBottom: i === intro.length - 1 ? 0 : 16, maxWidth: "none" }}
            >
              {p}
            </p>
          ))}
        </div>
      </section>

      {signs.length > 0 && (
        <section className="ap-wrap" style={{ paddingTop: 24, paddingBottom: 24 }}>
          <div className="mx-auto" style={{ maxWidth: 760 }}>
            <h2 className="ap-h2 text-center" data-reveal style={h2Style}>
              Are you being underpaid?
            </h2>
            <ul className={ulCls} style={ulStyle}>
              {signs.map((t, i) => (
                <li key={i} className={bullet} data-reveal style={{ transitionDelay: `${i * 80}ms` }}>
                  {checkIcon}
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="ap-wrap" style={{ paddingTop: 24, paddingBottom: 24 }}>
        <div className="mx-auto" style={{ maxWidth: 760 }}>
          <h2 className="ap-h2 text-center" data-reveal style={h2Style}>
            Pay rates for {page.awards?.name || "this award"}
          </h2>

          {hasRates ? (
            <div data-reveal className="overflow-x-auto mt-4">
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 15,
                  lineHeight: 1.5,
                  background: "#fff",
                  borderRadius: 12,
                  overflow: "hidden",
                  border: "1px solid hsl(var(--border))",
                }}
              >
                <thead>
                  <tr style={{ background: "hsl(var(--primary-soft))" }}>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "hsl(var(--primary))" }}>
                      Classification
                    </th>
                    <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: "hsl(var(--primary))" }}>
                      Hourly
                    </th>
                    <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: "hsl(var(--primary))" }}>
                      Casual hourly
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rates.map((row, i) => (
                    <tr key={i} style={{ borderTop: "1px solid hsl(var(--border))" }}>
                      <td style={{ padding: "12px 16px", color: "hsl(150 6% 22%)" }}>{row.level || "—"}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600 }}>{formatCurrency(row.hourly)}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600 }}>{formatCurrency(row.casual_hourly)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {page.awards?.effective_date && (
                <p
                  style={{
                    fontSize: 13,
                    color: "hsl(var(--muted-foreground))",
                    marginTop: 10,
                    marginBottom: 0,
                  }}
                >
                  Rates current from {new Date(page.awards.effective_date).toLocaleDateString("en-AU")}.
                </p>
              )}
            </div>
          ) : (
            <p className="text-center" data-reveal style={{ fontSize: 17, lineHeight: 1.6, color: "hsl(150 6% 22%)", margin: "16px 0 0" }}>
              No specific rates are available for this award yet. Check your own payslip to compare your hourly rate.
            </p>
          )}

          {body.rates_note && (
            <p
              className="text-left"
              data-reveal
              style={{ fontSize: 15, lineHeight: 1.6, color: "hsl(var(--muted-foreground))", margin: "16px 0 0" }}
            >
              {body.rates_note}
            </p>
          )}
        </div>
      </section>

      {faq.length > 0 && (
        <section className="ap-wrap" style={{ paddingTop: 24, paddingBottom: 24 }}>
          <div className="mx-auto" style={{ maxWidth: 760 }}>
            <h2 className="ap-h2 text-center" data-reveal style={h2Style}>
              Common questions
            </h2>
            <div className="mt-4 space-y-3">
              {faq.map((f, i) => (
                f.q && f.a && (
                  <div
                    key={i}
                    data-reveal
                    style={{
                      background: "#fff",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 12,
                      padding: "16px 18px",
                    }}
                  >
                    <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 8px", color: "hsl(var(--foreground))" }}>
                      {f.q}
                    </h3>
                    <p style={{ fontSize: 15, lineHeight: 1.55, color: "hsl(150 6% 22%)", margin: 0 }}>
                      {f.a}
                    </p>
                  </div>
                )
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="ap-wrap" style={{ paddingTop: 40, paddingBottom: 80 }}>
        <div className="mx-auto text-center" style={{ maxWidth: 760 }}>
          <h2 className="ap-h2 text-center" data-reveal style={{ marginBottom: 18 }}>
            {body.cta_copy || "Check your payslip for $10"}
          </h2>
          <div data-reveal>
            <button
              className="ap-btn ap-btn-gold ap-btn-lg"
              onClick={handleCta}
              disabled={ctaLoading}
            >
              {ctaLoading ? "Opening checkout…" : body.cta_copy || "Check your payslip — $10"}
            </button>
          </div>
          <p
            data-reveal
            style={{ fontSize: 14, color: "hsl(var(--muted-foreground))", marginTop: 14 }}
          >
            One-time payment. Unlimited checks for 12 months.
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
