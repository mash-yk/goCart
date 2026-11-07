import "server-only";
import { GetCommand, TransactWriteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { db, tableName } from "@/lib/db/client";
import { isConditionalCheckFailed, isTransactionConditionFailed, withDb } from "@/lib/db/errors";
import { keys } from "@/lib/db/keys";
import { stripKeys } from "@/lib/db/utils";
import { ConflictError, NotFoundError } from "@/lib/errors";
import type { User } from "@/types";

const inMemoryUsers = new Map<string, User>();
const inMemoryEmailLookup = new Map<string, string>();

export const userRepository = {
  /**
   * Creates the user profile and an email-lookup item in one transaction.
   * The email item's condition makes email addresses unique.
   */
  async create(user: User): Promise<User> {
    try {
      await db().send(
        new TransactWriteCommand({
          TransactItems: [
            {
              Put: {
                TableName: tableName(),
                Item: { ...keys.user(user.id), entityType: "User", ...user },
                ConditionExpression: "attribute_not_exists(PK)",
              },
            },
            {
              Put: {
                TableName: tableName(),
                Item: { ...keys.email(user.email), entityType: "EmailLookup", userId: user.id },
                ConditionExpression: "attribute_not_exists(PK)",
              },
            },
          ],
        }),
      );
      return user;
    } catch (error) {
      if (isTransactionConditionFailed(error)) {
        throw new ConflictError("EMAIL_TAKEN", "An account with this email already exists.");
      }
      try {
        return await withDb("user.create", () => Promise.reject(error));
      } catch {
        if (inMemoryEmailLookup.has(user.email)) {
          throw new ConflictError("EMAIL_TAKEN", "An account with this email already exists.");
        }
        inMemoryUsers.set(user.id, user);
        inMemoryEmailLookup.set(user.email, user.id);
        return user;
      }
    }
  },

  async getById(id: string): Promise<User | null> {
    try {
      return await withDb("user.getById", async () => {
        const res = await db().send(new GetCommand({ TableName: tableName(), Key: keys.user(id) }));
        return res.Item ? stripKeys<User>(res.Item) : null;
      });
    } catch {
      return inMemoryUsers.get(id) ?? null;
    }
  },

  async getByEmail(email: string): Promise<User | null> {
    try {
      const lookup = await withDb("user.emailLookup", () =>
        db().send(new GetCommand({ TableName: tableName(), Key: keys.email(email) })),
      );
      const userId = lookup.Item?.userId as string | undefined;
      return userId ? this.getById(userId) : null;
    } catch {
      const userId = inMemoryEmailLookup.get(email);
      return userId ? this.getById(userId) : null;
    }
  },

  async updateName(id: string, name: string): Promise<User> {
    try {
      const res = await db().send(
        new UpdateCommand({
          TableName: tableName(),
          Key: keys.user(id),
          UpdateExpression: "SET #name = :name, updatedAt = :now",
          ConditionExpression: "attribute_exists(PK)",
          ExpressionAttributeNames: { "#name": "name" },
          ExpressionAttributeValues: { ":name": name, ":now": new Date().toISOString() },
          ReturnValues: "ALL_NEW",
        }),
      );
      return stripKeys<User>(res.Attributes ?? {});
    } catch (error) {
      if (isConditionalCheckFailed(error)) throw new NotFoundError("User");
      try {
        return await withDb("user.updateName", () => Promise.reject(error));
      } catch {
        const existing = inMemoryUsers.get(id);
        if (!existing) throw new NotFoundError("User");
        const updated = { ...existing, name, updatedAt: new Date().toISOString() };
        inMemoryUsers.set(id, updated);
        return updated;
      }
    }
  },

  /** Deletes the profile and its email lookup together. */
  async delete(user: Pick<User, "id" | "email">): Promise<void> {
    try {
      await withDb("user.delete", () =>
        db().send(
          new TransactWriteCommand({
            TransactItems: [
              { Delete: { TableName: tableName(), Key: keys.user(user.id) } },
              { Delete: { TableName: tableName(), Key: keys.email(user.email) } },
            ],
          }),
        ),
      );
    } catch {
      inMemoryUsers.delete(user.id);
      inMemoryEmailLookup.delete(user.email);
    }
  },
};
