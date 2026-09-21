"use client";

import { useState } from "react";
import { createCampus, createCohort, createReward, saveLibraryModule, setUserRole, updateReward } from "@/lib/actions/manage";
import { useActionRunner } from "@/components/use-action-runner";
import { ActionNote } from "@/components/ActionNote";
import { Field, FormFooter, NumberInput, Select, TextArea, TextInput } from "@/components/admin/fields";
import type { AdminDashboardData } from "@/lib/admin-dashboard";

const TIERS = ["applicant", "ambassador", "senior", "campus_lead", "alumnus"];
const ROLES = ["ambassador", "reviewer", "admin"];
const FULFILMENT = [
  { value: "digital", label: "Digital — nothing to ship" },
  { value: "shipped", label: "Shipped — collects an address" },
  { value: "scheduled", label: "Scheduled — a session to book" },
  { value: "none", label: "None — status only" },
];

/** Collapsible "add / edit" wrapper so a list of these does not fill the screen with forms. */
function Disclosure({ title, open, onToggle, children }: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-sm2 border border-line bg-canvas-2/30">
      <button type="button" className="w-full px-3.5 py-2.5 text-left text-sm font-medium text-ink hover:text-cognac-deep" onClick={onToggle}>
        {open ? "Close" : title}
      </button>
      {open && <div className="border-t border-line px-3.5 py-3">{children}</div>}
    </div>
  );
}

export function RewardForm({ reward, onDone }: { reward: AdminDashboardData["rewards"][number] | null; onDone: () => void }) {
  const { run, status, pending } = useActionRunner();
  const [code, setCode] = useState(reward?.code ?? "");
  const [name, setName] = useState(reward?.name ?? "");
  const [description, setDescription] = useState(reward?.description ?? "");
  const [tierGate, setTierGate] = useState<string>(reward?.tierGate ?? "ambassador");
  const [signalGate, setSignalGate] = useState(reward?.signalGate ?? 0);
  const [fulfilmentType, setFulfilmentType] = useState<string>(reward?.fulfilmentType ?? "digital");
  const frozen = Boolean(reward && reward.grants > 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Code" hint={frozen ? `Frozen — ${reward?.grants} grant(s) reference it.` : "lower-case, used in code"}>
          <TextInput value={code} onChange={setCode} disabled={frozen} max={40} placeholder="letter_of_recommendation" />
        </Field>
        <Field label="Name">
          <TextInput value={name} onChange={setName} max={80} placeholder="A named letter of recommendation" />
        </Field>
      </div>
      <Field label="Description" hint="What the ambassador sees under the reward.">
        <TextInput value={description} onChange={setDescription} max={300} />
      </Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Tier gate">
          <Select value={tierGate} onChange={setTierGate} options={TIERS.map((t) => ({ value: t, label: t.replace("_", " ") }))} />
        </Field>
        <Field label="Signal gate">
          <NumberInput value={signalGate} onChange={setSignalGate} min={0} max={5000} />
        </Field>
        <Field label="Fulfilment">
          <Select value={fulfilmentType} onChange={setFulfilmentType} options={FULFILMENT} />
        </Field>
      </div>
      <FormFooter
        status={status}
        pending={pending}
        submitLabel={reward ? "Save reward" : "Add reward"}
        disabled={code.trim().length < 2 || name.trim().length < 3 || description.trim().length < 3}
        onSubmit={() =>
          void run(() =>
            reward
              ? updateReward(reward.id, { code, name, description, tierGate, signalGate, fulfilmentType })
              : createReward({ code, name, description, tierGate, signalGate, fulfilmentType })
          ).then((r) => r?.ok && onDone())
        }
        onCancel={onDone}
      />
    </div>
  );
}

