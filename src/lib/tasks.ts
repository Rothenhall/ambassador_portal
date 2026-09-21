import { db } from "@/lib/db";

export type TaskConfig = {
  link?: { label: string; placeholder: string; noteLabel?: string };
  link_set?: { rows: { key: string; label: string; placeholder: string }[] };
  document?: { minWords: number; maxWords: number; placeholder: string };
  upload?: { maxFiles: number; label: string; captionLabel?: string };
  structured?: { columns: { key: string; label: string; type: "text" | "select" | "textarea"; options?: string[] }[]; minRows: number };
  roster?: { fields: { key: string; label: string; type: "text" | "textarea" }[]; minRows: number };
  quiz?: { questions: { prompt: string; options: string[]; correctIndex: number }[]; practicalPrompt?: string };
};

/**
 * `typeConfig` and `rubric` are Json columns now. Rows written before the move can still
 * arrive as a JSON string, so accept both shapes rather than trusting the driver.
 */
function asObject(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
  return null;
}

function asArray(value: unknown): unknown[] | null {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return null;
}

export function parseConfig(task: { typeConfig: unknown }): TaskConfig {
  return (asObject(task.typeConfig) ?? {}) as TaskConfig;
}

export function parseRubric(task: { rubric: unknown }): string[] {
  return (asArray(task.rubric) ?? []).filter((x): x is string => typeof x === "string");
}

/** Safe read for the free-form submission body. Never throws on a malformed row. */
export function parseContent(submission: { content: unknown }): Record<string, unknown> {
  return asObject(submission.content) ?? {};
}

export function parseRubricResults(review: { rubricResults: unknown }): boolean[] {
  return (asArray(review.rubricResults) ?? []).filter((x): x is boolean => typeof x === "boolean");
}

/** The shape a browser is allowed to see: a quiz with its answer key removed. */
export type ClientTaskConfig = Omit<TaskConfig, "quiz"> & {
  quiz?: { questions: { prompt: string; options: string[] }[]; practicalPrompt?: string };
};

/**
 * `correctIndex` is the answer key. It stays on the server until the attempt has been
 * graded — shipping it to the browser made the assessment that feeds the certificate
 * self-scored, and the score in the database was whatever the client claimed.
 */
export function configForClient(task: { submissionType: string; typeConfig: unknown }, revealAnswers: boolean): ClientTaskConfig {
  const config = parseConfig(task);
  if (!config.quiz || revealAnswers) return config;
  return { ...config, quiz: { ...config.quiz, questions: config.quiz.questions.map((q) => ({ prompt: q.prompt, options: q.options })) } };
}

export function quizAnswers(config: TaskConfig): number[] {
  return (config.quiz?.questions ?? []).map((q) => q.correctIndex);
}

/** Server-side score for a quiz attempt, from the stored answer key. */
export function scoreQuiz(config: TaskConfig, answers: number[]): { correct: number; total: number } {
  const questions = config.quiz?.questions ?? [];
  const correct = questions.reduce((sum, q, i) => sum + (answers[i] === q.correctIndex ? 1 : 0), 0);
  return { correct, total: questions.length };
}

/** Effective status of a task for one ambassador: their latest submission's status,
 * "open" if none exists yet and the window is open, or "locked"/"missed" otherwise. */
export function effectiveStatus(
  task: { opensAt: Date; dueAt: Date; published: boolean },
  latest: { status: string } | undefined,
  now = new Date()
) {
  if (latest) return latest.status;
  if (!task.published) return "locked";
  if (now < task.opensAt) return "locked";
  if (now > task.dueAt) return "missed";
  return "open";
}

/**
 * The one gate every write path uses before touching a submission: is this task actually
 * open to this person, right now. Cohort is checked because a task id from another cohort
 * is otherwise a free read-write on someone else's brief.
 */
export async function loadSubmittableTask(taskId: string, cohortId: string) {
  const task = await db.task.findUnique({ where: { id: taskId } });
  if (!task) return { task: null, error: "That task no longer exists." } as const;
  if (task.cohortId !== cohortId) return { task: null, error: "That task is not part of your cohort." } as const;
  if (!task.published) return { task: null, error: "That task is not published." } as const;
  return { task, error: null } as const;
}

export function submissionWindowError(task: { opensAt: Date; dueAt: Date }, allowResubmit: boolean, now = new Date()) {
  if (now < task.opensAt) return "This task is not open yet.";
  if (now > task.dueAt && !allowResubmit) return "The deadline for this task has passed.";
  return null;
}

export async function getLatestSubmission(taskId: string, userId: string) {
  return db.submission.findFirst({
    where: { taskId, userId },
    orderBy: { attemptNo: "desc" },
    include: { reviews: { orderBy: { reviewedAt: "desc" }, take: 1 } },
  });
}
