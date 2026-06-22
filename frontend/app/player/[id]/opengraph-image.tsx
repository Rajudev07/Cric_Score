import { notFound } from "next/navigation";
import { getPlayerProfile } from "@/lib/api/cricapi";
import {
  getPlayerCatalogById,
  getPlayerCatalogByPid,
} from "@/lib/data/searchCatalog";
import { renderPlayerOgImage } from "@/lib/seo/og";

export const alt = "Player profile";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const rawId = decodeURIComponent((await params).id);
  const isNumericId = /^\d+$/.test(rawId.trim());
  const catalogBySlug = getPlayerCatalogById(rawId);
  const catalogByPid = isNumericId ? getPlayerCatalogByPid(rawId.trim()) : undefined;
  const catalog = catalogBySlug ?? catalogByPid;
  const apiRes = isNumericId ? await getPlayerProfile(rawId.trim()) : null;
  const api = apiRes?.ok ? apiRes.data : null;
  if (!catalog && !api) notFound();
  const name = api?.name ?? catalog?.name ?? "Player";
  const role = api?.role ?? catalog?.role ?? "Cricketer";
  const team = catalog?.team ?? api?.country ?? "—";
  return renderPlayerOgImage(name, role, team);
}
