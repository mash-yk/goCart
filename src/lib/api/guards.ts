import "server-only";
import { requireUser } from "@/lib/auth/session";
import { ForbiddenError } from "@/lib/errors";
import type { PublicUser } from "@/types";

export async function requireAdmin(): Promise<PublicUser> {
  const user = await requireUser();
  if (user.role !== "admin") throw new ForbiddenError("Only store admins can manage products.");
  return user;
}
