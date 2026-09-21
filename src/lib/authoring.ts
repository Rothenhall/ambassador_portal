import { z } from "zod";

// Input shapes for the authoring surface: everything an admin can create or edit.
// Submission-time validation lives in validation.ts; this is the other end — the shapes that
// decide what an ambassador will be asked for.

export const ISO_DATE = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a real date.");

export const TRACKS = ["A", "B", "C", "D", "E"] as const;
export const TIERS = ["applicant", "ambassador", "senior", "campus_lead", "alumnus"] as const;
export const ROLES = ["ambassador", "reviewer", "admin"] as const;
export const SUBMISSION_TYPES = ["link", "link_set", "document", "upload", "structured", "roster", "quiz"] as const;
export const FULFILMENT_TYPES = ["digital", "shipped", "scheduled", "none"] as const;

const key = z.string().trim().regex(/^[a-z][a-z0-9_]{0,39}$/, "Use lower-case letters, digits and underscores, starting with a letter.");

const linkConfig = z.object({
  label: z.string().trim().min(2).max(80),
  placeholder: z.string().trim().max(160).default("https://"),
  noteLabel: z.string().trim().max(120).optional().or(z.literal("")),
});

const linkSetConfig = z.object({
  rows: z
    .array(z.object({ key, label: z.string().trim().min(2).max(80), placeholder: z.string().trim().max(160).default("https://") }))
    .min(1)
    .max(12),
});

const documentConfig = z.object({
  minWords: z.coerce.number().int().min(1).max(3000),
  maxWords: z.coerce.number().int().min(1).max(8000),
  placeholder: z.string().trim().max(160).default(""),
});

const uploadConfig = z.object({
  maxFiles: z.coerce.number().int().min(1).max(12),
  label: z.string().trim().min(2).max(80),
  captionLabel: z.string().trim().max(120).optional().or(z.literal("")),
});

const columnType = z.enum(["text", "select", "textarea"]);
const structuredConfig = z.object({
  columns: z
    .array(z.object({ key, label: z.string().trim().min(2).max(80), type: columnType, options: z.array(z.string().trim().min(1).max(80)).max(12).optional() }))
    .min(1)
    .max(12),
  minRows: z.coerce.number().int().min(1).max(200),
});

const rosterConfig = z.object({
  fields: z.array(z.object({ key, label: z.string().trim().min(2).max(80), type: z.enum(["text", "textarea"]) })).min(1).max(12),
  minRows: z.coerce.number().int().min(1).max(200),
});

const quizConfig = z.object({
  questions: z
    .array(
      z.object({
        prompt: z.string().trim().min(5).max(400),
        options: z.array(z.string().trim().min(1).max(200)).min(2).max(6),
        correctIndex: z.coerce.number().int().min(0).max(5),
      })
    )
    .min(1)
    .max(50),
  practicalPrompt: z.string().trim().max(400).optional().or(z.literal("")),
});

