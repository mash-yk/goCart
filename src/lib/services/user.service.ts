import "server-only";
import { userRepository } from "@/lib/db/repositories/user.repository";
import { endSession, toPublicUser } from "@/lib/auth/session";
import type { PublicUser } from "@/types";

export const userService = {
  async updateProfile(userId: string, name: string): Promise<PublicUser> {
    return toPublicUser(await userRepository.updateName(userId, name));
  },

  /**
   * Deletes the account and signs the user out. The database removes their cart and
   * wishlist (ON DELETE CASCADE) and keeps past orders without the account link.
   */
  async deleteAccount(userId: string): Promise<void> {
    await userRepository.delete({ id: userId });
    await endSession();
  },
};
