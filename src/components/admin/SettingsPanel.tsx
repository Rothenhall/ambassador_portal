"use client";

import { useRef } from "react";
import { fullDate } from "@/lib/format";
import { BANDS } from "@/lib/signal";
import { postAnnouncement } from "@/lib/actions/admin";
import { useActionRunner } from "@/components/use-action-runner";
import { ActionNote } from "@/components/ActionNote";
import { Section } from "@/components/admin/fields";
import { PasswordForm } from "@/components/PasswordForm";
import { AuditSection, CampusSection, CohortSection, LibrarySection, RewardSection, StaffSection } from "@/components/admin/CatalogueForms";
import type { AdminDashboardData } from "@/lib/admin-dashboard";

function relativeFromISO(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function AnnouncementForm({ cohortId, canPost }: { cohortId: string; canPost: boolean }) {
  const { run, status, pending } = useActionRunner();
  const ref = useRef<HTMLTextAreaElement>(null);

  return (
    <div className="flex flex-col gap-2.5">
      <textarea
        ref={ref}
        className="input"
        rows={2}
        placeholder="Shows on every ambassador's console, until the next one replaces it."
        disabled={!canPost}
      />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="btn-primary btn-sm"
          disabled={pending || !canPost}
          onClick={() => {
            const fields = new FormData();
            fields.set("bodyMd", ref.current?.value ?? "");
            void run(() => postAnnouncement(cohortId, fields)).then((result) => {
              if (result?.ok && ref.current) ref.current.value = "";
            });
          }}
        >
          {pending ? "Posting..." : "Post"}
        </button>
        {!canPost && <span className="text-xs text-ink-45">Only a Campus Circle admin can post to the cohort.</span>}
      </div>
      <ActionNote status={status} />
    </div>
  );
}

export function SettingsPanel({
  data,
  role,
  meId,
  meEmail,
  hasPassword,
}: {
  data: AdminDashboardData;
  role: string;
  meId: string;
  meEmail: string;
  hasPassword: boolean;
}) {
  const isAdmin = role === "admin";

  return (
    <div className="grid grid-cols-1 items-start gap-5 px-6 py-5 xl:grid-cols-2">
      <div className="flex flex-col gap-5">
        <Section title="Announcement" description="One banner, shown to every ambassador in this cohort.">
          <AnnouncementForm cohortId={data.cohort.id} canPost={isAdmin} />
          <div className="mt-2 flex flex-col divide-y divide-line rounded-sm2 border border-line bg-paper">
            {data.announcements.map((a) => (
              <div key={a.id} className="px-3.5 py-2.5 text-sm">
                <p className="text-ink-60">{a.bodyMd}</p>
                <p className="mt-0.5 text-xs text-ink-45">{relativeFromISO(a.publishedAtISO)}</p>
              </div>
            ))}
            {data.announcements.length === 0 && <p className="px-3.5 py-3 text-sm text-ink-45">Nothing posted yet.</p>}
          </div>
        </Section>

        <Section title="Reward ladder" description="Gates are checked server-side at claim time, not just drawn in the panel.">
          {isAdmin ? <RewardSection rewards={data.rewards} /> : <ReadOnlyNote />}
        </Section>

        <Section title="Library modules" description="Self-paced reading. The assessment itself is a D-track task.">
          {isAdmin ? <LibrarySection modules={data.libraryModules} /> : <ReadOnlyNote />}
        </Section>
      </div>

      <div className="flex flex-col gap-5">
        <Section title="Cohort" description={`${data.cohort.name} · week ${data.cohort.week}`}>
          <div className="mb-3 flex flex-col gap-1 text-sm text-ink-60">
            <p className="flex justify-between">
              <span>Starts</span> <span className="text-ink">{fullDate(data.cohort.startsAt)}</span>
            </p>
            <p className="flex justify-between">
              <span>Ends</span> <span className="text-ink">{fullDate(data.cohort.endsAt)}</span>
            </p>
            <p className="flex justify-between">
              <span>Signal bands</span>
              <span className="font-mono text-ink">{BANDS.map((b) => `${b.floor}+`).join(" · ")}</span>
            </p>
          </div>
          {isAdmin && <CohortSection cohorts={data.cohorts} />}
        </Section>

        <Section title="Campuses" description="A campus is also created on demand when you add a person to a new one.">
          {isAdmin ? <CampusSection campuses={data.campuses} cohorts={data.cohorts} defaultCohortId={data.cohort.id} /> : <ReadOnlyNote />}
        </Section>

        <Section
          title="Who can review"
          description="Reviewers grade. Only admins decide applications, publish tasks, fulfil rewards and manage people."
        >
          <StaffSection staff={data.reviewers} meId={meId} />
        </Section>

        <Section title="Recent decisions" description="What this console has changed about people, work and standing.">
          <AuditSection events={data.audit} />
        </Section>

        <Section title="Your password" description="Operators get a password too. The emailed link still works either way.">
          <PasswordForm hasPassword={hasPassword} email={meEmail} />
        </Section>

        <Section title="Measurement corpus" description="Every structured submission, flattened for analysis.">
          <a href="/api/export/measurements" className="btn-ghost btn-sm self-start">
            Export CSV
          </a>
        </Section>
      </div>
    </div>
  );
}

function ReadOnlyNote() {
  return <p className="text-xs text-ink-45">Read-only for reviewers. An admin can edit this.</p>;
}
