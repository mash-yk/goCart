import { Prisma } from "@/generated/prisma/client";
import { AppError, DatabaseError } from "@/lib/errors";

/**
 * Wraps a database call so driver errors never leak to the client. Known application
 * errors pass through unchanged; anything else is logged and turned into a 503.
 */
export async function withDb<T>(operation: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error(`[db] ${operation} failed`, error);

    if (error instanceof Prisma.PrismaClientInitializationError) {
      throw new DatabaseError("The server could not connect to the database.", { operation });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
      throw new DatabaseError("The database is not set up yet. Run `npm run db:setup`.", { operation });
    }
    throw new DatabaseError(undefined, { operation });
  }
}

/** True when an insert or update broke a unique constraint (e.g. a duplicate email). */
export function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

/** True when an update or delete targeted a row that doesn't exist. */
export function isRecordNotFound(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
}
