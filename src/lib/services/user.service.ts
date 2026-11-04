import "server-only";
import { userRepository } from "@/lib/db/repositories/user.repository";
import { cartRepository } from "@/lib/db/repositories/cart.repository";
import { wishlistRepository } from "@/lib/db/repositories/wishlist.repository";
import { endSession, toPublicUser } from "@/lib/auth/session";
import { NotFoundError } from "@/lib/errors";
import type { PublicUser } from "@/types";

export const userService = {
  async updateProfile(userId: string, name: string): Promise<PublicUser> {
    return toPublicUser(await userRepository.updateName(userId, name));
  },

  /** Deletes the account and everything that belongs to it, then signs the user out. */
  async deleteAccount(userId: string): Promise<void> {
    const user = await userRepository.getById(userId);
    if (!user) throw new NotFoundError("User");
    const owner = { id: user.id, kind: "user" as const };
    await Promise.all([cartRepository.clear(owner), wishlistRepository.clear(owner)]);
    await userRepository.delete(user);
    await endSession();
  },
};
