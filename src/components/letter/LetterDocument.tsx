import { Wordmark, Mark } from "@/components/brand/Logo";
import { fullDate, shortDate } from "@/lib/format";
import { addDays } from "@/lib/cohort";
import { tierLabel } from "@/lib/signal";
import { PrintButton } from "@/components/letter/PrintButton";
import type { LetterData } from "@/lib/letter";

/**
 * The one template every ambassador's appointment letter renders from. Nothing here is
 * per-person copy-pasted — change the wording once and every letter, past and future,
 * reads the new version, because none of it is ever saved as its own document.
 */
export function LetterDocument({ data }: { data: LetterData }) {
  const firstName = data.name.split(" ")[0] || data.name;
  const assignmentOpens = data.joinedAt;
  const assignmentDue = addDays(data.joinedAt, 7);

  return (
    <div className="letter-backdrop">
      <div className="mb-4 flex w-full max-w-[210mm] justify-end no-print">
        <PrintButton />
      </div>
      <article className="letter-sheet font-sans text-[13px] leading-relaxed text-ink-80">
        <header className="mb-7 flex items-start justify-between border-b-2 border-brass pb-5">
          <div>
            <Wordmark height={30} />
            <p className="mt-2 text-[10px] leading-snug text-ink-45">
              Office 657, 18 Young St, Unit LGE
              <br />
              Edinburgh EH2 4JB, Scotland, United Kingdom
            </p>
          </div>
          <div className="text-right text-[11px] text-ink-45">
            <p className="font-medium text-ink-60">Ref {data.refCode}</p>
            <p>{fullDate(new Date())}</p>
          </div>
        </header>

        <p className="eyebrow mb-2">Campus Circle · Letter of Appointment</p>
        <h1 className="mb-1 font-display text-2xl font-extrabold tracking-tight text-ink">
          Appointment as Rothenhall Campus Ambassador
        </h1>
        <p className="mb-6 font-display text-base text-ink-60">Confirmation of appointment, and your first assignment</p>

        <div className="mb-5 flex flex-wrap gap-6 text-[13px]">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-ink-45">To</p>
            <p className="font-medium text-ink">{data.name}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-ink-45">From</p>
            <p className="font-medium text-ink">Kunal Achintya Reddy, Rothenhall Partners</p>
          </div>
        </div>

        <div className="mb-6 border-y border-line py-3 font-display text-base font-semibold text-ink">
          Subject: <span className="text-cognac-deep">Appointment as Rothenhall Campus Ambassador</span>
        </div>

        <p className="mb-4">Dear {firstName},</p>
        <p className="mb-4">
          We are pleased to formally confirm your appointment as a <strong>Rothenhall Campus Ambassador</strong>,
          representing <strong>{data.campusName}</strong> in <strong>{data.cohortName}</strong>. Congratulations on
          your selection. We look forward to having you represent Rothenhall on your campus and contribute to the
          growth of our community.
        </p>
        <p className="mb-6">
          Rothenhall is an AI-native company building the infrastructure for how businesses are discovered and
          represented in the age of AI. This letter sets out your appointment, the nature of the programme, and the
          assignment that opens it.
        </p>

        <Section num="01" title="Nature of the Appointment">
          <p>
            This appointment is to Rothenhall&rsquo;s Campus Circle programme, a part-time, non-employment role for
            currently enrolled students. It does not constitute an offer of employment, an internship-for-hire, or
            any employer&ndash;employee relationship with Rothenhall Partners, and carries no fixed hours, salary, or
            statutory benefit. Your standing in the programme is governed by this letter and by the programme terms
            on your console.
          </p>
        </Section>

        <Section num="02" title="Your First Assignment">
          <table className="w-full border-collapse overflow-hidden rounded-sm border border-line text-[12.5px]">
            <tbody>
              <Row label="Console">circle.rothenhall.com &mdash; live now, using the sign-in link already in your inbox</Row>
              <Row label="Tier">{tierLabel(data.tier)}</Row>
              <Row label="Opens">{shortDate(assignmentOpens)}</Row>
              <Row label="First due">{shortDate(assignmentDue)}</Row>
            </tbody>
          </table>

          {data.firstTasks.length > 0 && (
            <div className="mt-3 flex flex-col gap-2">
              {data.firstTasks.map((t) => (
                <div key={t.code} className="rounded-sm border border-line bg-canvas-2/50 px-3 py-2">
                  <p className="font-medium text-ink">
                    {t.code} &middot; {t.title} <span className="font-normal text-ink-45">&mdash; {t.signalValue} Signal, week {t.week}</span>
                  </p>
                  <p className="text-ink-60">{t.summary}</p>
                </div>
              ))}
            </div>
          )}
          <p className="mt-3">
            The rubric for each task is shown in full before you start, so you always know exactly what a piece is
            graded against.
          </p>
        </Section>

        <Section num="03" title="Content, Ownership and Disclosure">
          <ul className="flex flex-col gap-2">
            <li>
              <strong>Ownership.</strong> You retain full ownership and authorship of everything you publish.
              Rothenhall may reference, link to, or requote your work with credit to you, but the copyright is
              yours.
            </li>
            <li>
              <strong>Disclosure.</strong> Where a piece is written under this programme and mentions Rothenhall, add
              one short line making that clear to your readers &mdash; for example, &ldquo;Written as part of
              Rothenhall&rsquo;s Campus Circle.&rdquo; There is no quota for mentioning Rothenhall: cite it only
              where it is the honest source for a claim, always disclosed when you do.
            </li>
          </ul>
        </Section>

        <Section num="04" title="Performance-Based Compensation">
          <p>
            Ambassadors may become eligible for performance-based monetary compensation. Compensation is not
            guaranteed, and where offered, will be determined according to the programme&rsquo;s published
            performance criteria &mdash; quality of work, consistency, contribution, and other applicable metrics
            &mdash; communicated through your console.
          </p>
        </Section>

        <div className="my-6 rounded-sm border-l-2 border-brass bg-canvas-2/60 px-4 py-3 text-[12.5px] text-ink-60">
          <strong className="text-ink">Acceptance.</strong> Please countersign below and return a copy of this
          letter to confirm your acceptance of this appointment and its terms.
        </div>

        <p className="mb-1">We are excited to have you join Rothenhall and look forward to seeing what you build with us.</p>
        <p className="mb-8">Warm regards,</p>

        <div className="grid grid-cols-2 gap-8 border-t border-line pt-6">
          <div>
            <p className="mb-9 text-[10px] uppercase tracking-wide text-ink-45">For Rothenhall Partners</p>
            <div className="border-t border-ink-60 pt-1.5">
              <p className="font-display font-semibold text-ink">Kunal Achintya Reddy</p>
              <p className="text-[11px] text-ink-45">CEO &amp; Founder, Rothenhall Partners &middot; {fullDate(new Date())}</p>
            </div>
          </div>
          <div>
            <p className="mb-9 text-[10px] uppercase tracking-wide text-ink-45">Accepted by</p>
            <div className="border-t border-ink-60 pt-1.5">
              <p className="font-display font-semibold text-ink">{data.name}</p>
              <p className="text-[11px] text-ink-45">Campus Ambassador &middot; Date: ______________</p>
            </div>
          </div>
        </div>

        <footer className="mt-10 flex items-center justify-between border-t border-line pt-4 text-[10px] text-ink-45">
          <span className="flex items-center gap-1.5">
            <Mark size={14} tone="ink" /> Rothenhall Partners &middot; Office 657, 18 Young St, Unit LGE, Edinburgh EH2 4JB, Scotland, UK
          </span>
          <span>rothenhall.com &middot; {data.refCode}</span>
        </footer>
      </article>
    </div>
  );
}

function Section({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h2 className="mb-2 flex items-baseline gap-2 font-display text-[11px] font-bold uppercase tracking-wide text-brass-deep">
        <span className="text-line-strong">{num}</span>
        {title}
      </h2>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr className="border-b border-line last:border-0">
      <th className="w-32 border-r border-line bg-canvas-2 px-3 py-2 text-left align-top text-[10px] font-semibold uppercase tracking-wide text-ink-45">
        {label}
      </th>
      <td className="px-3 py-2 align-top text-ink-80">{children}</td>
    </tr>
  );
}
