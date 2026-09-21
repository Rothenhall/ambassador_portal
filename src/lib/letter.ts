import "server-only";
import { db } from "./db";

// The appointment letter is never a document someone fills in. It is a computed view over
// data that already exists the moment `provisionAmbassador` creates the User + Membership
// row — so it is "automatically created" for every ambassador with no extra step, it can
// never drift out of sync with the DB, and there is nothing to clean up if a person leaves.
//
// The "first assignment" section used to be a fixed paragraph (two blog posts, a mandatory
// link to rothenhall.com, no disclosure). That is exactly the undisclosed-link pattern the
// program's own design rejected, and baking it into a document generated for every future
// ambassador would quietly reintroduce it at scale. So this pulls the ambassador's actual
// first two published tasks instead — whatever the cohort's real week-one work is, honestly.

export type LetterData = {
  name: string;
  email: string;
  campusName: string;
  cohortName: string;
  refCode: string;
  joinedAt: Date;
  tier: string;
  firstTasks: { code: string; title: string; summary: string; week: number; signalValue: number }[];
};

/** Deterministic, human-typeable, no extra column: RH-CS-{join year}-{last 5 of the id}. */
function refCodeFor(userId: string, joinedAt: Date) {
  const tail = userId.slice(-5).toUpperCase();
  return `RH-CS-${joinedAt.getFullYear()}-${tail}`;
}

export async function getLetterData(userId: string): Promise<LetterData | null> {
  const membership = await db.membership.findUnique({
    where: { userId },
    include: {
      user: { select: { name: true, email: true } },
      campus: { select: { name: true } },
      cohort: { select: { id: true, name: true } },
    },
  });
  if (!membership) return null;

  const firstTasks = await db.task.findMany({
    where: { cohortId: membership.cohort.id, published: true },
    orderBy: [{ week: "asc" }, { code: "asc" }],
    take: 2,
    select: { code: true, title: true, summary: true, week: true, signalValue: true },
  });

  return {
    name: membership.user.name,
    email: membership.user.email,
    campusName: membership.campus.name,
    cohortName: membership.cohort.name,
    refCode: refCodeFor(userId, membership.joinedAt),
    joinedAt: membership.joinedAt,
    tier: membership.tier,
    firstTasks,
  };
}
