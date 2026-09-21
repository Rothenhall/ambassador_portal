"use client";

import { useState } from "react";
import { createAmbassador } from "@/lib/actions/manage";
import { useActionRunner } from "@/components/use-action-runner";
import { Field, FormFooter, Select, TextInput } from "@/components/admin/fields";
import type { AdminDashboardData } from "@/lib/admin-dashboard";

const TIERS = ["applicant", "ambassador", "senior", "campus_lead", "alumnus"];
const ROLES = ["ambassador", "reviewer", "admin"];

const tierLabel = (t: string) => t.replace("_", " ");

export function AddPersonForm({ cohorts, campuses }: { cohorts: AdminDashboardData["cohorts"]; campuses: AdminDashboardData["campuses"] }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [campusName, setCampusName] = useState("");
  const [city, setCity] = useState("");
  const [cohortId, setCohortId] = useState(cohorts.find((c) => c.status === "active")?.id ?? cohorts[0]?.id ?? "");
  const [password, setPassword] = useState("");
  const [tier, setTier] = useState("ambassador");
  const [role, setRole] = useState("ambassador");
  const { run, status, pending } = useActionRunner();

  const cohortCampuses = campuses; // campus is chosen by name; the cohort decides where the seat lands
  const ready = name.trim().length >= 2 && /\S+@\S+\.\S+/.test(email) && campusName.trim().length >= 2 && cohortId;

  async function submit() {
    const result = await run(() =>
      createAmbassador({ name, email, campusName, city, cohortId, tier, role, password })
    );
    if (result?.ok) {
      setName("");
      setEmail("");
      setCampusName("");
      setCity("");
      setPassword("");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Name">
          <TextInput value={name} onChange={setName} placeholder="Full name" max={120} />
        </Field>
        <Field label="Email" hint="This is their login. There is no password — a link goes to this address.">
          <TextInput value={email} onChange={setEmail} type="email" placeholder="name@college.edu" max={254} />
        </Field>
        <Field label="Campus" hint="Type a new campus name to create it in the chosen cohort.">
          <TextInput value={campusName} onChange={setCampusName} placeholder="Ashoka University" max={120} list="campus-names" />
        </Field>
        <Field label="City">
          <TextInput value={city} onChange={setCity} placeholder="Optional" max={80} />
        </Field>
        <Field label="Cohort">
          <Select
            value={cohortId}
            onChange={setCohortId}
            options={cohorts.map((c) => ({ value: c.id, label: `${c.name} · ${c.members} members` }))}
          />
        </Field>
        <Field label="Role">
          <Select value={role} onChange={setRole} options={ROLES.map((r) => ({ value: r, label: r }))} />
        </Field>
        <Field label="Initial password" hint="Optional. Blank means they sign in by emailed link until they set one.">
          <TextInput value={password} onChange={setPassword} placeholder="leave blank to leave unset" max={200} />
        </Field>
        {role === "ambassador" && (
          <Field label="Starting tier" hint="Tier decides which rewards unlock; Signal does the rest.">
            <Select value={tier} onChange={setTier} options={TIERS.map((t) => ({ value: t, label: tierLabel(t) }))} />
          </Field>
        )}
      </div>

      <datalist id="campus-names">
        {cohortCampuses.map((c) => (
          <option key={c.id} value={c.name} />
        ))}
      </datalist>

      <FormFooter status={status} pending={pending} submitLabel="Add person and send invite" onSubmit={submit} disabled={!ready} />
    </div>
  );
}
