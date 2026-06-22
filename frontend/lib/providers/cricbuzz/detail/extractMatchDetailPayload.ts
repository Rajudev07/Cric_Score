import { extractEmbeddedJsonWithTrace } from "@/lib/providers/cricbuzzScraper/parser";

function asRec(v: unknown): Record<string, unknown> | null {
  if (typeof v !== "object" || v === null || Array.isArray(v)) return null;
  return v as Record<string, unknown>;
}

const DETAIL_SIGNAL_KEYS = new Set([
  "commentary",
  "commentaries",
  "scorecard",
  "scorecardlist",
  "batsman",
  "batsmen",
  "bowler",
  "bowlers",
  "oversummary",
  "recentovers",
  "inningsOvers",
  "lastOvers",
  "commlines",
  "ballbyball",
  "batteamdetails",
  "bowlteamdetails",
  "inningsovers",
  "innings",
]);

function keyLooksDetailish(k: string): boolean {
  const lower = k.toLowerCase();
  if (DETAIL_SIGNAL_KEYS.has(lower)) return true;
  return (
    lower.includes("comment") ||
    lower.includes("scorecard") ||
    lower.includes("batsmen") ||
    lower.includes("bowler")
  );
}

function shouldAttachDetailBlob(o: Record<string, unknown>): boolean {
  let hits = 0;
  for (const k of Object.keys(o)) {
    if (keyLooksDetailish(k)) hits++;
  }
  if (hits >= 2) return true;
  if (Array.isArray(o.batsman) && o.batsman.length > 0) return true;
  if (Array.isArray(o.batsmen) && o.batsmen.length > 0) return true;
  if (Array.isArray(o.commLines) && o.commLines.length > 0) return true;
  if (Array.isArray(o.commentary) && o.commentary.length > 0) return true;
  if (asRec(o.overSummary)?.recentOvers) return true;
  if (Array.isArray(o.scoreCard) && o.scoreCard.length > 0) return true;
  return false;
}

/**
 * Walk nested JSON for Cricbuzz detail fragments (__NEXT_DATA__ roots + scorecard/commentary subtrees).
 */
function collectExtraRootsFromWalk(roots: unknown[], maxExtra = 120, maxVisits = 100_000): unknown[] {
  const extra: unknown[] = [];
  const seen = new Set<string>();
  let visits = 0;

  const visit = (node: unknown): void => {
    if (extra.length >= maxExtra || visits++ > maxVisits) return;
    if (node === null || node === undefined) return;
    if (Array.isArray(node)) {
      for (const x of node) {
        visit(x);
        if (extra.length >= maxExtra || visits > maxVisits) return;
      }
      return;
    }
    const r = asRec(node);
    if (!r) return;
    if (shouldAttachDetailBlob(r)) {
      try {
        const ser = JSON.stringify(r);
        if (ser.length > 120 && ser.length < 900_000 && !seen.has(ser)) {
          seen.add(ser);
          extra.push(r);
        }
      } catch {
        /* ignore */
      }
    }
    for (const v of Object.values(r)) {
      visit(v);
      if (extra.length >= maxExtra || visits > maxVisits) return;
    }
  };

  for (const root of roots) visit(root);
  return extra;
}

export type MatchDetailPayload = {
  roots: unknown[];
  extractionStrategies: string[];
  extraRootsAttached: number;
};

/**
 * Pull embedded JSON roots from HTML + attach focused detail subtrees for normalization.
 */
export function extractMatchDetailPayload(html: string): MatchDetailPayload {
  const { roots, trace } = extractEmbeddedJsonWithTrace(html);
  const extractionStrategies = trace
    .filter((t) => t.attempted && t.rootsAdded > 0)
    .map((t) => t.name);
  const extra = collectExtraRootsFromWalk(roots);
  const merged = [...roots, ...extra];
  return {
    roots: merged,
    extractionStrategies,
    extraRootsAttached: extra.length,
  };
}
