/**
 * Build-time sitemap generator.
 * Reads published award_pages from Supabase and writes public/sitemap.xml.
 *
 * Run via:
 *   npx tsx scripts/generate-sitemap.ts
 *
 * Environment variables required:
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { writeFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";


function loadDotEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env"), "utf-8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch { /* no .env; rely on the environment */ }
}

const BASE_URL = "https://www.awardpay.com.au";

const staticPaths = [
  { path: "/", priority: "1.0" },
  { path: "/why-awardpay", priority: "0.8" },
  { path: "/how-it-works", priority: "0.8" },
  { path: "/pricing", priority: "0.8" },
  { path: "/contact", priority: "0.6" },
  { path: "/check", priority: "0.9" },
];

async function main() {
  loadDotEnv();
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn("Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY; %s.", "keeping the existing public/sitemap.xml");
    process.exit(0);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data, error } = await supabase
    .from("award_pages")
    .select("slug")
    .eq("status", "published")
    .limit(1000);

  if (error) {
    console.warn("Could not load award pages (%s); %s.", error.message, "keeping the existing public/sitemap.xml");
    process.exit(0);
  }

  const awardSlugs = (data || []).map((row) => row.slug as string);

  const urls = [
    ...staticPaths.map((p) => ({ loc: `${BASE_URL}${p.path}`, priority: p.priority })),
    ...awardSlugs.map((slug) => ({ loc: `${BASE_URL}/underpaid/${slug}`, priority: "0.7" })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`;

  const outPath = resolve(process.cwd(), "public", "sitemap.xml");
  writeFileSync(outPath, xml, "utf-8");
  console.log(`Wrote ${urls.length} URLs (${awardSlugs.length} award pages) to ${outPath}`);
}

main();
