import StructuredData from "@/components/seo/StructuredData";
import type { Match } from "@/lib/data/matches";
import { buildSportsEventJsonLd } from "@/lib/seo/structuredData";

export default function MatchStructuredData({
  match,
  path,
  jsonId,
}: {
  match: Match;
  path: string;
  jsonId: string;
}) {
  return <StructuredData id={jsonId} data={buildSportsEventJsonLd(match, path)} />;
}
