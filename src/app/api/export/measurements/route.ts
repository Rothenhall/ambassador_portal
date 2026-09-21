import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getActionAdmin } from "@/lib/auth";
import { parseContent } from "@/lib/tasks";

function csvEscape(v: string) {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export async function GET() {
  // Guarded here as well as in middleware: this route returns the whole measurement corpus.
  const { user, error } = await getActionAdmin();
  if (!user) return new NextResponse(error ?? "Sign in as an admin first.", { status: 403 });

  const submissions = await db.submission.findMany({
    where: { task: { submissionType: "structured" } },
    include: { task: true, user: { include: { membership: true } } },
  });

  const header = ["ambassador", "campus_membership_tier", "task_code", "phase", "attempt", "status", "prompt", "surface", "run", "named", "submitted_at"];
  const lines = [header.join(",")];

  for (const s of submissions) {
    const content = parseContent(s) as { rows?: Record<string, string>[] };
    for (const row of content.rows ?? []) {
      lines.push(
        [
          s.user.name,
          s.user.membership?.tier ?? "",
          s.task.code,
          s.task.title,
          String(s.attemptNo),
          s.status,
          row.prompt ?? "",
          row.surface ?? "",
          row.run ?? "",
          row.named ?? "",
          s.submittedAt?.toISOString() ?? "",
        ]
          .map((v) => csvEscape(String(v)))
          .join(",")
      );
    }
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="campus-circle-measurements.csv"`,
    },
  });
}
