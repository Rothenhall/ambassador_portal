import { safeHref } from "@/lib/validation";
import type { SubmissionContent } from "@/lib/submission-content";
import { draft } from "@/lib/submission-content";
import type { ClientTaskConfig } from "@/lib/tasks";
import { IconArrowUpRight } from "@/components/icons";

function ExternalLink({ href, children, className = "" }: { href: unknown; children: React.ReactNode; className?: string }) {
  const safe = safeHref(href);
  if (!safe) {
    return (
      <span className={`font-mono text-cognac-deep ${className}`} title="This address was rejected as not a valid http(s) URL">
        {String(children)} <span className="text-cognac-deep">· not a link</span>
      </span>
    );
  }
  return (
    <a href={safe} target="_blank" rel="noreferrer noopener" className={`border-0 text-cognac-deep hover:underline ${className}`}>
      {children} <IconArrowUpRight className="h-3.5 w-3.5" />
    </a>
  );
}

type Snapshot = {
  fetchedAt?: string;
  ok?: boolean;
  status?: number;
  title?: string | null;
  description?: string | null;
  finalUrl?: string | null;
  blocked?: string;
};

export function SubmissionViewer({
  type,
  config,
  content,
  ambassadorPageUrl,
}: {
  type: string;
  config: ClientTaskConfig;
  content: SubmissionContent;
  ambassadorPageUrl?: string | null;
}) {
  switch (type) {
    case "link": {
      const snapshot = draft<Snapshot>(content.snapshot);
      const note = draft<string>(content.note);
      return (
        <div className="flex flex-col gap-2">
          <ExternalLink href={content.url} className="font-mono text-sm">
            {String(content.url ?? "")}
          </ExternalLink>
          {note && <p className="text-sm text-ink-60">{note}</p>}
          {ambassadorPageUrl && (
            <p className="text-xs text-ink-45">
              Claimed page: <ExternalLink href={ambassadorPageUrl} className="font-mono text-xs">{String(ambassadorPageUrl)}</ExternalLink>
            </p>
          )}
          {snapshot && (
            <div className="rounded-sm2 border border-line bg-canvas-2/40 px-3 py-2 text-xs text-ink-60">
              {snapshot.ok ? (
                <>
                  <p className="font-medium text-ink">Snapshot taken at submit</p>
                  {snapshot.title && <p className="truncate">Title: {snapshot.title}</p>}
                  {snapshot.description && <p className="line-clamp-2">Description: {snapshot.description}</p>}
                  <p className="text-ink-45">
                    {snapshot.fetchedAt ? new Date(snapshot.fetchedAt).toLocaleString("en-IN") : "time not recorded"} · status {snapshot.status ?? "—"}
                  </p>
                </>
              ) : (
                <p className="text-cognac-deep">
                  We could not read that page when this was submitted
                  {snapshot.blocked === "private" ? " (the address points somewhere internal, so we did not fetch it)" : ""}
                  {snapshot.status ? ` — server answered ${snapshot.status}` : ""}. Review the link yourself.
                </p>
              )}
            </div>
          )}
        </div>
      );
    }

    case "link_set":
      return (
        <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {(draft<{ key: string; url: string }[]>(content.rows) ?? []).map((r) => {
            const label = config.link_set?.rows.find((x) => x.key === r.key)?.label ?? r.key;
            return (
              <div key={r.key} className="flex flex-col gap-0.5 rounded-sm2 border border-line bg-paper px-3 py-2">
                <dt className="text-[0.65rem] uppercase tracking-wider text-ink-45">{label}</dt>
                <dd className="truncate">
                  <ExternalLink href={r.url} className="font-mono text-xs">
                    {r.url}
                  </ExternalLink>
                </dd>
              </div>
            );
          })}
        </dl>
      );

    case "document":
      return (
        <div className="rounded-sm2 border border-line bg-paper p-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-80">{String(content.body ?? "")}</p>
          <p className="mt-2 text-xs text-ink-45">{draft<number>(content.wordCount) ?? 0} words</p>
        </div>
      );

    case "upload":
      return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(draft<{ name: string; dataUrl: string; caption?: string }[]>(content.files) ?? []).map((f, i) => (
            <div key={i} className="overflow-hidden rounded-sm2 border border-line bg-paper">
              {typeof f.dataUrl === "string" && f.dataUrl.startsWith("data:image") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.dataUrl} alt={f.name} className="h-24 w-full object-cover" />
              ) : (
                <div className="flex h-24 items-center justify-center bg-canvas-2 text-xs text-ink-45">PDF</div>
              )}
              {f.caption && <p className="border-t border-line px-2 py-1.5 text-xs text-ink-60">{f.caption}</p>}
            </div>
          ))}
        </div>
      );

    case "structured": {
      const cols = config.structured?.columns ?? [];
      return (
        <div className="overflow-x-auto rounded-sm2 border border-line">
          <table className="w-full min-w-[36rem] border-collapse text-xs">
            <thead>
              <tr className="bg-canvas-2">
                {cols.map((c) => (
                  <th key={c.key} className="border-b border-line px-2.5 py-1.5 text-left font-medium uppercase tracking-wide text-brass-deep">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(draft<Record<string, string>[]>(content.rows) ?? []).map((r, i) => (
                <tr key={i} className="border-b border-line text-ink-60 last:border-0">
                  {cols.map((c) => (
                    <td key={c.key} className="max-w-[16rem] truncate px-2.5 py-1.5">
                      {r[c.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-line bg-canvas-2 px-2.5 py-1 text-[0.65rem] text-ink-45">{(draft<Record<string, string>[]>(content.rows) ?? []).length} rows</p>
        </div>
      );
    }

    case "roster":
      return (
        <div className="flex flex-col gap-2">
          {(draft<Record<string, string>[]>(content.rows) ?? []).map((r, i) => (
            <div key={i} className="rounded-sm2 border border-line bg-paper p-3 text-sm">
              {Object.entries(r).map(([k, v]) => (
                <p key={k} className="text-ink-60">
                  <span className="text-ink-45">{k}:</span> {v}
                </p>
              ))}
            </div>
          ))}
        </div>
      );

    case "quiz":
      return (
        <div className="flex flex-col gap-2 text-sm text-ink-60">
          <p>
            Scored server-side:{" "}
            <strong className="text-ink">
              {typeof content.score === "number" ? content.score : "-"}
            </strong>{" "}
            of {typeof content.total === "number" ? content.total : "?"} correct
          </p>
          {Boolean(content.practicalText) && (
            <div className="rounded-sm2 border border-line bg-paper p-3 whitespace-pre-wrap">{String(content.practicalText)}</div>
          )}
        </div>
      );

    default:
      return <p className="text-sm text-ink-45">Unrecognised submission type.</p>;
  }
}
