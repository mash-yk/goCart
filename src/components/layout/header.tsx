import { catalogService } from "@/lib/services/catalog.service";
import { HeaderClient } from "./header-client";
import { AnnouncementBar } from "./announcement-bar";

export async function Header() {
  const categories = await catalogService.getCategories().catch(() => []);
  return (
    <>
      <AnnouncementBar />
      <HeaderClient categories={categories} />
    </>
  );
}
