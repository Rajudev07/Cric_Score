import type { Match } from "@/lib/data/matches";
import { containsIplSignals } from "@/lib/utils/iplDetection";
import { teamSlug } from "@/lib/utils/teamNameExpansion";

function dayBucket(iso: string | null): string {
  if (!iso) return "na";
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return iso.slice(0, 10);
  return new Date(t).toISOString().slice(0, 10);
}

function leagueBucket(m: Match): string {
  const h = `${m.league} ${m.team1} ${m.team2} ${m.status}`;
  if (containsIplSignals(h, { silent: true })) return "ipl";
  return teamSlug(m.league).slice(0, 8);
}

function seriesSlug(m: Match): string {
  return teamSlug(m.league).slice(0, 20);
}

function matchNumberFromStatus(m: Match): string | null {
  const hay = `${m.status} ${m.league}`;
  const ord = hay.match(/(\d+)(?:st|nd|rd|th)\s+match/i);
  if (ord?.[1]) return ord[1];
  const hash = hay.match(/match\s*#?\s*(\d+)/i);
  if (hash?.[1]) return hash[1];
  return null;
}

/** Primary key: normalized teams + start date + league bucket. */
export function canonicalMatchKey(m: Match): string {
  const a = teamSlug(m.team1);
  const b = teamSlug(m.team2);
  const [x, y] = a < b ? [a, b] : [b, a];
  return `${x}|${y}|${dayBucket(m.startTimeIso)}|${leagueBucket(m)}`;
}

/** Fallback key: series slug + match number (same fixture, different provider ids). */
export function canonicalSeriesMatchKey(m: Match): string | null {
  const num = matchNumberFromStatus(m);
  if (!num) return null;
  const series = seriesSlug(m);
  if (!series || series.length < 3) return null;
  return `series|${series}|m${num}`;
}

/** All keys used for cross-provider dedupe (primary + optional series fallback). */
export function canonicalMatchKeys(m: Match): string[] {
  const keys = [canonicalMatchKey(m)];
  const sk = canonicalSeriesMatchKey(m);
  if (sk) keys.push(sk);
  return keys;
}

export function isIplFixtureHaystack(m: Match): boolean {
  return containsIplSignals(`${m.league} ${m.team1} ${m.team2} ${m.status}`, { silent: true });
}
