import type { TaskConfig } from "@/lib/tasks";
import { IconArrowUpRight } from "@/components/icons";

export function SubmissionViewer({
  type,
  config,
  content,
}: {
  type: string;
  config: TaskConfig;
  content: Record<string, any>;
}) {
  switch (type) {
    case "link":
      return (
        <div className="flex flex-col gap-2">
          <a
            href={content.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 border-0 font-mono text-sm text-cognac-deep hover:underline"
          >
            {content.url} <IconArrowUpRight className="h-3.5 w-3.5" />
          </a>
          {content.note && <p className="text-sm text-ink-60">{content.note}</p>}
          {content.snapshot && (
            <p className="text-xs text-ink-45">
              Snapshot taken at submit ·{" "}
              {content.snapshot.ok ? `"${content.snapshot.title ?? "no title found"}"` : "fetch failed, reviewer sees the raw link"}
            </p>
          )}
        </div>
      );

    case "link_set":
      return (
        <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {(content.rows ?? []).map((r: { key: string; url: string }) => {
            const label = config.link_set?.rows.find((x) => x.key === r.key)?.label ?? r.key;
            return (
              <div key={r.key} className="flex flex-col gap-0.5 rounded-sm2 border border-line bg-paper px-3 py-2">
                <dt className="text-[0.65rem] uppercase tracking-wider text-ink-45">{label}</dt>
                <dd className="truncate">
                  <a href={r.url} target="_blank" rel="noreferrer" className="border-0 font-mono text-xs text-cognac-deep hover:underline">
                    {r.url}
                  </a>
                </dd>
              </div>
            );
          })}
        </dl>
      );

    case "document":
      return (
        <div className="rounded-sm2 border border-line bg-paper p-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-80">{content.body}</p>
          <p className="mt-2 text-xs text-ink-45">{content.wordCount ?? 0} words</p>
        </div>
      );

    case "upload":
      return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(content.files ?? []).map((f: { name: string; dataUrl: string; caption?: string }, i: number) => (
            <div key={i} className="overflow-hidden rounded-sm2 border border-line bg-paper">
              {f.dataUrl?.startsWith("data:image") ? (
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
              {(content.rows ?? []).map((r: Record<string, string>, i: number) => (
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
          <p className="border-t border-line bg-canvas-2 px-2.5 py-1 text-[0.65rem] text-ink-45">{(content.rows ?? []).length} rows</p>
        </div>
      );
    }

    case "roster":
      return (
        <div className="flex flex-col gap-2">
          {(content.rows ?? []).map((r: Record<string, string>, i: number) => (
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
            Auto-scored: <strong className="text-ink">{content.autoScore ?? "-"}</strong> correct
          </p>
          {content.practicalText && (
            <div className="rounded-sm2 border border-line bg-paper p-3 whitespace-pre-wrap">{content.practicalText}</div>
          )}
        </div>
      );

    default:
      return <p className="text-sm text-ink-45">Unrecognised submission type.</p>;
  }
}
