import "server-only";
import { newsletterRepository } from "@/lib/db/repositories/newsletter.repository";

export const newsletterService = {
  /** Subscribing twice is not an error; the response just says so. */
  async subscribe(email: string): Promise<{ alreadySubscribed: boolean }> {
    const created = await newsletterRepository.subscribe(email);
    return { alreadySubscribed: !created };
  },
};
