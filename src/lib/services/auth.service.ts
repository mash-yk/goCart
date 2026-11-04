import "server-only";
import bcrypt from "bcryptjs";
import { getConfig } from "@/lib/config";
import { userRepository } from "@/lib/db/repositories/user.repository";
import { endSession, getGuestOwner, startSession, toPublicUser } from "@/lib/auth/session";
import { cartService } from "@/lib/services/cart.service";
import { wishlistService } from "@/lib/services/wishlist.service";
import { UnauthorizedError } from "@/lib/errors";
import type { SignInInput, SignUpInput } from "@/lib/validation/schemas";
import type { PublicUser, User } from "@/types";

const BCRYPT_ROUNDS = 10;
// A real bcrypt hash, compared against when the email doesn't exist so that
// response times don't reveal which emails have accounts.
const DUMMY_HASH = "$2b$10$xqHKLthQ8CxctO3v4e.pVuOfAhqzVA/qmvrlGBGEJbADPr.OniEPK";

async function carryOverGuestData(user: User): Promise<void> {
  const guest = await getGuestOwner();
  if (!guest) return;
  const owner = { id: user.id, kind: "user" as const };
  try {
    await Promise.all([cartService.mergeGuestCart(guest, owner), wishlistService.mergeGuestWishlist(guest, owner)]);
  } catch (error) {
    // Merging is a convenience; signing in should still succeed if it fails.
    console.error("[auth] failed to merge guest cart/wishlist", error);
  }
}

export const authService = {
  async signUp(input: SignUpInput): Promise<PublicUser> {
    const now = new Date().toISOString();
    const isAdmin = getConfig().adminEmails.includes(input.email);
    const user: User = {
      id: crypto.randomUUID(),
      email: input.email,
      name: input.name,
      role: isAdmin ? "admin" : "customer",
      passwordHash: await bcrypt.hash(input.password, BCRYPT_ROUNDS),
      createdAt: now,
      updatedAt: now,
    };
    await userRepository.create(user); // throws EMAIL_TAKEN (409) on duplicates
    await carryOverGuestData(user);
    await startSession(user);
    return toPublicUser(user);
  },

  async signIn(input: SignInInput): Promise<PublicUser> {
    const user = await userRepository.getByEmail(input.email);
    const valid = await bcrypt.compare(input.password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !valid) throw new UnauthorizedError("Incorrect email or password.");
    await carryOverGuestData(user);
    await startSession(user);
    return toPublicUser(user);
  },

  async signOut(): Promise<void> {
    await endSession();
  },
};
