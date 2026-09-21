"use client";

import { useState } from "react";
import { createTask, updateTask } from "@/lib/actions/manage";
import { useActionRunner } from "@/components/use-action-runner";
import { Field, FormFooter, NumberInput, Select, TextArea, TextInput } from "@/components/admin/fields";
import type { AdminDashboardData } from "@/lib/admin-dashboard";

type TaskRow = AdminDashboardData["tasks"][number];
type Cfg = Record<string, unknown>;

const TYPES = [
  { value: "link", label: "One link" },
  { value: "link_set", label: "Set of links" },
  { value: "document", label: "Written document" },
  { value: "upload", label: "File uploads" },
  { value: "structured", label: "Table of rows" },
  { value: "roster", label: "Roster of people" },
  { value: "quiz", label: "Assessment (scored)" },
];

function defaultsFor(type: string): Cfg {
  switch (type) {
    case "link":
      return { label: "Published URL", placeholder: "https://yourname.dev/..." };
    case "link_set":
      return { rows: [{ key: "own_page", label: "Your page", placeholder: "https://yourname.dev" }] };
    case "document":
      return { minWords: 250, maxWords: 400, placeholder: "" };
    case "upload":
      return { maxFiles: 4, label: "Evidence", captionLabel: "What this shows" };
    case "structured":
      return { columns: [{ key: "prompt", label: "Prompt", type: "text" }], minRows: 1 };
    case "roster":
      return { fields: [{ key: "name", label: "Name", type: "text" }], minRows: 1 };
    case "quiz":
      return { questions: [{ prompt: "", options: ["", ""], correctIndex: 0 }] };
    default:
      return {};
  }
}

/** Reads the stored config for a type, falling back to a blank shape of that type. */
function initialCfg(type: string, config: Cfg | undefined): Cfg {
  const stored = config?.[type];
  if (stored && typeof stored === "object") return { [type]: stored } as Cfg;
  return { [type]: defaultsFor(type) } as Cfg;
}

