import { getMatchById } from "@/lib/api/cricapi";
import { renderFallbackMatchOg, renderMatchOgImage } from "@/lib/seo/og";

export const alt = "Live match scorecard";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const decoded = decodeURIComponent(id);
  const res = await getMatchById(decoded);
  if (!res.ok || !res.data) {
    return renderFallbackMatchOg(decoded);
  }
  return renderMatchOgImage(res.data);
}
