/**
 * Production-surface verification for Campus Circle: checks the headers and the rendering that
 * a dev server cannot show you.
 *
 *   npm run build && npm run start      # then, in another shell
 *   npm run verify:prod
 *   CC_URL=https://your-app.vercel.app npm run verify:prod
 *
 * Why this exists: the CSP carries no 'unsafe-inline' for scripts, which is only correct as
 * long as every request also carries a nonce for the App Router's own inline bootstrap
 * scripts. Get that wrong and the site does not fail loudly — it serves HTTP 200 with a body
 * full of markup and paints a blank white page. Headers checked in isolation would have
 * passed. So the last checks here drive a real browser and assert that a visitor can actually
 * see words, that nothing was blocked, and that client-side navigation still works.
 *
 * Needs no database: everything below is about the edge surface and first paint. Needs
 * playwright-core (or playwright) and a Chromium binary; point CC_PLAYWRIGHT at a playwright
 * install anywhere on disk if it is not in this project's node_modules, and CC_CHROME at the
 * browser executable.
 */
import { createRequire } from "node:module";
import { existsSync } from "node:fs";

const require = createRequire(import.meta.url);

function loadChromium() {
  const candidates = [process.env.CC_PLAYWRIGHT, "playwright-core", "playwright"].filter(Boolean);
  for (const c of candidates) {
    try {
      return require(c).chromium;
    } catch {
      /* try the next one */
    }
  }
  console.error("Playwright is not installed here. Run: npm i -D playwright-core");
  console.error("Or set CC_PLAYWRIGHT to a playwright-core directory or module id.");
  process.exit(2);
}

function chromePath() {
  const candidates = [
    process.env.CC_CHROME,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ].filter(Boolean);
  return candidates.find((c) => existsSync(c));
}

const BASE = (process.env.CC_URL || "http://localhost:3200").replace(/\/$/, "");
const chromium = loadChromium();

const results = [];
const ok = (name, detail = "") => { results.push({ name, pass: true, detail }); console.log(`  ok    ${name}${detail ? ` — ${detail}` : ""}`); };
const bad = (name, detail = "") => { results.push({ name, pass: false, detail }); console.log(`  FAIL  ${name} — ${detail}`); };
const check = (cond, name, detail = "") => (cond ? ok(name, detail) : bad(name, detail));

console.log(`\nCampus Circle production checks against ${BASE}\n`);

// ── 1. Response headers ─────────────────────────────────────────────────────
const home = await fetch(`${BASE}/`, { redirect: "manual" });
const H = (n) => home.headers.get(n);

check(home.status === 200, "the landing page answers 200", `got ${home.status}`);

const csp = H("content-security-policy");
if (!csp) {
  bad("CSP present", "no Content-Security-Policy header. This suite must run against `npm run start`, not `npm run dev` — the policy is deliberately absent in development.");
} else {
  ok("CSP present");

  // Two policies on one response are enforced as their intersection, and the second one is
  // usually the stale config copy that re-blocks the inline scripts the nonce allows.
  check(!csp.includes(", default-src"), "exactly one CSP policy on the response", csp.split(",").length > 2 ? "looks merged/duplicated" : "");

  const directives = Object.fromEntries(
    csp.split(";").map((d) => d.trim()).filter(Boolean).map((d) => {
      const [k, ...rest] = d.split(/\s+/);
      return [k, rest.join(" ")];
    })
  );
  const scriptSrc = directives["script-src"] || "";

  check(!scriptSrc.includes("'unsafe-inline'"), "script-src allows no unsafe-inline", scriptSrc);
  check(!scriptSrc.includes("'unsafe-eval'"), "script-src allows no unsafe-eval");
  const nonceMatch = scriptSrc.match(/'nonce-([^']+)'/);
  check(Boolean(nonceMatch), "script-src carries a nonce", nonceMatch ? nonceMatch[1].slice(0, 8) + "…" : scriptSrc);
  // Without this, the chunks the router inserts during client navigation are blocked, because
  // a browser ignores host sources like 'self' for scripts once a nonce is present.
  check(scriptSrc.includes("'strict-dynamic'"), "script-src carries strict-dynamic for runtime-inserted chunks");
  check(directives["object-src"] === "'none'", "object-src is none");
  check(directives["frame-ancestors"] === "'none'", "frame-ancestors is none");
  check(directives["base-uri"] === "'self'", "base-uri is self");
  check(directives["form-action"] === "'self'", "form-action is self");
  check((directives["script-src"] || "").includes("'self'"), "script-src still names 'self' for older browsers");
  // The one concession, and it is deliberate: framer-motion writes inline style attributes.
  check((directives["style-src"] || "").includes("'unsafe-inline'"), "style-src permits inline styles (framer-motion needs it)");

  // A constant nonce is as useless as none: it can be cached, prefetched and replayed.
  const second = await fetch(`${BASE}/`, { redirect: "manual" });
  const nonce2 = (second.headers.get("content-security-policy") || "").match(/'nonce-([^']+)'/)?.[1];
  check(Boolean(nonce2) && nonce2 !== nonceMatch?.[1], "the nonce changes between two requests", `${nonceMatch?.[1].slice(0, 6)}… vs ${nonce2?.slice(0, 6)}…`);

  // Static hardening headers that do not need a nonce stay in next.config.
  const statics = {
    "strict-transport-security": /max-age=\d+/,
    "x-frame-options": "DENY",
    "x-content-type-options": "nosniff",
    "referrer-policy": "same-origin",
    "cross-origin-opener-policy": "same-origin",
    "x-robots-tag": "noindex, nofollow",
  };
  for (const [name, expect] of Object.entries(statics)) {
    const v = H(name) || "";
    check(typeof expect === "string" ? v.toLowerCase() === expect.toLowerCase() : expect.test(v), `${name} set`, v || "missing");
  }
  check(Boolean(H("permissions-policy")), "permissions-policy set", H("permissions-policy") || "missing");
}

