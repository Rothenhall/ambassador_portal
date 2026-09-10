import { fullDate } from "@/lib/format";
import { BANDS } from "@/lib/signal";
import { postAnnouncement } from "@/lib/actions/admin";
import type { AdminDashboardData } from "@/lib/admin-dashboard";

function relativeFromISO(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function SettingsPanel({ data }: { data: AdminDashboardData }) {
  return (
    <div className="grid grid-cols-1 gap-6 px-6 py-5 lg:grid-cols-2">
      <div className="flex flex-col gap-6">
        <div>
          <p className="eyebrow mb-2.5 !text-[0.6rem]">Post an announcement</p>
          <form action={postAnnouncement.bind(null, data.cohort.id)} className="card flex flex-col gap-2.5 p-3.5">
            <textarea name="bodyMd" className="input" rows={2} placeholder="Shows on every ambassador's dashboard, until the next one replaces it." />
            <button className="btn-primary btn-sm self-start">Post</button>
          </form>
          <div className="mt-3 flex flex-col divide-y divide-line rounded-sm2 border border-line bg-paper">
            {data.announcements.map((a) => (
              <div key={a.id} className="px-3.5 py-2.5 text-sm">
                <p className="text-ink-60">{a.bodyMd}</p>
                <p className="mt-0.5 text-xs text-ink-45">{relativeFromISO(a.publishedAtISO)}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="eyebrow mb-2.5 !text-[0.6rem]">Library modules</p>
          <div className="flex flex-col divide-y divide-line rounded-sm2 border border-line bg-paper text-sm">
            {data.libraryModules.map((m) => (
              <div key={m.id} className="px-3.5 py-2 text-ink-60">
                {m.code} · {m.title}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="card p-4">
          <p className="eyebrow mb-2.5 !text-[0.6rem]">Cohort</p>
          <div className="flex flex-col gap-1 text-sm text-ink-60">
            <p className="flex justify-between">
              <span>Name</span> <span className="text-ink">{data.cohort.name}</span>
            </p>
            <p className="flex justify-between">
              <span>Starts</span> <span className="text-ink">{fullDate(data.cohort.startsAt)}</span>
            </p>
            <p className="flex justify-between">
              <span>Ends</span> <span className="text-ink">{fullDate(data.cohort.endsAt)}</span>
            </p>
          </div>
        </div>

        <div className="card p-4">
          <p className="eyebrow mb-2.5 !text-[0.6rem]">Signal bands</p>
          <div className="flex flex-col gap-1 text-sm text-ink-60">
            {BANDS.map((b) => (
              <p key={b.label} className="flex justify-between">
                <span>{b.label}</span> <span className="font-mono text-ink">{b.floor}+</span>
              </p>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <p className="eyebrow mb-2.5 !text-[0.6rem]">Reviewers</p>
          <div className="flex flex-col gap-1 text-sm text-ink-60">
            {data.reviewers.map((r) => (
              <p key={r.id} className="flex justify-between">
                <span>{r.name}</span> <span className="text-ink-45">{r.role}</span>
              </p>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <p className="eyebrow mb-1.5 !text-[0.6rem]">Measurement corpus</p>
          <p className="mb-2.5 text-sm text-ink-45">Every structured submission, flattened for analysis.</p>
          <a href="/api/export/measurements" className="btn-ghost btn-sm">
            Export CSV
          </a>
        </div>
      </div>
    </div>
  );
}
