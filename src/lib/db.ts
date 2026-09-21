import { PrismaClient, Prisma } from "@prisma/client";
import type { Prisma as PrismaTypes } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

/** Write a plain JS value into a Json column without a cast at every call site. */
export const json = (value: unknown): PrismaTypes.InputJsonValue => value as PrismaTypes.InputJsonValue;

/** Unique-violation etc. detection without scattering `e.code === "P2002"` casts. */
export function prismaErrorCode(error: unknown): string | undefined {
  return error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined;
}
