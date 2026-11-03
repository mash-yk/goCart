import { AppError, DatabaseError } from "@/lib/errors";

/**
 * Wraps a DynamoDB call so low-level AWS errors never leak to the client.
 * Known application errors pass through unchanged.
 */
export async function withDb<T>(operation: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof AppError) throw error;
    const name = (error as { name?: string })?.name ?? "UnknownError";
    console.error(`[dynamodb] ${operation} failed: ${name}`, error);

    if (name === "ResourceNotFoundException") {
      throw new DatabaseError("The store database is not set up yet. Run `npm run db:setup`.", { operation });
    }
    if (
      name === "ProvisionedThroughputExceededException" ||
      name === "ThrottlingException" ||
      name === "RequestLimitExceeded"
    ) {
      throw new DatabaseError("The store is very busy right now. Please try again in a moment.", { operation });
    }
    if (name === "UnrecognizedClientException" || name === "AccessDeniedException") {
      throw new DatabaseError("The server is not authorised to access the database.", { operation });
    }
    throw new DatabaseError(undefined, { operation });
  }
}

/** True when a conditional write failed because the condition was not met. */
export function isConditionalCheckFailed(error: unknown): boolean {
  return (error as { name?: string })?.name === "ConditionalCheckFailedException";
}

/** True when a transaction was cancelled because one of its conditions failed. */
export function isTransactionConditionFailed(error: unknown): boolean {
  const e = error as { name?: string; CancellationReasons?: { Code?: string }[] };
  return (
    e?.name === "TransactionCanceledException" &&
    (e.CancellationReasons ?? []).some((r) => r?.Code === "ConditionalCheckFailed")
  );
}