/** yyyy-mm-dd string that is `days` after the given yyyy-mm-dd string. */
function plusDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function TaskEditor({
  task,
  cohorts,
  defaultCohortId,
  onDone,
  onCancel,
}: {
  task: TaskRow | null;
  cohorts: AdminDashboardData["cohorts"];
  defaultCohortId: string;
  onDone?: () => void;
  onCancel: () => void;
}) {
  const editing = Boolean(task);
  const { run, status, pending } = useActionRunner();

  const [cohortId, setCohortId] = useState(task?.cohortId ?? defaultCohortId);
  const [code, setCode] = useState(task?.code ?? "");
  const [week, setWeek] = useState(task?.week ?? 1);
  const [title, setTitle] = useState(task?.title ?? "");
  const [summary, setSummary] = useState(task?.summary ?? "");
  const [briefMd, setBriefMd] = useState(task?.briefMd ?? "");
  const [signalValue, setSignalValue] = useState(task?.signalValue ?? 30);
  const [opensAt, setOpensAt] = useState(task?.opensDate ?? new Date().toISOString().slice(0, 10));
  const [dueAt, setDueAt] = useState(task?.dueDate ?? plusDays(opensAt, 6));
  const [published, setPublished] = useState(task ? task.published : true);
  const [type, setType] = useState<string>(task?.submissionType ?? "link");
  const [rubric, setRubric] = useState<string[]>(task?.rubric?.length ? [...task.rubric] : [""]);
  const [cfg, setCfg] = useState<Cfg>(() => (task ? initialCfg(task.submissionType, task.typeConfig as Cfg) : initialCfg("link", undefined)));

  const track = (code.trim()[0] ?? "A").toUpperCase();
  const typeConfig = (cfg[type] ?? defaultsFor(type)) as Record<string, unknown>;
  const frozen = editing && (task?.submissions ?? 0) > 0;
  const ready =
    code.trim().length >= 2 &&
    title.trim().length >= 3 &&
    summary.trim().length >= 3 &&
    briefMd.trim().length >= 20 &&
    rubric.filter(Boolean).length >= 1 &&
    signalValue >= 1;

  function changeType(next: string) {
    setType(next);
    setCfg(initialCfg(next, cfg));
  }

  function payload() {
    return {
      cohortId,
      track,
      code: code.trim().toUpperCase(),
      week,
      title: title.trim(),
      summary: summary.trim(),
      briefMd: briefMd.trim(),
      submissionType: type,
      rubric: rubric.map((r) => r.trim()).filter(Boolean),
      signalValue,
      opensAt,
      dueAt,
      published,
      typeConfig,
    };
  }

  function submit() {
    void run(() => (task ? updateTask(task.id, payload()) : createTask(payload()))).then((result) => {
      if (result?.ok) onDone?.();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Cohort" hint={editing ? "A task cannot move between cohorts." : undefined}>
          <Select
            value={cohortId}
            disabled={editing}
            onChange={setCohortId}
            options={cohorts.map((c) => ({ value: c.id, label: c.name }))}
          />
        </Field>
        <Field label="Code" hint={`Track is taken from the first letter — currently ${track}.`}>
          <TextInput value={code} onChange={setCode} placeholder="B2" max={3} disabled={frozen} />
        </Field>
        <Field label="Week">
          <NumberInput value={week} onChange={setWeek} min={1} max={24} />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_8rem]">
        <Field label="Title">
          <TextInput value={title} onChange={setTitle} placeholder="Primary research" max={120} />
        </Field>
        <Field label="Signal">
          <NumberInput value={signalValue} onChange={setSignalValue} min={1} max={500} />
        </Field>
      </div>

      <Field label="One-line summary" hint="What shows on the task card.">
        <TextInput value={summary} onChange={setSummary} placeholder="Five sources, one table, your own read of them." max={200} />
      </Field>

      <Field label="Brief" hint="Blank line between paragraphs. Ambassadors read this before they start.">
        <TextArea value={briefMd} onChange={setBriefMd} rows={8} placeholder={"What to do.\n\nWhat good looks like."} />
      </Field>

      <div>
        <p className="mb-1.5 text-xs font-medium text-ink-60">Rubric — every line must be met to accept</p>
        <div className="flex flex-col gap-2">
          {rubric.map((line, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                className="input"
                value={line}
                maxLength={240}
                placeholder={`Line ${i + 1}`}
                onChange={(e) => setRubric((rs) => rs.map((r, j) => (j === i ? e.target.value : r)))}
              />
              <button
                type="button"
                className="shrink-0 rounded-full px-2 py-1 text-xs text-ink-45 hover:bg-canvas-2 hover:text-cognac-deep"
                disabled={rubric.length <= 1}
                onClick={() => setRubric((rs) => rs.filter((_, j) => j !== i))}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button type="button" className="mt-2 text-xs font-medium text-cognac-deep hover:underline" onClick={() => setRubric((rs) => [...rs, ""])}>
          + Add rubric line
        </button>
        {frozen && <p className="mt-1.5 text-[0.7rem] text-cognac-deep">Ambassadors have already submitted against this brief. Editing the rubric changes how future attempts are graded, not past ones.</p>}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Opens">
          <TextInput value={opensAt} onChange={setOpensAt} type="date" />
        </Field>
        <Field label="Due">
          <TextInput value={dueAt} onChange={setDueAt} type="date" />
        </Field>
        <Field label="Published">
          <Select
            value={published ? "yes" : "no"}
            onChange={(v) => setPublished(v === "yes")}
            options={[
              { value: "yes", label: "Live for ambassadors" },
              { value: "no", label: "Draft — hidden" },
            ]}
          />
        </Field>
      </div>

      <div className="rounded-sm2 border border-line bg-canvas-2/40 p-3.5">
        <Field label="What ambassadors hand in" hint={frozen ? "Frozen while submissions exist — publish a new task to change the format." : undefined}>
          <Select value={type} disabled={frozen} onChange={changeType} options={TYPES} />
        </Field>
        <div className="mt-3">
          <ConfigFields type={type} value={typeConfig} onChange={(next) => setCfg({ ...cfg, [type]: next })} />
        </div>
      </div>

      {frozen && (
        <p className="text-xs text-ink-45">
          {task?.submissions} submission{task?.submissions === 1 ? "" : "s"} already exist against this task. Text, rubric, dates and Signal can still be
          changed; the format and the code cannot.
        </p>
      )}

      <FormFooter status={status} pending={pending} submitLabel={editing ? "Save task" : "Create task"} onSubmit={submit} onCancel={onCancel} disabled={!ready} />
    </div>
  );
}

// ── per-type config forms ───────────────────────────────────────────────────

function ConfigFields({ type, value, onChange }: { type: string; value: Record<string, unknown>; onChange: (next: Record<string, unknown>) => void }) {
  const get = (k: string, fallback = "") => String(value[k] ?? fallback);
  const set = (k: string, v: unknown) => onChange({ ...value, [k]: v });

  if (type === "link") {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Field label">
          <TextInput value={get("label")} onChange={(v) => set("label", v)} max={80} />
        </Field>
        <Field label="Placeholder">
          <TextInput value={get("placeholder")} onChange={(v) => set("placeholder", v)} max={160} />
        </Field>
        <Field label="Note field label" className="sm:col-span-2">
          <TextInput value={get("noteLabel")} onChange={(v) => set("noteLabel", v)} placeholder="Optional — leave blank to hide the note box" max={120} />
        </Field>
      </div>
    );
  }

  if (type === "document") {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Minimum words">
          <NumberInput value={Number(value.minWords ?? 250)} onChange={(v) => set("minWords", v)} min={1} max={3000} />
        </Field>
        <Field label="Maximum words">
          <NumberInput value={Number(value.maxWords ?? 400)} onChange={(v) => set("maxWords", v)} min={1} max={8000} />
        </Field>
        <Field label="Placeholder">
          <TextInput value={get("placeholder")} onChange={(v) => set("placeholder", v)} max={160} />
        </Field>
      </div>
    );
  }

  if (type === "upload") {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Max files">
          <NumberInput value={Number(value.maxFiles ?? 4)} onChange={(v) => set("maxFiles", v)} min={1} max={12} />
        </Field>
        <Field label="Field label">
          <TextInput value={get("label")} onChange={(v) => set("label", v)} max={80} />
        </Field>
        <Field label="Caption label">
          <TextInput value={get("captionLabel")} onChange={(v) => set("captionLabel", v)} placeholder="Optional" max={120} />
        </Field>
        <p className="text-[0.7rem] text-ink-45 sm:col-span-3">PNG, JPEG, WebP, GIF or PDF, up to 1.75 MB each.</p>
      </div>
    );
  }

  if (type === "link_set" || type === "structured" || type === "roster") {
    const listKey = type === "link_set" ? "rows" : type === "structured" ? "columns" : "fields";
    const rows = Array.isArray(value[listKey]) ? (value[listKey] as Record<string, unknown>[]) : [];
    const label = type === "link_set" ? "Link" : type === "structured" ? "Column" : "Field";
    const update = (next: Record<string, unknown>[]) => onChange({ ...value, [listKey]: next });
    const add = () =>
      update([
        ...rows,
        type === "link_set"
          ? { key: "", label: "", placeholder: "https://" }
          : type === "structured"
            ? { key: "", label: "", type: "text", options: [] }
            : { key: "", label: "", type: "text" },
      ]);

    return (
      <div className="flex flex-col gap-2.5">
        {rows.map((row, i) => (
          <div key={i} className="flex flex-wrap items-end gap-2 rounded-sm2 border border-line bg-paper p-2.5">
            <Field label={`${label} key`} className="w-36">
              <TextInput
                value={String(row.key ?? "")}
                onChange={(v) => update(rows.map((r, j) => (j === i ? { ...r, key: v.toLowerCase().replace(/[^a-z0-9_]/g, "") } : r)))}
                placeholder="linkedin"
                max={40}
              />
            </Field>
            <Field label="Label" className="min-w-[10rem] flex-1">
              <TextInput value={String(row.label ?? "")} onChange={(v) => update(rows.map((r, j) => (j === i ? { ...r, label: v } : r)))} max={80} />
            </Field>
            {type === "link_set" && (
              <Field label="Placeholder" className="min-w-[10rem] flex-1">
                <TextInput value={String(row.placeholder ?? "")} onChange={(v) => update(rows.map((r, j) => (j === i ? { ...r, placeholder: v } : r)))} max={160} />
              </Field>
            )}
            {type === "structured" && (
              <>
                <Field label="Type" className="w-32">
                  <Select
                    value={String(row.type ?? "text")}
                    onChange={(v) => update(rows.map((r, j) => (j === i ? { ...r, type: v } : r)))}
                    options={[
                      { value: "text", label: "Text" },
                      { value: "textarea", label: "Long text" },
                      { value: "select", label: "Dropdown" },
                    ]}
                  />
                </Field>
                {row.type === "select" && (
                  <Field label="Choices, comma-separated" className="min-w-[12rem] flex-1">
                    <TextInput
                      value={Array.isArray(row.options) ? (row.options as string[]).join(", ") : ""}
                      onChange={(v) =>
                        update(rows.map((r, j) => (j === i ? { ...r, options: v.split(",").map((s) => s.trim()).filter(Boolean) } : r)))
                      }
                      placeholder="ChatGPT, Claude, Gemini"
                    />
                  </Field>
                )}
              </>
            )}
            {type === "roster" && (
              <Field label="Type" className="w-32">
                <Select
                  value={String(row.type ?? "text")}
                  onChange={(v) => update(rows.map((r, j) => (j === i ? { ...r, type: v } : r)))}
                  options={[
                    { value: "text", label: "Text" },
                    { value: "textarea", label: "Long text" },
                  ]}
                />
              </Field>
            )}
            <button
              type="button"
              className="mb-1 shrink-0 rounded-full px-2 py-1 text-xs text-ink-45 hover:bg-canvas-2 hover:text-cognac-deep"
              disabled={rows.length <= 1}
              onClick={() => update(rows.filter((_, j) => j !== i))}
            >
              Remove
            </button>
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="text-xs font-medium text-cognac-deep hover:underline" onClick={add}>
            + Add {label.toLowerCase()}
          </button>
          {(type === "structured" || type === "roster") && (
            <Field label="Minimum rows" className="w-32">
              <NumberInput value={Number(value.minRows ?? 1)} onChange={(v) => set("minRows", v)} min={1} max={200} />
            </Field>
          )}
        </div>
      </div>
    );
  }

  if (type === "quiz") {
    type Question = { prompt?: string; options?: string[]; correctIndex?: number };
    const questions: Question[] = Array.isArray(value.questions) ? (value.questions as Question[]) : [];
    const update = (next: Question[]) => onChange({ ...value, questions: next });
    const patch = (i: number, part: Partial<Question>) => update(questions.map((q, j) => (j === i ? { ...q, ...part } : q)));

    return (
      <div className="flex flex-col gap-3">
        {questions.map((q, i) => {
          const options = Array.isArray(q.options) ? q.options : ["", ""];
          return (
            <div key={i} className="flex flex-col gap-2 rounded-sm2 border border-line bg-paper p-3">
              <div className="flex items-start gap-2">
                <Field label={`Question ${i + 1}`} className="min-w-0 flex-1">
                  <TextArea value={String(q.prompt ?? "")} onChange={(v) => patch(i, { prompt: v })} rows={2} />
                </Field>
                <button
                  type="button"
                  className="mt-5 shrink-0 rounded-full px-2 py-1 text-xs text-ink-45 hover:bg-canvas-2 hover:text-cognac-deep"
                  disabled={questions.length <= 1}
                  onClick={() => update(questions.filter((_, j) => j !== i))}
                >
                  Remove
                </button>
              </div>
              <p className="text-[0.7rem] text-ink-45">Options — mark the correct one. The key is never sent to the browser before an attempt is graded.</p>
              <div className="flex flex-col gap-1.5">
                {options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${i}`}
                      checked={(q.correctIndex ?? 0) === oi}
                      onChange={() => patch(i, { correctIndex: oi })}
                      className="h-3.5 w-3.5 shrink-0 accent-[#a85c30]"
                      aria-label={`Mark option ${oi + 1} of question ${i + 1} correct`}
                    />
                    <input
                      className="input"
                      value={opt}
                      maxLength={200}
                      onChange={(e) => patch(i, { options: options.map((o, j) => (j === oi ? e.target.value : o)) })}
                    />
                    <button
                      type="button"
                      className="shrink-0 rounded-full px-2 py-1 text-xs text-ink-45 hover:bg-canvas-2 hover:text-cognac-deep"
                      disabled={options.length <= 2}
                      onClick={() => patch(i, { options: options.filter((_, j) => j !== oi) })}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="self-start text-xs font-medium text-cognac-deep hover:underline"
                  disabled={options.length >= 6}
                  onClick={() => patch(i, { options: [...options, ""] })}
                >
                  + Add option
                </button>
              </div>
            </div>
          );
        })}
        <button
          type="button"
          className="self-start text-xs font-medium text-cognac-deep hover:underline"
          disabled={questions.length >= 50}
          onClick={() => update([...questions, { prompt: "", options: ["", ""], correctIndex: 0 }])}
        >
          + Add question
        </button>
        <Field label="Written part prompt" hint="Leave blank for a purely multiple-choice assessment.">
          <TextInput value={get("practicalPrompt")} onChange={(v) => set("practicalPrompt", v)} max={400} />
        </Field>
      </div>
    );
  }

  return <p className="text-xs text-ink-45">No options for this submission type.</p>;
}
