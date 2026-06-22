import { notFound } from "next/navigation";
import { getTeamById } from "@/lib/data/searchCatalog";
import { renderTeamOgImage } from "@/lib/seo/og";

export const alt = "Team hub";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const team = getTeamById(decodeURIComponent(id));
  if (!team) notFound();
  return renderTeamOgImage(team);
}