/** Checks the config object matches the declared submission type, and nothing else. */
export function parseTypeConfig(submissionType: string, raw: unknown): { ok: true; config: Record<string, unknown> } | { ok: false; error: string } {
  const wrap = (keyName: string, value: unknown) => ({ [keyName]: value });
  const bag = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  switch (submissionType) {
    case "link": {
      const r = linkConfig.safeParse(bag.link ?? raw);
      return r.success ? { ok: true, config: wrap("link", r.data) } : { ok: false, error: first(r.error, "Link brief: a label is required.") };
    }
    case "link_set": {
      const r = linkSetConfig.safeParse(bag.link_set ?? raw);
      if (!r.success) return { ok: false, error: first(r.error, "Link set: at least one labelled field is required.") };
      const keys = r.data.rows.map((x) => x.key);
      if (new Set(keys).size !== keys.length) return { ok: false, error: "Link set field keys must be unique." };
      return { ok: true, config: wrap("link_set", r.data) };
    }
    case "document": {
      const r = documentConfig.safeParse(bag.document ?? raw);
      if (!r.success) return { ok: false, error: first(r.error, "Document brief: word minimum and maximum are required.") };
      if (r.data.minWords > r.data.maxWords) return { ok: false, error: "Word minimum cannot exceed the maximum." };
      return { ok: true, config: wrap("document", r.data) };
    }
    case "upload": {
      const r = uploadConfig.safeParse(bag.upload ?? raw);
      return r.success ? { ok: true, config: wrap("upload", r.data) } : { ok: false, error: first(r.error, "Upload brief: a label and file limit are required.") };
    }
    case "structured": {
      const r = structuredConfig.safeParse(bag.structured ?? raw);
      if (!r.success) return { ok: false, error: first(r.error, "Table brief: columns and a minimum row count are required.") };
      const keys = r.data.columns.map((x) => x.key);
      if (new Set(keys).size !== keys.length) return { ok: false, error: "Column keys must be unique." };
      for (const c of r.data.columns) {
        if (c.type === "select" && (!c.options || c.options.length < 2)) return { ok: false, error: `Column "${c.label}" is a dropdown but has no choices.` };
      }
      return { ok: true, config: wrap("structured", r.data) };
    }
    case "roster": {
      const r = rosterConfig.safeParse(bag.roster ?? raw);
      if (!r.success) return { ok: false, error: first(r.error, "Roster brief: fields and a minimum row count are required.") };
      const keys = r.data.fields.map((x) => x.key);
      if (new Set(keys).size !== keys.length) return { ok: false, error: "Field keys must be unique." };
      return { ok: true, config: wrap("roster", r.data) };
    }
    case "quiz": {
      const r = quizConfig.safeParse(bag.quiz ?? raw);
      if (!r.success) return { ok: false, error: first(r.error, "Assessment: each question needs a prompt and at least two options.") };
      for (const [i, q] of r.data.questions.entries()) {
        if (q.correctIndex >= q.options.length) return { ok: false, error: `Question ${i + 1}: the marked answer is not one of its options.` };
      }
      return { ok: true, config: wrap("quiz", r.data) };
    }
    default:
      return { ok: false, error: "Unknown submission type." };
  }
}

export const taskInput = z.object({
  cohortId: z.string().trim().min(1),
  track: z.enum(TRACKS),
  code: z.string().trim().toUpperCase().regex(/^[A-E]\d{1,2}$/, "Code must look like B2 or D11."),
  week: z.coerce.number().int().min(1).max(24),
  title: z.string().trim().min(3).max(120),
  summary: z.string().trim().min(3).max(200),
  briefMd: z.string().trim().min(20).max(8000),
  submissionType: z.enum(SUBMISSION_TYPES),
  rubric: z.array(z.string().trim().min(3).max(240)).min(1).max(12),
  signalValue: z.coerce.number().int().min(1).max(500),
  opensAt: ISO_DATE,
  dueAt: ISO_DATE,
  published: z.coerce.boolean().default(true),
});

export type TaskInput = z.infer<typeof taskInput>;

export const rewardInput = z.object({
  code: z.string().trim().toLowerCase().regex(/^[a-z][a-z0-9_]{1,39}$/, "Reward code: lower-case letters, digits and underscores."),
  name: z.string().trim().min(3).max(80),
  description: z.string().trim().min(3).max(300),
  tierGate: z.enum(TIERS),
  signalGate: z.coerce.number().int().min(0).max(5000),
  fulfilmentType: z.enum(FULFILMENT_TYPES),
});

export const moduleInput = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-E]\d{1,2}$/, "Module code must look like D3."),
  title: z.string().trim().min(3).max(120),
  summary: z.string().trim().min(3).max(200),
  bodyMd: z.string().trim().min(20).max(20000),
  order: z.coerce.number().int().min(1).max(200),
});

export const campusInput = z.object({
  cohortId: z.string().trim().min(1),
  name: z.string().trim().min(2).max(120),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  country: z.string().trim().max(80).default("India"),
});

export const cohortInput = z.object({
  name: z.string().trim().min(3).max(120),
  startsAt: ISO_DATE,
  endsAt: ISO_DATE,
  status: z.enum(["upcoming", "active", "archived"]).default("active"),
});

export const accountInput = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  campusName: z.string().trim().min(2).max(120),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  cohortId: z.string().trim().min(1),
  tier: z.enum(TIERS).default("ambassador"),
  role: z.enum(ROLES).default("ambassador"),
  /** Optional. Blank means the account starts link-only until its owner sets one. */
  password: z.string().max(200).optional().or(z.literal("")),
});

export const signalAdjustment = z.object({
  delta: z.coerce.number().int().min(-2000).max(2000),
  reason: z.string().trim().min(5).max(300),
});

function first(error: z.ZodError, fallback: string): string {
  return error.issues[0]?.message || fallback;
}
