import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { getConfig } from "@/lib/config";
import { userRepository } from "@/lib/db/repositories/user.repository";
import { UnauthorizedError } from "@/lib/errors";
import type { Owner, PublicUser, User, UserRole } from "@/types";
import {
  GUEST_COOKIE,
  GUEST_ID_PATTERN,
  GUEST_MAX_AGE_SECONDS,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
} from "./constants";

interface SessionPayload {
  sub: string;
  role: UserRole;
}

const cookieBase = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export async function createSessionToken(user: Pick<User, "id" | "role">): Promise<string> {
  return new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getConfig().authSecret);
}

async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getConfig().authSecret, { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string") return null;
    const role = payload.role === "admin" ? "admin" : "customer";
    return { sub: payload.sub, role };
  } catch {
    return null; // expired, tampered with, or signed with another secret
  }
}

/** Sets the session cookie. Only callable from Route Handlers or Server Actions. */
export async function startSession(user: Pick<User, "id" | "role">): Promise<void> {
  const token = await createSessionToken(user);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, { ...cookieBase, maxAge: SESSION_MAX_AGE_SECONDS });
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

/** The verified session for this request, if any. Cached for the lifetime of one request. */
export const getSession = cache(async (): Promise<SessionPayload | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? verifySessionToken(token) : null;
});

export function toPublicUser(user: User): PublicUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...rest } = user;
  return rest;
}

/** The signed-in user, or null for guests. A session for a deleted user counts as signed out. */
export const getCurrentUser = cache(async (): Promise<PublicUser | null> => {
  const session = await getSession();
  if (!session) return null;
  const user = await userRepository.getById(session.sub);
  return user ? toPublicUser(user) : null;
});

export async function requireUser(): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

async function readGuestId(): Promise<string | null> {
  const value = (await cookies()).get(GUEST_COOKIE)?.value;
  return value && GUEST_ID_PATTERN.test(value) ? value : null;
}

/**
 * Who owns the cart and wishlist for this request: the signed-in user,
 * or an anonymous guest identified by the `gocart_gid` cookie.
 *
 * Pass `createIfMissing` from Route Handlers to issue a guest id on the first write.
 */
export async function getOwner(options: { createIfMissing?: boolean } = {}): Promise<Owner | null> {
  const session = await getSession();
  if (session) return { id: session.sub, kind: "user" };

  let guestId = await readGuestId();
  if (!guestId && options.createIfMissing) {
    guestId = crypto.randomUUID();
    (await cookies()).set(GUEST_COOKIE, guestId, { ...cookieBase, maxAge: GUEST_MAX_AGE_SECONDS });
  }
  return guestId ? { id: `guest-${guestId}`, kind: "guest" } : null;
}

/** The guest owner for this request, ignoring any session (used to merge carts at sign-in). */
export async function getGuestOwner(): Promise<Owner | null> {
  const guestId = await readGuestId();
  return guestId ? { id: `guest-${guestId}`, kind: "guest" } : null;
}
