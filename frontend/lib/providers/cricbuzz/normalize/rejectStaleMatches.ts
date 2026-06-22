import type { Match } from "@/lib/data/matches";
import { extractCleanTeams } from "@/lib/providers/cricbuzz/normalize/extractCleanTeams";
import { hasStrongLiveSignals } from "@/lib/providers/cricbuzz/normalize/hasStrongLiveSignals";
import {
  bumpCricbuzzPagesRejected,
  bumpCricbuzzPagesValidated,
  logRejectDebug,
} from "@/lib/providers/cricbuzz/normalize/rejectDebug";
import { ingestDebugEnabled } from "@/lib/utils/ingestDebugFlags";

const IPL_LOG = "[cricscore:ipl-validate]";

function iplLog(...args: unknown[]): void {
  if (process.env.NODE_ENV === "development" || ingestDebugEnabled()) {
    console.log(IPL_LOG, ...args);
  }
}

export type StaleRejectResult = { stale: false } | { stale: true; reason: string };

const COMPLETED_TITLE =
  /\b(highlights only|match highlights\s*$|full scorecard\s*-\s*completed|won the match|man of the match)\b/i;

/** Archive / highlights paths — hard reject at URL level. */
export const ARCHIVE_URL = /highlights|scorecard-history|\/archives?\//i;

/** News / video / gallery — not live scorecard pages. */
const HARD_DISCOVERY_URL =
  /\/(highlights|news\/|videos?\/|video-gallery|match-gallery|photos\/)\b|scorecard-history|\/archives?\/?$/i;

function currentYear(): number {
  return new Date().getFullYear();
}

function extractYears(text: string): number[] {
  const out: number[] = [];
  const re = /\b(20\d{2})\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    out.push(parseInt(m[1]!, 10));
  }
  return out;
}

function hasLiveSignals(m: Match): boolean {
  const st = m.status.toLowerCase();
  return !!(
    /\b(need|trail|stumps|innings|target|elected|opt to|live|in progress|strategic|drinks|powerplay)\b/.test(
      st
    ) ||
    (m.score1 && m.score1 !== "—") ||
    (m.score2 && m.score2 !== "—") ||
    (m.overs && m.overs !== "—" && /\d/.test(m.overs))
  );
}

export function isHardRejectedDiscoveryUrl(url: string): boolean {
  return HARD_DISCOVERY_URL.test(url) || ARCHIVE_URL.test(url);
}

