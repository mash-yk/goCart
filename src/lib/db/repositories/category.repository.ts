import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db/client";
import { isRecordNotFound, withDb } from "@/lib/db/errors";
import { toCategory } from "@/lib/db/mappers";
import { NotFoundError } from "@/lib/errors";
import type { Category } from "@/types";

export const categoryRepository = {
  async list(): Promise<Category[]> {
    return withDb("category.list", async () => {
      const rows = await db().category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
      return rows.map(toCategory);
    });
  },

  async getBySlug(slug: string): Promise<Category | null> {
    return withDb("category.get", async () => {
      const row = await db().category.findUnique({ where: { slug } });
      return row ? toCategory(row) : null;
    });
  },

  /** Creates or updates a category (used by the seed script and admin tooling). */
  async upsert(category: Omit<Category, "createdAt" | "updatedAt">): Promise<Category> {
    return withDb("category.upsert", async () => {
      const data = {
        name: category.name,
        tagline: category.tagline,
        description: category.description,
        art: category.art as unknown as Prisma.InputJsonValue,
        sortOrder: category.sortOrder,
      };
      const row = await db().category.upsert({
        where: { slug: category.slug },
        create: { slug: category.slug, ...data },
        update: data,
      });
      return toCategory(row);
    });
  },

  /** Fails if products still belong to the category (ON DELETE RESTRICT). */
  async delete(slug: string): Promise<void> {
    try {
      await db().category.delete({ where: { slug } });
    } catch (error) {
      if (isRecordNotFound(error)) throw new NotFoundError("Category");
      return withDb("category.delete", () => Promise.reject(error));
    }
  },
};
