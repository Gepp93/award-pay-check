import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { PUBLIC_ROUTES, publicPrerender } from "../scripts/public-prerender";

test("prerender emits only the six approved informational routes", () => {
  expect([...PUBLIC_ROUTES]).toEqual(["/", "/how-it-works", "/pricing", "/why-awardpay", "/contact", "/employers"]);
  const bundle: any = { "index.html": { type: "asset", source: readFileSync("index.html", "utf8") } };
  for (const name of ["construction", "hospitality", "retail", "healthcare", "manufacturing", "transport", "agriculture", "education"]) {
    bundle[name] = { type: "asset", name: `${name}.jpg`, fileName: `assets/${name}-test.jpg` };
  }
  const emitted: string[] = [];
  const hook = publicPrerender().generateBundle;
  if (typeof hook !== "function") throw new Error("Missing prerender hook");
  hook.call({ emitFile: (asset: any) => { emitted.push(asset.fileName); return asset.fileName; } } as any, {} as any, bundle, false);
  expect(emitted).toEqual(["how-it-works/index.html", "pricing/index.html", "why-awardpay/index.html", "contact/index.html", "employers/index.html"]);
});