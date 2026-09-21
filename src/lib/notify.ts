import "server-only";

// Email, behind one door.
//
// Two behaviours matter here. Without RESEND_API_KEY the app does not crash and does not
// pretend it sent something: it logs the message and reports `skipped`, which the caller
// surfaces honestly. And every value that came from a person is escaped before it reaches
// HTML, because names and campuses are attacker-controlled text.

const RESEND_URL = "https://api.resend.com/emails";

export type MailResult = { ok: true; id: string } | { ok: false; error: string; skipped?: boolean };

export function mailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

function fromAddress() {
  return process.env.RESEND_FROM || "Campus Circle <onboarding@resend.dev>";
}

export function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendMail(opts: { to: string; subject: string; html: string; text: string }): Promise<MailResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn(
      `[mail] RESEND_API_KEY is not set — nothing was sent to ${opts.to}. Subject: ${opts.subject}\n${opts.text}`
    );
    return { ok: false, error: "Email is not configured on this deployment.", skipped: true };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    const res = await fetch(RESEND_URL, {
      method: "POST",
      signal: controller.signal,
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: fromAddress(), to: [opts.to], subject: opts.subject, html: opts.html, text: opts.text }),
    }).finally(() => clearTimeout(timer));

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[mail] Resend responded ${res.status} for ${opts.to}: ${body.slice(0, 300)}`);
      return { ok: false, error: `Mail provider rejected the message (${res.status}).` };
    }
    const json = (await res.json().catch(() => ({}))) as { id?: string };
    return { ok: true, id: json.id ?? "unknown" };
  } catch (e) {
    console.error(`[mail] delivery failed for ${opts.to}: ${e instanceof Error ? e.message : e}`);
    return { ok: false, error: "Mail provider could not be reached." };
  }
}

const shell = (heading: string, body: string, ctaLabel: string, ctaHref: string, footnote: string) => `
<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:34rem;margin:0 auto;padding:2rem 1.25rem;color:#1c1a17">
  <p style="font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;color:#9a7a4a;margin:0 0 1.5rem">Rothenhall · Campus Circle</p>
  <h1 style="font-size:1.45rem;line-height:1.25;margin:0 0 .85rem">${heading}</h1>
  ${body}
  <p style="margin:1.75rem 0 0"><a href="${ctaHref}" style="background:#a85c30;color:#fff;text-decoration:none;padding:.7rem 1.15rem;border-radius:999px;font-size:.9rem;display:inline-block">${ctaLabel}</a></p>
  <p style="font-size:.82rem;color:#6f6a62;margin:1.5rem 0 0;line-height:1.5">${footnote}</p>
  <p style="font-size:.75rem;color:#9c968c;margin:1.75rem 0 0;border-top:1px solid #e6e0d4;padding-top:1rem">${ctaHref}</p>
</div>`;

export async function sendMagicLink(to: string, url: string, minutes: number) {
  return sendMail({
    to,
    subject: "Your Campus Circle sign-in link",
    text: `Sign in to Campus Circle: ${url}\n\nThis link works once and expires in ${minutes} minutes. If you did not ask for it, nothing happens — ignore this email.`,
    html: shell(
      "Sign in to Campus Circle",
      `<p style="font-size:.95rem;line-height:1.6;margin:0">Use the button below on this device. The link works once, then it is dead.</p>`,
      "Sign in",
      url,
      `Expires in ${minutes} minutes. Did not ask for this? Ignore it and nothing changes — your account cannot be signed into without a link you requested.`
    ),
  });
}

export async function sendAmbassadorInvite(opts: { to: string; name: string; campusName: string; url: string }) {
  const first = opts.name.split(" ")[0] ?? opts.name;
  return sendMail({
    to: opts.to,
    subject: "You have a Campus Circle account",
    text: `You were accepted into Campus Circle at ${opts.campusName}. Sign in and set your page up: ${opts.url}`,
    html: shell(
      `${esc(first)}, you are in.`,
      `<p style="font-size:.95rem;line-height:1.6;margin:0 0 .85rem">Your account for <strong>${esc(opts.campusName)}</strong> is ready. Sign in with this link — no password to set — then claim your ground in week one.</p>
       <p style="font-size:.9rem;line-height:1.6;margin:0;color:#6f6a62">Everything is graded against a rubric you can read before you start. Twelve weeks, five published pieces, one thing you own.</p>`,
      "Open your console",
      opts.url,
      "This link works once. Ask for another any time you need one."
    ),
  });
}

export async function sendApplicationReceived(opts: { to: string; name: string }) {
  const first = opts.name.split(" ")[0] ?? opts.name;
  return sendMail({
    to: opts.to,
    subject: "Campus Circle — application received",
    text: `We have your application. A human reads every one; expect a reply within a week.`,
    html: shell(
      `Thanks, ${esc(first)}.`,
      `<p style="font-size:.95rem;line-height:1.6;margin:0">Your application is in the queue. A person reads each one — decisions come back inside a week.</p>`,
      "What happens next",
      "https://campusscout.rothenhall.com/apply",
      "Keep an eye on this address: an accepted applicant gets their account here."
    ),
  });
}
