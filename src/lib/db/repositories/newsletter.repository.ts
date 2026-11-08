import "server-only";
import { db } from "@/lib/db/client";
import { isUniqueViolation, withDb } from "@/lib/db/errors";

export const newsletterRepository = {
  /** Returns false if the email was already subscribed (primary key on email). */
  async subscribe(email: string): Promise<boolean> {
    try {
      await db().newsletterSubscriber.create({ data: { email: email.toLowerCase() } });
      return true;
    } catch (error) {
      if (isUniqueViolation(error)) return false;
      return withDb("newsletter.subscribe", () => Promise.reject(error));
    }
  },
};