/** Rich HTML cues: allow discovery even when title-based team parse fails. */
export function htmlHasDiscoveryCricketSignals(html: string): boolean {
  const h = html.slice(0, 280_000);
  if (/<script[^>]*\bid=["']__NEXT_DATA__["']/i.test(h)) return true;
  if (/__NEXT_DATA__\s*=/.test(h)) return true;
  if (/"matchInfo"\s*:/.test(h) && /"matchScore"|matchScore|babble|commentary|commText/i.test(h)) return true;
  if (/\bLIVE\b/.test(h) && /\d{1,3}\s*\/\s*\d{1,2}\b/.test(h)) return true;
  if (/\d+\.\d+\s*ov/i.test(h) || /\bOvers?\s*[: ]\s*[\d.]/i.test(h)) return true;
  if (/(commentary|commText|ball-comm|over-detail|cricbuzz-score)/i.test(h) && /\d{1,3}\s*\/\s*\d{1,2}/.test(h)) {
    return true;
  }
  return false;
}

function extractTitleFromHtml(html: string): string {
  const titleM = /<title[^>]*>([^<]{8,500})<\/title>/i.exec(html);
  return titleM?.[1]?.replace(/\s+/g, " ").trim() ?? "";
}

/**
 * Row-level stale rejection — live scoreboard always wins via {@link hasStrongLiveSignals}.
 */
export function rejectStaleCricbuzzMatch(m: Match, opts?: { sourceUrl?: string }): StaleRejectResult {
  if (hasStrongLiveSignals(m)) {
    return { stale: false };
  }

  if (opts?.sourceUrl && ARCHIVE_URL.test(opts.sourceUrl)) {
    iplLog({ accepted: false, staleReason: "archive_url", url: opts.sourceUrl });
    return { stale: true, reason: "archive_url" };
  }

  if (
    COMPLETED_TITLE.test(`${m.team1} ${m.team2} ${m.status}`) &&
    !hasLiveSignals(m) &&
    !(m.score1 && m.score1 !== "—") &&
    !(m.score2 && m.score2 !== "—")
  ) {
    iplLog({ accepted: false, staleReason: "completed_wording" });
    return { stale: true, reason: "completed_wording" };
  }

  return { stale: false };
}

/** Discovery-time HTML — only soft-reject when there are no cricket signals in HTML. */
export function rejectStaleDiscoveryHtml(
  html: string,
  _matchId: string,
  url: string
): StaleRejectResult {
  if (isHardRejectedDiscoveryUrl(url)) {
    return { stale: true, reason: "hard_discovery_url" };
  }
  if (htmlHasDiscoveryCricketSignals(html)) {
    return { stale: false };
  }

  const title = extractTitleFromHtml(html);
  const y = currentYear();
  const years = extractYears(title + html.slice(0, 40_000));
  if (years.length && Math.max(...years) < y - 1) {
    return { stale: true, reason: "stale_title_year" };
  }

  const mod =
    /<meta[^>]+property=["']article:modified_time["'][^>]+content=["']([^"']+)["']/i.exec(html) ??
    /<meta[^>]+name=["']last-modified["'][^>]+content=["']([^"']+)["']/i.exec(html);
  if (mod) {
    const t = Date.parse(mod[1]!);
    const titleLooksLive = /\b(live|scorecard|need\s+\d+)\b/i.test(title);
    if (
      Number.isFinite(t) &&
      Date.now() - t > 12 * 3600 * 1000 &&
      !titleLooksLive
    ) {
      return { stale: true, reason: "commentary_meta_stale" };
    }
  }
  if (/\bwon by\b/i.test(title) && !/\b(live|need|innings|trail)\b/i.test(title)) {
    return { stale: true, reason: "completed_title" };
  }
  if (/highlights|match highlights/i.test(title + url)) {
    return { stale: true, reason: "highlights" };
  }
  return { stale: false };
}

export type DiscoveryValidationResult = { ok: true } | { ok: false; reason: string };

/**
 * Before accepting scraped HTML for a discovered match URL.
 * Soft: allow rich live HTML even if title team parse fails.
 */
export function validateCricbuzzDiscoveryPage(
  html: string,
  url: string,
  matchId: string,
  options?: { relaxed?: boolean }
): DiscoveryValidationResult {
  const title = extractTitleFromHtml(html);

  if (isHardRejectedDiscoveryUrl(url)) {
    logRejectDebug({
      reason: "hard_discovery_url",
      url,
      title,
      stage: "validateCricbuzzDiscoveryPage",
    });
    bumpCricbuzzPagesRejected();
    return { ok: false, reason: "hard_discovery_url" };
  }

  if (options?.relaxed) {
    bumpCricbuzzPagesValidated();
    return { ok: true };
  }

  bumpCricbuzzPagesValidated();

  const stale = rejectStaleDiscoveryHtml(html, matchId, url);
  if (stale.stale) {
    logRejectDebug({
      reason: `stale:${stale.reason}`,
      url,
      title,
      stage: "validateCricbuzzDiscoveryPage",
    });
    bumpCricbuzzPagesRejected();
    return { ok: false, reason: `stale:${stale.reason}` };
  }

  if (htmlHasDiscoveryCricketSignals(html)) {
    return { ok: true };
  }

  if (!title) {
    logRejectDebug({
      reason: "missing_title",
      url,
      title: "",
      stage: "validateCricbuzzDiscoveryPage",
    });
    bumpCricbuzzPagesRejected();
    return { ok: false, reason: "missing_title" };
  }

  const teams = extractCleanTeams("", "", title);
  if (!teams.ok) {
    logRejectDebug({
      reason: teams.reason,
      url,
      title,
      stage: "validateCricbuzzDiscoveryPage",
    });
    bumpCricbuzzPagesRejected();
    return { ok: false, reason: teams.reason };
  }

  const hay = `${title} ${url}`.toLowerCase();
  if (
    /\b(points table|schedules)\b/.test(hay) &&
    !/\bvs\.?\b/.test(title.toLowerCase()) &&
    !/"matchInfo"/.test(html.slice(0, 120_000))
  ) {
    logRejectDebug({
      reason: "schedule_or_table_page",
      url,
      title,
      stage: "validateCricbuzzDiscoveryPage",
    });
    bumpCricbuzzPagesRejected();
    return { ok: false, reason: "schedule_or_table_page" };
  }

  return { ok: true };
}
