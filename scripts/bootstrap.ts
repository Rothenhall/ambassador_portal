/**
 * The only supported way to put a real account into a real database.
 *
 *   BOOTSTRAP_ADMIN_EMAIL=you@rothenhall.com npm run db:bootstrap
 *
 * Idempotent: run it again after a rotation and it updates the same account rather than
 * creating a second one. It creates the first cohort and campus too if the database is empty,
 * because an admin with nothing to be an admin of is a dead end.
 *
 * Nothing here is demo data. The ten invented ambassadors live in prisma/seed.ts, which
 * refuses to run in production.
 */
import { PrismaClient } from "@prisma/client";
import { generatePassword, hashPassword, passwordProblem } from "../src/lib/password";

const db = new PrismaClient();

const email = (process.env.BOOTSTRAP_ADMIN_EMAIL ?? "").trim().toLowerCase();
const name = (process.env.BOOTSTRAP_ADMIN_NAME ?? "Rothenhall Operator").trim();
const providedPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD ?? "";
const cohortName = (process.env.BOOTSTRAP_COHORT_NAME ?? "Campus Circle, Cohort 01").trim();
const campusName = (process.env.BOOTSTRAP_CAMPUS_NAME ?? "Unassigned").trim();
const campusCity = (process.env.BOOTSTRAP_CAMPUS_CITY ?? "").trim();

function fail(message: string): never {
  console.error(`\n  bootstrap aborted — ${message}\n`);
  process.exitCode = 1;
  throw new Error(message);
}

async function main() {
  if (!email || !email.includes("@")) {
    fail("BOOTSTRAP_ADMIN_EMAIL is required and must be a real address. Nothing was written.");
  }
  if (providedPassword) {
    const problem = passwordProblem(providedPassword);
    if (problem) fail(`The password you supplied is not acceptable: ${problem}`);
  }

  // Cohort first. Twelve weeks starting today unless the operator says otherwise.
  let cohort = await db.cohort.findFirst({ orderBy: { startsAt: "desc" } });
  if (!cohort) {
    const startsAt = new Date();
    startsAt.setHours(0, 0, 0, 0);
    const endsAt = new Date(startsAt.getTime() + 84 * 86400000);
    cohort = await db.cohort.create({ data: { name: cohortName, startsAt, endsAt, status: "active" } });
    console.log(`  cohort created: ${cohort.name}`);
  } else {
    console.log(`  cohort exists:  ${cohort.name}`);
  }

  let campus = await db.campus.findFirst({ where: { cohortId: cohort.id, name: campusName } });
  if (!campus) {
    campus = await db.campus.create({ data: { cohortId: cohort.id, name: campusName, city: campusCity } });
    console.log(`  campus created: ${campus.name}`);
  }

  const password = providedPassword || generatePassword();

  const existing = await db.user.findUnique({ where: { email }, include: { membership: { select: { id: true } } } });
  if (existing) {
    await db.user.update({
      where: { id: existing.id },
      data: {
        name: existing.name || name,
        role: existing.role === "ambassador" ? "admin" : existing.role,
        status: "active",
        passwordHash: hashPassword(password),
        passwordSetAt: new Date(),
      },
    });
    if (!existing.membership) {
      await db.membership.create({ data: { userId: existing.id, cohortId: cohort.id, campusId: campus.id, tier: "campus_lead" } });
    }
    console.log(`  account updated: ${email} (${existing.role === "ambassador" ? "promoted to admin" : existing.role})`);
  } else {
    const user = await db.user.create({
      data: {
        email,
        name,
        role: "admin",
        status: "active",
        passwordHash: hashPassword(password),
        passwordSetAt: new Date(),
      },
    });
    await db.membership.create({ data: { userId: user.id, cohortId: cohort.id, campusId: campus.id, tier: "campus_lead" } });
    console.log(`  admin created:  ${email}`);
  }

  console.log("\n  Sign in at the site root with:");
  console.log(`    email    ${email}`);
  console.log(`    password ${password}${providedPassword ? "" : "   (generated — shown once, then only its hash is stored)"}`);
  console.log("\n  Next: add campuses, tasks and rewards from the console, and set RESEND_API_KEY");
  console.log("  so invited ambassadors can receive their own sign-in links.\n");
}

main()
  .catch((e: unknown) => {
    if (process.exitCode !== 1) console.error(e);
  })
  .finally(() => db.$disconnect());
