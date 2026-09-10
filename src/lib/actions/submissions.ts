"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser, requireAdmin } from "@/lib/auth";
import { parseRubric } from "@/lib/tasks";

async function snapshotLink(url: string): Promise<{ fetchedAt: string; title: string | null; ok: boolean }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(url, { signal: controller.signal, redirect: "follow" });
    clearTimeout(timeout);
    const html = await res.text();
    const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    return { fetchedAt: new Date().toISOString(), title: match?.[1]?.trim() ?? null, ok: res.ok };
  } catch {
    return { fetchedAt: new Date().toISOString(), title: null, ok: false };
  }
}

export async function saveDraft(taskId: string, content: Record<string, unknown>) {
  const user = await requireUser();
  const task = await db.task.findUniqueOrThrow({ where: { id: taskId } });
  const latest = await db.submission.findFirst({
    where: { taskId, userId: user.id },
    orderBy: { attemptNo: "desc" },
  });

  if (latest && (latest.status === "draft" || latest.status === "changes_requested")) {
    await db.submission.update({
      where: { id: latest.id },
      data: { content: JSON.stringify(content) },
    });
  } else if (!latest) {
    await db.submission.create({
      data: { taskId, userId: user.id, status: "draft", content: JSON.stringify(content) },
    });
  }
  revalidatePath(`/tasks/${task.code}`);
}

export async function submitTask(taskId: string, content: Record<string, unknown>) {
  const user = await requireUser();
  const task = await db.task.findUniqueOrThrow({ where: { id: taskId } });

  if (task.submissionType === "link" && typeof content.url === "string" && content.url) {
    (content as Record<string, unknown>).snapshot = await snapshotLink(content.url);
  }

  const latest = await db.submission.findFirst({
    where: { taskId, userId: user.id },
    orderBy: { attemptNo: "desc" },
  });

  if (!latest) {
    await db.submission.create({
      data: { taskId, userId: user.id, status: "submitted", content: JSON.stringify(content), submittedAt: new Date() },
    });
  } else if (latest.status === "draft") {
    await db.submission.update({
      where: { id: latest.id },
      data: { status: "submitted", content: JSON.stringify(content), submittedAt: new Date() },
    });
  } else if (latest.status === "changes_requested") {
    await db.submission.create({
      data: {
        taskId,
        userId: user.id,
        status: "submitted",
        attemptNo: latest.attemptNo + 1,
        content: JSON.stringify(content),
        submittedAt: new Date(),
      },
    });
  }
  // accepted / submitted / in_review: no-op, the UI never offers a form in that state.

  revalidatePath(`/tasks/${task.code}`);
  revalidatePath("/tasks");
  revalidatePath("/home");
  revalidatePath("/admin/review");
  revalidatePath("/admin");
}

export async function reviewSubmission(
  submissionId: string,
  decision: "accepted" | "changes_requested" | "rejected",
  rubricResults: boolean[],
  feedbackMd: string
) {
  const reviewer = await requireAdmin();
  const submission = await db.submission.findUniqueOrThrow({
    where: { id: submissionId },
    include: { task: true },
  });

  await db.review.create({
    data: {
      submissionId,
      reviewerId: reviewer.id,
      decision,
      rubricResults: JSON.stringify(rubricResults),
      feedbackMd,
    },
  });

  await db.submission.update({
    where: { id: submissionId },
    data: { status: decision === "accepted" ? "accepted" : decision === "rejected" ? "missed" : "changes_requested" },
  });

  if (decision === "accepted") {
    await db.signalLedger.create({
      data: {
        userId: submission.userId,
        submissionId,
        taskCode: submission.task.code,
        taskTitle: submission.task.title,
        delta: submission.task.signalValue,
        reason: "Submission accepted",
      },
    });
    const membership = await db.membership.findUnique({ where: { userId: submission.userId } });
    if (membership) {
      await db.membership.update({
        where: { userId: submission.userId },
        data: { signalTotal: membership.signalTotal + submission.task.signalValue },
      });
    }
  }

  revalidatePath("/admin/review");
  revalidatePath("/admin");
  revalidatePath("/admin/ambassadors");
  revalidatePath("/home");
  revalidatePath("/progress");
  revalidatePath("/tasks");
  return { rubric: parseRubric(submission.task) };
}