export function RewardSection({ rewards }: { rewards: AdminDashboardData["rewards"] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const target = rewards.find((r) => r.id === editing) ?? null;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-col divide-y divide-line rounded-sm2 border border-line bg-paper text-sm">
        {rewards.map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-3 px-3.5 py-2">
            <div className="min-w-0">
              <p className="truncate text-ink">
                {r.name} <span className="font-mono text-[0.7rem] text-ink-45">{r.code}</span>
              </p>
              <p className="truncate text-xs text-ink-45">
                {r.tierGate.replace("_", " ")} · {r.signalGate} Signal · {r.fulfilmentType}
                {r.grants > 0 && ` · ${r.grants} granted`}
              </p>
            </div>
            <button
              className="shrink-0 text-xs font-medium text-cognac-deep hover:underline"
              onClick={() => {
                setEditing(r.id);
                setOpen(true);
              }}
            >
              Edit
            </button>
          </div>
        ))}
      </div>
      <Disclosure title={editing ? `Edit ${target?.name ?? "reward"}` : "Add a reward"} open={open} onToggle={() => setOpen((v) => !v)}>
        <RewardForm
          reward={target}
          onDone={() => {
            setOpen(false);
            setEditing(null);
          }}
        />
      </Disclosure>
    </div>
  );
}

export function LibraryModuleForm({ mod, onDone }: { mod: AdminDashboardData["libraryModules"][number] | null; onDone: () => void }) {
  const { run, status, pending } = useActionRunner();
  const [code, setCode] = useState(mod?.code ?? "D7");
  const [title, setTitle] = useState(mod?.title ?? "");
  const [summary, setSummary] = useState(mod?.summary ?? "");
  const [bodyMd, setBodyMd] = useState(mod?.bodyMd ?? "");
  const [order, setOrder] = useState(mod?.order ?? 1);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Code">
          <TextInput value={code} onChange={setCode} max={4} placeholder="D3" />
        </Field>
        <Field label="Order">
          <NumberInput value={order} onChange={setOrder} min={1} max={200} />
        </Field>
        <Field label="Title">
          <TextInput value={title} onChange={setTitle} max={120} />
        </Field>
      </div>
      <Field label="Summary" hint="One line under the title in the Library list.">
        <TextInput value={summary} onChange={setSummary} max={200} />
      </Field>
      <Field label="Body" hint="Blank line between paragraphs.">
        <TextArea value={bodyMd} onChange={setBodyMd} rows={8} />
      </Field>
      <FormFooter
        status={status}
        pending={pending}
        submitLabel={mod ? "Save module" : "Add module"}
        disabled={code.trim().length < 2 || title.trim().length < 3 || bodyMd.trim().length < 20}
        onSubmit={() =>
          void run(() =>
            saveLibraryModule(mod?.id ?? null, {
              code: code.trim().toUpperCase(),
              title,
              summary,
              bodyMd,
              order,
            })
          ).then((r) => r?.ok && onDone())
        }
        onCancel={onDone}
      />
    </div>
  );
}

export function LibrarySection({ modules }: { modules: AdminDashboardData["libraryModules"] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const target = modules.find((m) => m.id === editing) ?? null;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-col divide-y divide-line rounded-sm2 border border-line bg-paper text-sm">
        {modules.map((m) => (
          <div key={m.id} className="flex items-center justify-between gap-3 px-3.5 py-2">
            <span className="min-w-0 truncate text-ink-60">
              {m.code} · {m.title}
            </span>
            <button
              className="shrink-0 text-xs font-medium text-cognac-deep hover:underline"
              onClick={() => {
                setEditing(m.id);
                setOpen(true);
              }}
            >
              Edit
            </button>
          </div>
        ))}
        {modules.length === 0 && <p className="px-3.5 py-3 text-sm text-ink-45">Nothing in the library yet.</p>}
      </div>
      <Disclosure title={editing ? `Edit ${target?.code ?? "module"}` : "Add a library module"} open={open} onToggle={() => setOpen((v) => !v)}>
        <LibraryModuleForm
          mod={target}
          onDone={() => {
            setOpen(false);
            setEditing(null);
          }}
        />
      </Disclosure>
    </div>
  );
}

