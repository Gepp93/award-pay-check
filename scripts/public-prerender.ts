import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Plugin } from "vite";

// Deliberately bounded, signed-out informational content only. Refresh the
// snapshots when these pages change; never capture customer or checker routes.
export const PUBLIC_ROUTES = ["/", "/how-it-works", "/pricing", "/why-awardpay", "/contact", "/employers"] as const;
const MAX_PRERENDER_PAGES = 6;
type PublicPage = { path: string; title: string; description: string; canonical: string; html: string };
const escape = (value: string) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function renderPublicHtml(shell: string, page: PublicPage): string {
  const clean = shell
    .replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, "")
    .replace(/<meta\b[^>]*(?:name|property)=["'](?:description|og:title|og:description|og:url|og:type|twitter:title|twitter:description|twitter:card)["'][^>]*>/gi, "")
    .replace(/<link\b[^>]*rel=["']canonical["'][^>]*>/gi, "");
  const title = escape(page.title), description = escape(page.description), canonical = escape(page.canonical);
  const head = `<title data-rh="true">${title}</title>
<meta data-rh="true" name="description" content="${description}">
<link data-rh="true" rel="canonical" href="${canonical}">
<meta data-rh="true" property="og:title" content="${title}">
<meta data-rh="true" property="og:description" content="${description}">
<meta data-rh="true" property="og:url" content="${canonical}">
<meta data-rh="true" property="og:type" content="website">
<meta data-rh="true" name="twitter:card" content="summary_large_image">
<meta data-rh="true" name="twitter:title" content="${title}">
<meta data-rh="true" name="twitter:description" content="${description}">`;
  return clean.replace("</head>", `${head}\n</head>`).replace('<div id="root"></div>', `<div id="root">${page.html}</div>`);
}

export function publicPrerender(): Plugin {
  return {
    name: "awardpay-public-prerender",
    apply: "build",
    enforce: "post",
    generateBundle(_options, bundle) {
      const index = bundle["index.html"];
      if (!index || index.type !== "asset" || typeof index.source !== "string") throw new Error("Missing built HTML shell");
      const shell = index.source;
      const pages = JSON.parse(readFileSync(resolve("scripts/public-pages.json"), "utf8")) as PublicPage[];
      if (pages.length !== MAX_PRERENDER_PAGES || pages.some((p, i) => p.path !== PUBLIC_ROUTES[i])) throw new Error("Public prerender allowlist mismatch");
      for (const page of pages) {
        if (page.canonical !== `https://www.awardpay.com.au${page.path}`) throw new Error("Invalid public canonical");
        // Vite's emitted image assets have originalFileName pointing to the
        // source import. Never retain dev-only /src/ image URLs in production.
        page.html = page.html.replace(/\/src\/assets\/[^"\s<>]+/g, (url) => {
          const source = url.slice(1);
          const asset = Object.values(bundle).find((entry) => entry.type === "asset" &&
            (entry.originalFileName === source || entry.name === source || entry.name === source.split("/").pop()));
          if (!asset) throw new Error(`Missing public image asset: ${source}`);
          return `/${asset.fileName}`;
        });
        const html = renderPublicHtml(shell, page);
        if (page.path === "/") index.source = html;
        else this.emitFile({ type: "asset", fileName: `${page.path.slice(1)}/index.html`, source: html });
      }
    },
  };
}