/**
 * Build-time prerender for programmatic SEO award pages.
 *
 * Fetches every published award_pages row from Supabase and writes a static
 * dist/underpaid/<slug>/index.html file containing the real page content in
 * the source HTML. React will hydrate over it at runtime.
 *
 * Run via:
 *   npx tsx scripts/prerender-award-pages.ts
 *
 * Environment variables required:
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";

const BASE_URL = "https://www.awardpay.com.au";
const MAX_PAGES = 1000;

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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatCurrency(n?: number) {
  return typeof n === "number"
    ? new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(n)
    : "—";
}

function renderRatesTable(award: AwardPage["awards"]) {
  const rates = award?.rates_json?.classifications || [];
  if (rates.length === 0) {
    return `<p>No specific rates are available for this award yet. Check your own payslip to compare your hourly rate.</p>`;
  }

  const effective = award?.effective_date
    ? `<p style="font-size:13px;color:#6b7a72;margin-top:10px;">Rates current from ${new Date(award.effective_date).toLocaleDateString("en-AU")}.</p>`
    : "";

  const rows = rates
    .map(
      (r) => `
    <tr style="border-top:1px solid #e8e4dc;">
      <td style="padding:12px 16px;color:#353a37;">${escapeHtml(r.level || "—")}</td>
      <td style="padding:12px 16px;text-align:right;font-weight:600;">${formatCurrency(r.hourly)}</td>
      <td style="padding:12px 16px;text-align:right;font-weight:600;">${formatCurrency(r.casual_hourly)}</td>
    </tr>`,
    )
    .join("");

  return `
    <div class="overflow-x-auto mt-4">
      <table style="width:100%;border-collapse:collapse;font-size:15px;line-height:1.5;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e8e4dc;">
        <thead>
          <tr style="background:#e2f0e9;">
            <th style="padding:12px 16px;text-align:left;font-weight:700;color:#1e5d42;">Classification</th>
            <th style="padding:12px 16px;text-align:right;font-weight:700;color:#1e5d42;">Hourly</th>
            <th style="padding:12px 16px;text-align:right;font-weight:700;color:#1e5d42;">Casual hourly</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      ${effective}
    </div>
  `;
}

function renderStaticAwardPage(page: AwardPage, appHtml: string): string {
  const body = page.body_json || {};
  const intro = Array.isArray(body.intro) ? body.intro : typeof body.intro === "string" ? [body.intro] : [];
  const signs = Array.isArray(body.underpayment_signs) ? body.underpayment_signs : [];
  const faq = Array.isArray(body.faq) ? body.faq : [];

  const introHtml = intro
    .map((p) => `<p style="font-size:19px;line-height:1.55;color:#3c423f;max-width:31em;margin:0 auto 16px;">${escapeHtml(p)}</p>`)
    .join("");

  const signsHtml =
    signs.length > 0
      ? `
    <section style="padding:24px 0;">
      <div style="max-width:760px;margin:0 auto;">
        <h2 style="font-size:clamp(22px,2.6vw,28px);text-align:center;margin-bottom:16px;">Are you being underpaid?</h2>
        <ul style="list-style:none;padding:0;font-size:17px;line-height:1.6;color:#353a37;" class="space-y-2 mt-4">
          ${signs
            .map(
              (s) => `
            <li style="display:flex;align-items:flex-start;gap:8px;">
              <span style="color:#1e5d42;flex-shrink:0;">✓</span>
              <span>${escapeHtml(s)}</span>
            </li>`,
            )
            .join("")}
        </ul>
      </div>
    </section>
  `
      : "";

  const faqHtml =
    faq.length > 0
      ? `
    <section style="padding:24px 0;">
      <div style="max-width:760px;margin:0 auto;">
        <h2 style="font-size:clamp(22px,2.6vw,28px);text-align:center;margin-bottom:16px;">Common questions</h2>
        <div style="margin-top:16px;" class="space-y-3">
          ${faq
            .filter((f) => f.q && f.a)
            .map(
              (f) => `
            <div style="background:#fff;border:1px solid #e8e4dc;border-radius:12px;padding:16px 18px;">
              <h3 style="font-size:16px;font-weight:700;margin:0 0 8px;color:#151917;">${escapeHtml(f.q!)}</h3>
              <p style="font-size:15px;line-height:1.55;color:#353a37;margin:0;">${escapeHtml(f.a!)}</p>
            </div>`,
            )
            .join("")}
        </div>
      </div>
    </section>
  `
      : "";

  const ctaCopy = body.cta_copy || "Check your payslip — $10";

  const staticContent = `
    <section style="padding:54px 30px 28px;">
      <div style="max-width:760px;margin:0 auto;text-align:center;">
        <div style="display:inline-flex;align-items:center;gap:8px;background:#e2f0e9;color:#1e5d42;font-weight:600;font-size:13px;padding:7px 13px;border-radius:999px;margin-bottom:24px;">Underpaid? Check your payslip</div>
        <h1 style="font-weight:800;font-size:clamp(40px,5vw,62px);line-height:1.04;letter-spacing:-0.025em;margin:0 0 22px;">${escapeHtml(body.h1 || page.title)}</h1>
        ${introHtml}
      </div>
    </section>

    ${signsHtml}

    <section style="padding:24px 0;">
      <div style="max-width:760px;margin:0 auto;">
        <h2 style="font-size:clamp(22px,2.6vw,28px);text-align:center;margin-bottom:16px;">Pay rates for ${escapeHtml(page.awards?.name || "this award")}</h2>
        ${renderRatesTable(page.awards)}
        ${body.rates_note ? `<p style="font-size:15px;line-height:1.6;color:#6b7a72;margin-top:16px;">${escapeHtml(body.rates_note)}</p>` : ""}
      </div>
    </section>

    ${faqHtml}

    <section style="padding:40px 30px 80px;">
      <div style="max-width:760px;margin:0 auto;text-align:center;">
        <h2 style="margin-bottom:18px;">${escapeHtml(ctaCopy)}</h2>
        <a href="/check" style="display:inline-flex;align-items:center;justify-content:center;gap:8px;background:#d4a72c;color:#2a2205;font-weight:700;font-size:16px;text-decoration:none;border-radius:11px;padding:15px 26px;">${escapeHtml(ctaCopy)}</a>
        <p style="font-size:14px;color:#6b7a72;margin-top:14px;">One-time payment. Unlimited checks for 12 months.</p>
      </div>
    </section>
  `;

  return appHtml.replace('<div id="root"></div>', `<div id="root">${staticContent}</div>`);
}

async function main() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
    process.exit(1);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data, error } = await supabase
    .from("award_pages")
    .select("slug,title,meta_description,body_json,awards(name,effective_date,rates_json)")
    .eq("status", "published")
    .limit(MAX_PAGES);

  if (error) {
    console.error("Supabase error:", error.message);
    process.exit(1);
  }

  const pages = (data || []) as unknown as AwardPage[];
  const indexHtmlPath = resolve(process.cwd(), "dist", "index.html");
  let indexHtml: string;

  try {
    indexHtml = readFileSync(indexHtmlPath, "utf-8");
  } catch {
    console.error(`Could not read ${indexHtmlPath}. Run the build first.`);
    process.exit(1);
  }

  let written = 0;
  for (const page of pages) {
    const pageUrl = `${BASE_URL}/underpaid/${page.slug}`;
    let pageHtml = indexHtml
      .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(page.title)}</title>`)
      .replace(
        /<meta name="description" content="[^"]*">/,
        `<meta name="description" content="${escapeHtml(page.meta_description)}">`,
      )
      .replace(
        /<meta property="og:title" content="[^"]*">/,
        `<meta property="og:title" content="${escapeHtml(page.title)}">`,
      )
      .replace(
        /<meta property="og:description" content="[^"]*">/,
        `<meta property="og:description" content="${escapeHtml(page.meta_description)}">`,
      )
      .replace(
        /<meta property="og:url" content="[^"]*">/,
        `<meta property="og:url" content="${pageUrl}">`,
      )
      .replace(
        /<meta name="twitter:title" content="[^"]*">/,
        `<meta name="twitter:title" content="${escapeHtml(page.title)}">`,
      )
      .replace(
        /<meta name="twitter:description" content="[^"]*">/,
        `<meta name="twitter:description" content="${escapeHtml(page.meta_description)}">`,
      );

    // Inject canonical if not present in the shell.
    if (!pageHtml.includes('<link rel="canonical"')) {
      pageHtml = pageHtml.replace(
        "</head>",
        `  <link rel="canonical" href="${pageUrl}">\n  </head>`,
      );
    } else {
      pageHtml = pageHtml.replace(
        /<link rel="canonical" href="[^"]*">/,
        `<link rel="canonical" href="${pageUrl}">`,
      );
    }

    const finalHtml = renderStaticAwardPage(page, pageHtml);
    const outPath = resolve(process.cwd(), "dist", "underpaid", page.slug, "index.html");
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, finalHtml, "utf-8");
    written++;
  }

  console.log(`Prerendered ${written} award pages to dist/underpaid/`);
}

main();
