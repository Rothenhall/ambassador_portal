import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

function csvEscape(v: string) {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export async function GET() {
  await requireAdmin();

  const submissions = await db.submission.findMany({
    where: { task: { submissionType: "structured" } },
    include: { task: true, user: { include: { membership: true } } },
  });

  const header = ["ambassador", "campus_membership_tier", "task_code", "phase", "attempt", "status", "prompt", "surface", "run", "named", "submitted_at"];
  const lines = [header.join(",")];

  for (const s of submissions) {
    let content: { rows?: Record<string, string>[] } = {};
    try {
      content = JSON.parse(s.content);
    } catch {
      continue;
    }
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