// ── 2. Next.js must have stamped its own inline scripts with that nonce ─────
const html = await home.text();
const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>/g)];
const nonceOf = (tag) => tag.match(/\bnonce="([^"]+)"/)?.[1];
const headerNonce = csp?.match(/'nonce-([^']+)'/)?.[1];
if (inlineScripts.length === 0) {
  ok("no inline scripts to block", "the document carries only external scripts");
} else {
  const untagged = inlineScripts.filter((m) => nonceOf(m[0]) !== headerNonce);
  check(untagged.length === 0, `all ${inlineScripts.length} inline scripts carry the response nonce`, untagged.length ? "these would be blocked" : "");
}

// ── 3. What a visitor actually sees ─────────────────────────────────────────
const browser = await chromium.launch({ ...(chromePath() ? { executablePath: chromePath() } : {}), headless: true });

async function visibleTextChars(page) {
  return page.evaluate(() => {
    let chars = 0;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const el = walker.currentNode.parentElement;
      const text = walker.currentNode.textContent?.trim() ?? "";
      if (!el || !text) continue;
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if (s.visibility === "hidden" || s.display === "none" || Number(s.opacity) === 0) continue;
      if (r.width === 0 && r.height === 0) continue;
      chars += text.length;
    }
    return chars;
  });
}

{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const blocked = [];
  const errors = [];
  page.on("console", (m) => {
    const t = m.text();
    if (m.type() === "error") errors.push(t);
    if (/Content Security Policy/i.test(t)) blocked.push(t);
  });
  page.on("requestfailed", (r) => blocked.push(`request failed: ${r.url().slice(0, 120)}`));

  await page.goto(`${BASE}/`, { waitUntil: "load", timeout: 90000 });
  await page.waitForTimeout(2500);

  check(blocked.length === 0, "the browser blocked nothing on load", blocked.slice(0, 2).join(" | ").slice(0, 200));
  const painted = await visibleTextChars(page);
  check(painted > 200, "a visitor sees real copy, not a blank page", `${painted} visible characters painted`);
  check((await page.locator("body").innerText()).trim().length > 200, "body innerText is populated");

  // Client navigation loads route chunks at runtime: the case strict-dynamic exists for. It
  // is also the cheapest proof that the browser ran the runtime rather than just painting HTML.
  const link = page.locator("a[href='/apply']").first();
  if (await link.count()) {
    await link.click().catch(() => undefined);
    await page.waitForTimeout(2500);
    const path = new URL(page.url()).pathname;
    const applyText = await visibleTextChars(page);
    check(path === "/apply" && applyText > 150, "client-side navigation to the application form works", `${path}, ${applyText} visible characters`);
  } else {
    bad("client-side navigation", "no /apply link found on the landing page to navigate from");
  }

  const cspErrors = errors.filter((e) => /Content Security Policy/i.test(e));
  check(cspErrors.length === 0, "no CSP violations in the console", cspErrors.slice(0, 1).join(" "));
  check(errors.length === 0, "no console errors on the public pages", errors.slice(0, 1).map((e) => e.slice(0, 160)).join(" "));

  await ctx.close();
}

// ── 4. The sign-in surface renders too ──────────────────────────────────────
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/apply`, { waitUntil: "load", timeout: 90000 });
  await page.waitForTimeout(1500);
  const painted = await visibleTextChars(page);
  check(painted > 100, "/apply paints content", `${painted} visible characters`);
  // The dev-only "continue as" picker must never reach a production response, wherever it came from.
  const devPicker = await page.evaluate(() => document.body.innerText.toLowerCase().includes("continue as"));
  check(!devPicker, "the dev sign-in picker is absent in production", devPicker ? "the picker is visible" : "");
  await ctx.close();
}

await browser.close();

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} production checks passed`);
if (failed.length) console.log(`\nFailing:\n${failed.map((f) => `  - ${f.name}${f.detail ? ` — ${f.detail}` : ""}`).join("\n")}`);
console.log("");
process.exit(failed.length ? 1 : 0);
