import type { Match } from "@/lib/data/matches";
import { absoluteUrl, siteBaseUrl } from "@/lib/seo/canonical";

const CTX = "https://schema.org";

export type BreadcrumbItem = { name: string; path: string };

export function buildOrganizationJsonLd(): Record<string, unknown> {
  const base = siteBaseUrl();
  return {
    "@context": CTX,
    "@type": "Organization",
    "@id": `${base}/#organization`,
    name: "CricScore",
    url: base,
    logo: `${base}/icon`,
  };
}

export function buildWebSiteJsonLd(): Record<string, unknown> {
  const base = siteBaseUrl();
  return {
    "@context": CTX,
    "@type": "WebSite",
    "@id": `${base}/#website`,
    name: "CricScore",
    url: base,
    publisher: { "@id": `${base}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${base}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]): Record<string, unknown> {
  return {
    "@context": CTX,
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}

export function buildSportsEventJsonLd(
  match: Match,
  matchPath: string
): Record<string, unknown> {
  const url = absoluteUrl(matchPath);
  const start = match.startTimeIso ?? undefined;
  return {
    "@context": CTX,
    "@type": "SportsEvent",
    "@id": `${url}#event`,
    name: `${match.team1} vs ${match.team2}`,
    description: `${match.league} — ${match.status}`,
    sport: "Cricket",
    ...(start ? { startDate: start } : {}),
    homeTeam: { "@type": "SportsTeam", name: match.team1 },
    awayTeam: { "@type": "SportsTeam", name: match.team2 },
    location: {
      "@type": "Place",
      name: match.league,
    },
    organizer: { "@id": `${siteBaseUrl()}/#organization` },
    url,
  };
}
