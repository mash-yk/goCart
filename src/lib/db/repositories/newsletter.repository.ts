import "server-only";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { db, tableName } from "@/lib/db/client";
import { isConditionalCheckFailed, withDb } from "@/lib/db/errors";
import { keys } from "@/lib/db/keys";

export const newsletterRepository = {
  /** Returns false if the email was already subscribed. */
  async subscribe(email: string): Promise<boolean> {
    try {
      await db().send(
        new PutCommand({
          TableName: tableName(),
          Item: {
            ...keys.subscriber(email),
            entityType: "Subscriber",
            email: email.toLowerCase(),
            subscribedAt: new Date().toISOString(),
          },
          ConditionExpression: "attribute_not_exists(SK)",
        }),
      );
      return true;
    } catch (error) {
      if (isConditionalCheckFailed(error)) return false;
      return withDb("newsletter.subscribe", () => Promise.reject(error));
    }
  },
};