export function CampusSection({ campuses, cohorts, defaultCohortId }: { campuses: AdminDashboardData["campuses"]; cohorts: AdminDashboardData["cohorts"]; defaultCohortId: string }) {
  const { run, status, pending } = useActionRunner();
  const [cohortId, setCohortId] = useState(defaultCohortId);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col divide-y divide-line rounded-sm2 border border-line bg-paper text-sm">
        {campuses.map((c) => (
          <div key={c.id} className="flex items-center justify-between gap-3 px-3.5 py-2">
            <span className="min-w-0 truncate text-ink-60">
              {c.name}
              {c.city ? ` · ${c.city}` : ""}
            </span>
            <span className="shrink-0 text-xs text-ink-45">{c.members} members</span>
          </div>
        ))}
        {campuses.length === 0 && <p className="px-3.5 py-3 text-sm text-ink-45">No campuses in this cohort yet.</p>}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Cohort">
          <Select value={cohortId} onChange={setCohortId} options={cohorts.map((c) => ({ value: c.id, label: c.name }))} />
        </Field>
        <Field label="Campus name">
          <TextInput value={name} onChange={setName} max={120} />
        </Field>
        <Field label="City">
          <TextInput value={city} onChange={setCity} max={80} />
        </Field>
      </div>
      <FormFooter
        status={status}
        pending={pending}
        submitLabel="Add campus"
        disabled={name.trim().length < 2}
        onSubmit={() => void run(() => createCampus({ cohortId, name, city })).then((r) => r?.ok && setName(""))}
      />
    </div>
  );
}

export function CohortSection({ cohorts }: { cohorts: AdminDashboardData["cohorts"] }) {
  const { run, status, pending } = useActionRunner();
  const [name, setName] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col divide-y divide-line rounded-sm2 border border-line bg-paper text-sm">
        {cohorts.map((c) => (
          <div key={c.id} className="flex items-center justify-between gap-3 px-3.5 py-2">
            <span className="min-w-0 truncate text-ink-60">
              {c.name} · {c.startsDate} to {c.endsDate}
            </span>
            <span className="shrink-0 text-xs capitalize text-ink-45">
              {c.status} · {c.members} members · {c.tasks} tasks
            </span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Name" className="sm:col-span-1">
          <TextInput value={name} onChange={setName} placeholder="Campus Circle, Cohort 02" max={120} />
        </Field>
        <Field label="Starts">
          <TextInput value={startsAt} onChange={setStartsAt} type="date" />
        </Field>
        <Field label="Ends">
          <TextInput value={endsAt} onChange={setEndsAt} type="date" />
        </Field>
      </div>
      <FormFooter
        status={status}
        pending={pending}
        submitLabel="Create cohort"
        disabled={name.trim().length < 3 || !startsAt || !endsAt}
        onSubmit={() => void run(() => createCohort({ name, startsAt, endsAt, status: "upcoming" })).then((r) => r?.ok && setName(""))}
      />
    </div>
  );
}

export function StaffSection({ staff, meId }: { staff: AdminDashboardData["reviewers"]; meId: string }) {
  const { run, status } = useActionRunner();
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-col divide-y divide-line rounded-sm2 border border-line bg-paper text-sm">
        {staff.map((s) => (
          <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2">
            <div className="min-w-0">
              <p className="truncate text-ink">
                {s.name} {s.id === meId && <span className="text-xs text-ink-45">(you)</span>}
              </p>
              <p className="truncate text-xs text-ink-45">{s.email}</p>
            </div>
            <div className="w-40">
              <Select
                label={"role for " + s.name}
                value={s.role}
                disabled={s.id === meId}
                onChange={(next) => void run(() => setUserRole(s.id, next))}
                options={ROLES.map((r) => ({ value: r, label: r }))}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-ink-45">
        Changing a role takes effect on that person&apos;s next request — you cannot change your own, so the last admin cannot be
        removed by accident.
      </p>
      <ActionNote status={status} />
    </div>
  );
}

export function AuditSection({ events }: { events: AdminDashboardData["audit"] }) {
  return (
    <div className="flex flex-col divide-y divide-line rounded-sm2 border border-line bg-paper text-sm">
      {events.map((e) => (
        <div key={e.id} className="px-3.5 py-2">
          <p className="text-ink-60">
            <span className="font-medium text-ink">{e.actor?.name ?? "system"}</span>{" "}
            <span className="font-mono text-[0.72rem] text-cognac-deep">{e.action}</span>{" "}
            <span className="text-ink-45">{e.target}</span>
          </p>
          <p className="text-[0.7rem] text-ink-45">
            {new Date(e.createdAtISO).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            {Object.keys(e.meta ?? {}).length > 0 && ` · ${JSON.stringify(e.meta)}`}
          </p>
        </div>
      ))}
      {events.length === 0 && <p className="px-3.5 py-3 text-sm text-ink-45">Nothing recorded yet.</p>}
    </div>
  );
}
