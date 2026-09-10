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

export function parseConfig(task: { typeConfig: string }): TaskConfig {
  try {
    return JSON.parse(task.typeConfig);
  } catch {
    return {};
  }
}

export function parseRubric(task: { rubric: string }): string[] {
  try {
    return JSON.parse(task.rubric);
  } catch {
    return [];
  }
}

/** Effective status of a task for one ambassador: their latest submission's status,
 * "open" if none exists yet and the window is open, or "locked"/"missed" otherwise. */
export function effectiveStatus(
  task: { opensAt: Date; dueAt: Date },
  latest: { status: string } | undefined,
  now = new Date()
) {
  if (latest) return latest.status;
  if (now < task.opensAt) return "locked";
  if (now > task.dueAt) return "missed";
  return "open";
}

export async function getLatestSubmission(taskId: string, userId: string) {
  return db.submission.findFirst({
    where: { taskId, userId },
    orderBy: { attemptNo: "desc" },
    include: { reviews: { orderBy: { reviewedAt: "desc" }, take: 1 } },
  });
}
