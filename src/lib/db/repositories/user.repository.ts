import "server-only";
import { db } from "@/lib/db/client";
import { isRecordNotFound, isUniqueViolation, withDb } from "@/lib/db/errors";
import { toUser } from "@/lib/db/mappers";
import { ConflictError, NotFoundError } from "@/lib/errors";
import type { User } from "@/types";

export const userRepository = {
  /** Creates a user. The unique index on email rejects duplicates, even under concurrent sign-ups. */
  async create(user: Omit<User, "createdAt" | "updatedAt">): Promise<User> {
    try {
      const row = await db().user.create({
        data: { id: user.id, email: user.email, name: user.name, role: user.role, passwordHash: user.passwordHash },
      });
      return toUser(row);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictError("EMAIL_TAKEN", "An account with this email already exists.");
      }
      return withDb("user.create", () => Promise.reject(error));
    }
  },

  async getById(id: string): Promise<User | null> {
    return withDb("user.getById", async () => {
      const row = await db().user.findUnique({ where: { id } });
      return row ? toUser(row) : null;
    });
  },

  async getByEmail(email: string): Promise<User | null> {
    return withDb("user.getByEmail", async () => {
      const row = await db().user.findUnique({ where: { email: email.toLowerCase() } });
      return row ? toUser(row) : null;
    });
  },

  async updateName(id: string, name: string): Promise<User> {
    try {
      return toUser(await db().user.update({ where: { id }, data: { name } }));
    } catch (error) {
      if (isRecordNotFound(error)) throw new NotFoundError("User");
      return withDb("user.updateName", () => Promise.reject(error));
    }
  },

  /**
   * Deletes the user. Their cart and wishlist go with them (ON DELETE CASCADE);
   * their orders are kept for the shop's records with user_id set to NULL.
   */
  async delete(user: Pick<User, "id">): Promise<void> {
    try {
      await db().user.delete({ where: { id: user.id } });
    } catch (error) {
      if (isRecordNotFound(error)) throw new NotFoundError("User");
      return withDb("user.delete", () => Promise.reject(error));
    }
  },
};
