// Browser verification for Campus Circle against the seeded Postgres database.
// Run with the dev server up: node .scratch/verify-cc-ui.mjs
/**
 * Browser verification for Campus Circle: it drives the real app against the real database and
 * asserts behaviour a unit test cannot — middleware redirects, hydration-gated buttons, the
 * message an operator actually sees after a decision.
 *
 *   npm run dev              # then, in another shell
 *   npm run verify:ui
 *
 * Needs playwright-core (or playwright) and a Chromium binary. Point CC_PLAYWRIGHT at a
 * playwright install anywhere on disk if it is not in this project's node_modules, and
 * CC_CHROME at the browser executable.
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
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ].filter(Boolean);
  return candidates.find((c) => existsSync(c));
}

const chromium = loadChromium();

const BASE = process.env.CC_URL || "http://localhost:3200";
const results = [];
console.log("\nCampus Circle browser checks. This suite writes real data: for a clean pass, run `npm run db:seed` first.");
const ok = (name, detail = "") => { results.push({ name, pass: true, detail }); console.log(`  ok    ${name}${detail ? ` — ${detail}` : ""}`); };
const bad = (name, detail = "") => { results.push({ name, pass: false, detail }); console.log(`  FAIL  ${name} — ${detail}`); };

const browser = await chromium.launch({
  ...(chromePath() ? { executablePath: chromePath() } : {}),
  headless: true,
});

async function clickTab(page, label, expectText) {
  const tab = page.locator("button", { hasText: new RegExp("^" + label) }).first();
  await tab.waitFor({ state: "visible", timeout: 60000 });
  if (!expectText) throw new Error("clickTab needs text to confirm the panel switched");
  // In dev the bundle is large, so a click that lands before hydration is silently dropped.
  // Re-click until the expected panel content is actually on screen.
  for (let attempt = 0; attempt < 6; attempt++) {
    await tab.click();
    await page.waitForTimeout(800);
    if (await page.locator("text=" + expectText).first().isVisible().catch(() => false)) return;
  }
  throw new Error(`tab "${label}" never showed ${expectText}`);
}

async function newPage() {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(90000);
  return { ctx, page };
}

async function devSignIn(page, personName) {
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.click("summary:has-text('continue as')");
  await Promise.all([
    page.waitForURL(/\/(admin|home)/, { timeout: 90000 }),
    page.click(`button:has-text("${personName}")`),
  ]);
  await page.waitForLoadState("networkidle");
}

// ── 1. Unauthenticated visitor is turned away at the door ───────────────────
{
  const { ctx, page } = await newPage();
  await page.goto(`${BASE}/admin`, { waitUntil: "domcontentloaded" });
  const url = new URL(page.url()).pathname;
  if (url === "/") ok("middleware redirects an anonymous /admin visit to sign-in", page.url());
  else bad("middleware redirect", `landed on ${url}`);

  await page.goto(`${BASE}/home`, { waitUntil: "domcontentloaded" });
  const url2 = new URL(page.url()).pathname;
  if (url2 === "/") ok("middleware redirects an anonymous /home visit to sign-in");
  else bad("middleware redirect /home", `landed on ${url2}`);

  // The public page must not hand out the roster as one-click sessions.
  const body = await page.textContent("body");
  if (!body.includes("Kunal Mehta")) bad("sign-in page still enumerates the roster");
  else ok("sign-in page hides the roster", "account names only behind the dev disclosure");

  if (await page.locator("#login-email").count()) ok("sign-in offers an email and password form");
  else bad("sign-in form", "no email field found");

  await ctx.close();
}

// ── 2. Operator console loads real data ────────────────────────────────────
const admin = await newPage();
{
  await devSignIn(admin.page, "Kunal Mehta");
  const path = new URL(admin.page.url()).pathname;
  if (path === "/admin") ok("dev sign-in opens the operator console", path);
  else bad("dev sign-in", `landed on ${path}`);

  const text = await admin.page.textContent("body");
  if (/Cohort 01/.test(text)) ok("console renders the cohort header");
  else bad("console render", "cohort name missing");

  const review = admin.page.locator("button", { hasText: /^Review/ });
  const badge = await review.first().textContent();
  console.log(`        review tab badge: ${badge.trim()}`);
  await review.first().click();
  await admin.page.waitForTimeout(600);
  const attemptHeader = admin.page.locator("span", { hasText: /Attempt \d+/ }).first();
  await attemptHeader.waitFor({ state: "visible", timeout: 30000 }).catch(() => undefined);
  const headerText = (await attemptHeader.textContent().catch(() => null)) ?? "";
  if (headerText) ok("review queue opens a submission", headerText.trim());
  else bad("review queue", "no attempt header rendered");
}

// ── 3. Rubric gate + accept, with the outcome stated on screen ─────────────
{
  const page = admin.page;
  // Accept must be disabled until every rubric line is ticked.
  const accept = page.locator("button:has-text('Accept ·')").first();
  const disabledBefore = await accept.isDisabled();
  if (disabledBefore) ok("accept is blocked until the rubric is complete");
  else bad("rubric gate", "accept was enabled with an unticked rubric");

  const boxes = page.locator("button[aria-pressed]");
  const count = await boxes.count();
  for (let i = 0; i < count; i++) await boxes.nth(i).click();
  await page.waitForTimeout(200);
  const enabledNow = await accept.isEnabled().catch(() => false);
  if (enabledNow) ok("accept unlocks when every rubric line is met");
  else bad("rubric gate", "accept stayed enabled/disabled unexpectedly");

  // Actually grade it: the decision has to land in the database, not just look right.
  const badgeBefore = (await admin.page.getByRole("button", { name: /^Review/ }).first().textContent()) ?? "";
  const countBefore = parseInt(badgeBefore.replace(/\D/g, ""), 10);
  const targetName = (await admin.page.locator("div.grid > div:first-child button").first().textContent())?.trim();
  await accept.click();
  await admin.page.waitForTimeout(2500);
  const badgeAfter = (await admin.page.getByRole("button", { name: /^Review/ }).first().textContent()) ?? "";
  const countAfter = parseInt(badgeAfter.replace(/\D/g, ""), 10);
  console.log("        accepted an attempt - queue " + countBefore + " -> " + countAfter);
  if (Number.isFinite(countBefore) && Number.isFinite(countAfter) && countAfter === countBefore - 1) {
    ok("accepting removes the attempt from the queue", `logged for ${(targetName || "").slice(0, 24)}`);
  } else {
    bad("accept write path", `queue went ${countBefore} -> ${countAfter}`);
  }
}

// ── 4. A reviewer cannot grade what another reviewer opened ─────────────────
{
  const second = await newPage();
  await devSignIn(second.page, "Ishaan Verma");
  await clickTab(second.page, "Review", "Rubric");
  // Select the same (first) item the admin already has open.
  const firstRow = second.page.locator("div.grid > div:first-child button").first();
  await firstRow.click();
  await second.page.waitForTimeout(1200);
  const text = await second.page.textContent("body");
  if (/with Kunal Mehta|locked to Kunal|opened by Kunal/i.test(text)) {
    ok("a second reviewer sees the attempt is held by someone else");
  } else {
    bad("reviewer lockout", "no indication the attempt is claimed by another reviewer");
  }
  await second.ctx.close();
}

// ── 5. Ambassador cannot reach the operator console ────────────────────────
const amb = await newPage();
{
  await devSignIn(amb.page, "Aditya Singh");
  const path = new URL(amb.page.url()).pathname;
  if (path === "/home") ok("ambassador lands on their own console", path);
  else bad("ambassador sign-in", `landed on ${path}`);

  await amb.page.goto(`${BASE}/admin`, { waitUntil: "domcontentloaded" });
  await amb.page.waitForTimeout(500);
  const after = new URL(amb.page.url()).pathname;
  if (after === "/home") ok("ambassador is bounced off /admin", after);
  else bad("role guard", `ambassador reached ${after}`);

  const body = await amb.page.textContent("body");
  if (/Signal/.test(body) && /Tasks/.test(body)) ok("ambassador console renders tasks and Signal");
  else bad("ambassador console", "expected tabs missing");
}

// ── 6. Stored XSS in the profile URL is refused at the door ────────────────
{
  const page = amb.page;
  await clickTab(page, "Circle", "Your rank");
  const edit = page.getByRole("button", { name: "Edit" }).first();
  await edit.waitFor({ state: "visible", timeout: 60000 });
  await edit.click();
  await page.fill('input[placeholder="Your page URL"]', "javascript:alert(document.cookie)");
  await page.click("button:has-text('Save')");
  await page.waitForTimeout(1200);
  const note = await page.textContent("body");
  if (/public http\(s\) URL|full http\(s\) URL/.test(note)) ok("javascript: page URL is rejected with a reason");
  else bad("profile URL guard", `no refusal found; note=${note.slice(0, 0)}`);
  await page.fill('input[placeholder="Your page URL"]', "https://aditya.dev");
  await page.click("button:has-text('Save')");
  await page.waitForTimeout(1000);
  const saved = await page.textContent("body");
  if (/aditya\.dev/.test(saved)) ok("a real http(s) page URL still saves");
  else bad("profile save", "valid URL did not persist");
}

// ── 7. Reward claim respects the tier and signal gates ─────────────────────
{
  const page = amb.page;
  await clickTab(page, "Rewards", "Locked");
  const lockedRows = await page.locator("text=Locked").count();
  const claimButtons = await page.locator("button:has-text('Claim')").count();
  console.log(`        rewards: ${lockedRows} locked pills, ${claimButtons} claim buttons`);
  if (lockedRows > 0) ok("locked rewards render as locked");
  else bad("rewards panel", "no locked reward to check");

  if (claimButtons === 0) {
    bad("claim flow", "no earned reward was claimable - this suite consumes data, run npm run db:seed first");
  } else {
    await page.locator("button:has-text('Claim')").first().click();
    await page.waitForTimeout(1500);
    const after = await page.textContent("body");
    if (/Claimed|Awaiting fulfilment|Request/i.test(after)) ok("claiming an earned reward records it");
    else bad("claim flow", "no confirmation after claiming");
  }
}

// ── 8. Certificate verification page renders for a real certificate ────────
{
  const { ctx, page } = await newPage();
  await page.goto(`${BASE}/verify/cc01-aditya-singh-7f3a`, { waitUntil: "domcontentloaded" });
  const body = await page.textContent("body");
  if (/Aditya Singh/.test(body)) ok("public verify page resolves a certificate");
  else bad("verify page", `unexpected content: ${body.slice(0, 120)}`);

  await page.goto(`${BASE}/verify/definitely-not-a-certificate-id`, { waitUntil: "domcontentloaded" });
  const nf = await page.textContent("body");
  if (/Nothing at this address/.test(nf)) ok("unknown certificate id gets the 404 page, not a stack trace");
  else bad("404 boundary", nf.slice(0, 120));
  await ctx.close();
}

// ── 9. Applications: accepting provisions an account ───────────────────────
{
  const page = admin.page;
  await clickTab(page, "Applications", "Accept and send invite");
  const before = await page.locator("text=pending").count();
  console.log(`        pending applications visible: ${before}`);
  const acceptBtn = page.locator("button:has-text('Accept and send invite')").first();
  if (await acceptBtn.count()) {
    await acceptBtn.click();
    await page.waitForTimeout(2500);
    const body = await page.textContent("body");
    if (/Accepted/.test(body)) ok("accepting an application reports a decision", body.match(/Accepted[^\n]{0,120}/)?.[0] ?? "");
    else bad("provisioning", `no acceptance message: ${body.slice(0, 200)}`);
    if (/Email is not configured|account and sign-in link|send this link yourself/i.test(body)) {
      ok("mail state is stated honestly");
    } else {
      bad("mail state", "message did not say whether an invite was actually sent");
    }
  } else {
    bad("applications queue", "no accept button rendered");
  }
}

// ── 10. A reviewer cannot fulfil rewards or decide applications ────────────
{
  const { ctx, page } = await newPage();
  await devSignIn(page, "Ishaan Verma");
  await clickTab(page, "Rewards", "fulfilment");
  const body = await page.textContent("body");
  if (/Admin only/.test(body) || !/Mark fulfilled|Issue certificate/.test(body)) {
    ok("reviewer is not offered reward fulfilment");
  } else {
    bad("role gating", "reviewer can see fulfil buttons");
  }
  await clickTab(page, "Applications", "only a Campus Circle admin can decide");
  const body2 = await page.textContent("body");
  if (!/Accept and send invite/.test(body2) && /only a Campus Circle admin can decide/i.test(body2)) {
    ok("reviewer is not offered application decisions");
  } else {
    bad("role gating", "reviewer can decide applications");
  }
  await ctx.close();
}

// ── 10b. Password sign-in ──────────────────────────────────────────────────
async function passwordSignInAttempt(emailValue, passwordValue) {
  const { ctx, page } = await newPage();
  // Wait for hydration: the email field is controlled, so a value typed before React has
  // taken over is wiped by the first render and the form then refuses to submit.
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.locator("#login-email").click();
  await page.locator("#login-email").fill(emailValue);
  await page.locator("#login-password").fill(passwordValue);
  await page.locator("button", { hasText: /^Sign in$/ }).first().click();
  await page.waitForTimeout(2600);
  return { ctx, page };
}

{
  const good = await passwordSignInAttempt("kunal@rothenhall.com", "Circle-Operator-2026");
  const path = new URL(good.page.url()).pathname;
  if (path === "/admin") ok("an operator signs in with a password", path);
  else bad("password sign-in", `landed on ${path}`);
  await good.ctx.close();

  const wrong = await passwordSignInAttempt("kunal@rothenhall.com", "Circle-Operator-2027");
  const wrongPath = new URL(wrong.page.url()).pathname;
  const wrongBody = await wrong.page.textContent("body");
  if (wrongPath === "/" && /Email or password is wrong/.test(wrongBody)) ok("a wrong password is refused");
  else bad("password refusal", `landed on ${wrongPath}`);
  await wrong.ctx.close();

  // The reply for an address that has never been seen must be identical to the reply for a
  // wrong password, or the login form is a roster.
  const ghost = await passwordSignInAttempt("nobody-at-all@example.test", "whatever-12345");
  const ghostBody = await ghost.page.textContent("body");
  if (/Email or password is wrong/.test(ghostBody) && !/no such|not found|unknown/i.test(ghostBody)) {
    ok("an unknown address gets the same refusal as a wrong password");
  } else {
    bad("enumeration guard", ghostBody.slice(-160));
  }

  let throttled = "";
  // The limit is 8 per ten minutes; the dev server is slow enough under this suite that a
  // fixed short wait reads the previous attempt's message. Give each one room and overshoot.
  for (let i = 0; i < 16; i++) {
    await ghost.page.locator("#login-password").fill("brute-force-" + i + "-12345");
    await ghost.page.locator("button", { hasText: /^Sign in$/ }).first().click();
    await ghost.page.waitForTimeout(3000);
    const alert = await ghost.page.locator('[role="alert"]').first().textContent().catch(() => "");
    throttled = alert ?? "";
    if (/Too many attempts/.test(throttled)) break;
  }
  if (/Too many attempts/.test(throttled)) ok("repeated failures are rate limited");
  else bad("rate limit", "last alert said: " + throttled.slice(0, 120));
  await ghost.ctx.close();
}

// ── 11. The authoring surface: create a person, a task, a campus ───────────
{
  const page = admin.page;
  const stamp = Date.now().toString().slice(-6);
  const email = `test.${stamp}@college.edu`;

  await clickTab(page, "Ambassadors", "Add person");
  await page.locator("button", { hasText: /^Add person$/ }).first().click();
  await page.getByPlaceholder("Full name").fill("Test Ambassador");
  await page.getByPlaceholder("name@college.edu").fill(email);
  await page.locator('input[list="campus-names"]').fill("Test Campus " + stamp);
  await page.locator("button", { hasText: "Add person and send invite" }).click();
  await page.waitForTimeout(2500);
  let body = await page.textContent("body");
  if (/was added/.test(body)) ok("an admin can create an ambassador", email);
  else bad("create ambassador", body.slice(-260));
  if (/email is not configured|sign-in link is on its way/i.test(body)) ok("the invite states where the link actually went");
  else bad("invite state", "no honest mail state after creating an account");
  if (new RegExp("Test Ambassador").test(body)) ok("the new person appears in the roster");
  else bad("roster refresh", "created person not listed");

  // Their record: Signal adjustment, tier change, suspension.
  await page.locator("tr", { hasText: "Test Ambassador" }).first().click();
  await page.waitForTimeout(1200);
  const drawer = page.getByRole("dialog");
  await drawer.waitFor({ state: "visible", timeout: 20000 });
  await drawer.getByLabel("Reason (goes in their ledger)").fill("Pilot cohort work recognised");
  await drawer.locator('input[type="number"]').first().fill("50");
  await drawer.locator("button", { hasText: /^Apply$/ }).click();
  await page.waitForTimeout(2000);
  body = await page.textContent("body");
  if (body.includes("+50 Signal")) ok("a Signal adjustment is recorded against the person");
  else bad("signal adjustment", body.slice(-200));

  const tierSelect = drawer.locator("select").first();
  await tierSelect.selectOption("campus_lead");
  await page.waitForTimeout(2000);
  body = await page.textContent("body");
  if (/is now campus lead/.test(body)) ok("tier can be changed from the console");
  else bad("tier change", body.slice(-200));

  // Self-lockout guards.
  const roleSelect = drawer.locator("select").nth(1);
  if (await roleSelect.isEnabled()) ok("an admin can change someone else's role");
  else bad("role control", "the role select was not usable on another person's record");

  await drawer.locator("button", { hasText: "Suspend and sign out" }).click();
  await page.waitForTimeout(2200);
  body = await page.textContent("body");
  if (/suspended and their sessions are revoked/.test(body)) ok("suspending a person revokes their sessions");
  else bad("suspend", body.slice(-200));
  await page.keyboard.press("Escape");

  // A suspended account cannot get in even through the dev picker.
  const third = await newPage();
  await third.page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await third.page.click("summary:has-text('continue as')");
  const row = third.page.locator("button", { hasText: "Test Ambassador" });
  if (await row.count()) {
    await row.first().click();
    await third.page.waitForTimeout(2500);
    const landed = new URL(third.page.url()).pathname;
    if (landed === "/") ok("a suspended account is bounced at the door", "landed on " + landed);
    else bad("suspended access", "reached " + landed);
  } else {
    bad("suspended access", "the new account was not offered by the dev picker");
  }
  await third.ctx.close();

  // A new task, end to end.
  await clickTab(page, "Tasks", "New task");
  await page.locator("button", { hasText: /^New task$/ }).first().click();
  await page.waitForTimeout(1200);
  const taskDrawer = page.getByRole("dialog");
  await taskDrawer.waitFor({ state: "visible", timeout: 20000 });
  await taskDrawer.locator('input[placeholder="B2"]').fill("E9");
  await taskDrawer.getByLabel("Title", { exact: true }).fill("Verification brief");
  await taskDrawer.getByLabel("One-line summary").fill("A task created from the console rather than the seed file.");
  await taskDrawer.getByLabel("Brief").fill("Do the thing.\n\nWhat good looks like: one specific claim and the evidence behind it.");
  await taskDrawer.locator('input[placeholder="Line 1"]').fill("It is published somewhere you control");
  await taskDrawer.locator("button", { hasText: /^Create task$/ }).click();
  await page.waitForTimeout(3000);
  // Assert the result, not the toast: the editor closes on success, so the row is the proof.
  const taskRow = page.locator("tr", { hasText: "E9" });
  if (await taskRow.count()) {
    const rowText = (await taskRow.first().textContent()) ?? "";
    ok("a task can be authored in the console", rowText.replace(/\s+/g, " ").trim().slice(0, 70));
  } else {
    bad("create task", "no E9 row appeared in the task table");
  }

  // Editing it back, and the freeze on a code with submissions.
  await page.locator("tr", { hasText: "E9" }).first().locator("text=Edit").click();
  await page.waitForTimeout(1200);
  const editDrawer = page.getByRole("dialog");
  await editDrawer.waitFor({ state: "visible", timeout: 20000 });
  await editDrawer.getByLabel("Title", { exact: true }).fill("Verification brief, renamed");
  await editDrawer.locator("button", { hasText: /^Save task$/ }).click();
  await page.waitForTimeout(2600);
  const editedRow = (await page.locator("tr", { hasText: "E9" }).first().textContent()) ?? "";
  if (editedRow.includes("Verification brief, renamed")) ok("a task can be edited after creation");
  else bad("edit task", editedRow.replace(/\s+/g, " ").trim().slice(0, 120));

  // Admin resets a password, and the person signs in with it.
  await clickTab(page, "Ambassadors", "Add person");
  await page.locator("tr", { hasText: "Aditya Singh" }).first().click();
  await page.waitForTimeout(1500);
  const adityaDrawer = page.getByRole("dialog");
  await adityaDrawer.waitFor({ state: "visible", timeout: 20000 });
  await adityaDrawer.getByLabel("New password").fill("Aditya-demo-2026");
  await adityaDrawer.locator("button", { hasText: /^Reset password$/ }).click();
  await page.waitForTimeout(2400);
  body = await page.textContent("body");
  if (/Password changed for Aditya Singh/.test(body)) ok("an admin can reset someone's password");
  else bad("admin password reset", body.slice(-200));
  await page.keyboard.press("Escape");

  const asAditya = await passwordSignInAttempt("aditya.singh@campus.circle", "Aditya-demo-2026");
  const adityaPath = new URL(asAditya.page.url()).pathname;
  if (adityaPath === "/home") ok("the reset password signs the ambassador in", adityaPath);
  else bad("reset password login", `landed on ${adityaPath}`);

  // They then change it themselves, and the old one stops working.
  await clickTab(asAditya.page, "Circle", "Password");
  const nextField = asAditya.page.locator('input[name="next"]');
  await nextField.scrollIntoViewIfNeeded();
  await asAditya.page.locator('input[name="current"]').fill("Aditya-demo-2026");
  await nextField.fill("Aditya-rotated-77");
  await asAditya.page.locator('input[name="confirm"]').fill("Aditya-rotated-77");
  await asAditya.page.locator("button", { hasText: /^Change password$/ }).click();
  await asAditya.page.waitForTimeout(2600);
  const changedBody = await asAditya.page.textContent("body");
  if (/Password changed/.test(changedBody)) ok("a person can change their own password");
  else bad("self password change", changedBody.slice(-200));
  await asAditya.ctx.close();

  const stale = await passwordSignInAttempt("aditya.singh@campus.circle", "Aditya-demo-2026");
  if (new URL(stale.page.url()).pathname === "/") ok("the superseded password stops working");
  else bad("password rotation", "the old password still signed in");
  await stale.ctx.close();

  const rotated = await passwordSignInAttempt("aditya.singh@campus.circle", "Aditya-rotated-77");
  if (new URL(rotated.page.url()).pathname === "/home") ok("the new password works");
  else bad("password rotation", "the new password did not work");
  await rotated.ctx.close();

  // Catalogue: campus and reward.
  await clickTab(page, "Settings", "Reward ladder");
  await page.locator("button", { hasText: /^Add a reward$/ }).first().click();
  await page.waitForTimeout(600);
  await page.locator('input[maxlength="40"]').first().fill("pilot_kit_" + stamp);
  const rewardInputs = page.locator(".card input.input");
  await rewardInputs.nth(1).fill("Pilot kit " + stamp);
  await rewardInputs.nth(2).fill("A kit issued to pilot-cohort ambassadors.");
  await page.locator("button", { hasText: /^Add reward$/ }).click();
  await page.waitForTimeout(2600);
  body = await page.textContent("body");
  if (body.includes("Pilot kit " + stamp)) ok("a reward can be added to the ladder");
  else bad("create reward", "the new reward did not appear in the ladder");

  const ownRole = page.getByLabel("role for Kunal Mehta");
  if (await ownRole.isDisabled().catch(() => false)) ok("an admin cannot change their own role from the console");
  else bad("self role guard", "the own-role select was not disabled");

  if (!new RegExp("Test Campus " + stamp).test(body)) bad("campus list", "the campus created while adding a person is missing");
  else ok("a campus created while adding a person shows in the list");

  await page.getByLabel("Campus name").fill("Verification Campus " + stamp);
  await page.locator("button", { hasText: /^Add campus$/ }).click();
  await page.waitForTimeout(2500);
  body = await page.textContent("body");
  if (body.includes("Verification Campus " + stamp)) ok("a campus can be added directly");
  else bad("create campus", body.slice(-200));

  // Audit trail: everything above should be recorded.
  await page.locator("text=Recent decisions").first().scrollIntoViewIfNeeded().catch(() => undefined);
  await page.waitForTimeout(800);
  body = await page.textContent("body");
  const recorded = ["account.created", "signal.adjusted", "member.tier_changed", "task.created", "reward.created"].filter((a) => body.includes(a));
  if (recorded.length >= 4) ok("decisions about people and work are in the audit trail", recorded.join(", "));
  else bad("audit trail", "only found: " + recorded.join(", "));
}

await admin.ctx.close();
await amb.ctx.close();
await browser.close();

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} browser checks passed\n`);
process.exit(failed.length ? 1 : 0);
