import { ingestDebugEnabled } from "@/lib/utils/ingestDebugFlags";

const TEAM_LOG = "[cricscore:team-normalize]";

function teamLog(...args: unknown[]): void {
  if (process.env.NODE_ENV === "development" || ingestDebugEnabled()) {
    console.log(TEAM_LOG, ...args);
  }
}

const JUNK_STRIP: RegExp[] = [
  /\blive cricket score\b/gi,
  /\bcommentary\b/gi,
  /\bindian premier league\s*20\d{2}\b/gi,
  /\btata ipl\s*20\d{2}\b/gi,
  /\bipl\s*20\d{2}\b/gi,
  /\bhighlights\b/gi,
  /\|\s*cricbuzz\.com\b/gi,
  /\bcricbuzz\b/gi,
  /\s*-\s*live\b/gi,
  /\s*-\s*live cricket.*$/i,
];

/** Known short codes → canonical display (optional expansion). */
const FRANCHISE_ABBREV: Record<string, string> = {
  csk: "Chennai Super Kings",
  mi: "Mumbai Indians",
  rcb: "Royal Challengers Bengaluru",
  srh: "Sunrisers Hyderabad",
  kkr: "Kolkata Knight Riders",
  rr: "Rajasthan Royals",
  dc: "Delhi Capitals",
  pbks: "Punjab Kings",
  pk: "Punjab Kings",
  lsg: "Lucknow Super Giants",
  gt: "Gujarat Titans",
};

export type ExtractCleanTeamsOpts = {
  score1?: string;
  score2?: string;
  overs?: string;
  /** When scoreboard is present + headline has "vs", accept progressively cleaned sides. */
  allowScoreboardLoose?: boolean;
};

export function normalizeFranchiseName(raw: string): string {
  const t = cleanTeamString(raw);
  if (!t) return "";
  const key = t.replace(/\./g, "").toLowerCase();
  const expanded = FRANCHISE_ABBREV[key];
  if (expanded) return expanded;
  return t;
}

export function cleanTeamString(raw: string): string {
  let s = raw.replace(/\s+/g, " ").trim();
  for (const re of JUNK_STRIP) {
    s = s.replace(re, " ");
  }
  s = s.replace(/\s*,\s*\d{1,3}(st|nd|rd|th)?\s*Match\b.*$/i, "");
  s = s.replace(/\s*,\s*Indian Premier League\b.*$/i, "");
  s = s.replace(/\s*-\s*Indian Premier League\b.*$/i, "");
  s = s.replace(/\s+/g, " ").replace(/^[\s,|-]+|[\s,|-]+$/g, "").trim();
  return s;
}

/** Obvious SEO / page chrome — always reject as a team label. */
function isSevereTeamGarbage(s: string): boolean {
  const l = s.toLowerCase();
  return (
    /\b(live cricket score|commentary only|cricbuzz\.com)\b/.test(l) ||
    (l.includes("premier league") && l.includes("match")) ||
    (l.length > 120 && /\b(match|score|commentary)\b/.test(l))
  );
}

export function isInvalidTeamName(s: string): boolean {
  const l = s.toLowerCase();
  if (!s.trim()) return true;
  if (s.length > 42) return true;
  if (/\b(score|scores|commentary|premier league|match|matches|cricbuzz)\b/.test(l)) return true;
  if (/\blive cricket\b/.test(l)) return true;
  if (/\d{1,3}(st|nd|rd|th)\s*match\b/i.test(l)) return true;
  if (/indian premier league/i.test(l)) return true;
  return false;
}

function hasScoreboardHint(opts?: ExtractCleanTeamsOpts): boolean {
  if (!opts) return false;
  const s1 = opts.score1?.trim() ?? "";
  const s2 = opts.score2?.trim() ?? "";
  const o = opts.overs?.trim() ?? "";
  const sc =
    (s1 && s1 !== "—" && !/^[\s—]+$/u.test(s1)) || (s2 && s2 !== "—" && !/^[\s—]+$/u.test(s2));
  const ov = o && o !== "—" && /\d/.test(o);
  return !!(sc || ov);
}

/** Last-resort label: trim SEO tail, cap length. */
function progressiveTeamForFallback(raw: string): string {
  let t = cleanTeamString(raw);
  t = t.split(/\s*-\s*Live\b/i)[0]!.trim();
  t = t.split(/\s*,\s*\d{1,3}(st|nd|rd|th)?\s*Match\b/i)[0]!.trim();
  t = t.replace(/\s+-\s*Indian Premier League\b.*$/i, "").trim();
  if (t.length > 46) {
    t = t.slice(0, 46).replace(/[, ].[^,]*$/, "").trim();
  }
  return normalizeFranchiseName(t);
}

/**
 * Split a headline / matchDesc into two sides; strip schedule/title trailers.
 */
export function splitVsHeadline(raw: string): [string, string] | null {
  const s = raw.replace(/\s+/g, " ").trim();
  if (!s) return null;

  const vsSplit = s.split(/\s+vs\.?\s+/i);
  if (vsSplit.length >= 2) {
    let left = vsSplit[0]!.trim();
    let right = vsSplit.slice(1).join(" vs ").trim();
    right = right.split(/\s*-\s*Live\b/i)[0]!.trim();
    right = right.split(/\s*,\s*\d{1,3}(st|nd|rd|th)?\s*Match\b/i)[0]!.trim();
    right = right.split(/\s*,\s*Indian Premier League\b/i)[0]!.trim();
    left = left.split(/\s*,\s*\d{1,3}(st|nd|rd|th)?\s*Match\b/i)[0]!.trim();
    left = cleanTeamString(left);
    right = cleanTeamString(right);
    if (left && right && !isInvalidTeamName(left) && !isInvalidTeamName(right)) {
      return [normalizeFranchiseName(left), normalizeFranchiseName(right)];
    }
  }

  const abbr = s.match(
    /\b(CSK|MI|RCB|SRH|KKR|RR|DC|PBKS|LSG|GT)\s+vs\.?\s+(CSK|MI|RCB|SRH|KKR|RR|DC|PBKS|LSG|GT)\b/i
  );
  if (abbr) {
    const a = normalizeFranchiseName(abbr[1]!);
    const b = normalizeFranchiseName(abbr[2]!);
    if (a && b) return [a, b];
  }

  return null;
}

export type CleanTeamsResult =
  | { ok: true; team1: string; team2: string }
  | { ok: false; reason: string };

function scoreboardLooseTeams(
  team1Raw: string,
  team2Raw: string,
  headline: string,
  opts?: ExtractCleanTeamsOpts
): CleanTeamsResult | null {
  if (!opts?.allowScoreboardLoose || !hasScoreboardHint(opts)) return null;
  const h = headline.trim();
  if (!/\bvs\.?\b/i.test(h)) return null;

  const vsSplit = h.split(/\s+vs\.?\s+/i);
  if (vsSplit.length < 2) return null;

  let L = progressiveTeamForFallback(vsSplit[0]!);
  let R = progressiveTeamForFallback(vsSplit.slice(1).join(" vs "));

  const ca = progressiveTeamForFallback(team1Raw);
  const cb = progressiveTeamForFallback(team2Raw);
  if (ca && !isSevereTeamGarbage(ca) && ca.length <= 52) L = ca;
  if (cb && !isSevereTeamGarbage(cb) && cb.length <= 52) R = cb;

  if (!L || !R || isSevereTeamGarbage(L) || isSevereTeamGarbage(R)) return null;

  teamLog({
    rawHeadline: h,
    parsedTeams: [L, R],
    reason: "scoreboard_loose_fallback",
  });
  return { ok: true, team1: L, team2: R };
}

/** Produce two safe franchise labels from any raw pair or headline. */
export function extractCleanTeams(
  team1Raw: string,
  team2Raw: string,
  headline?: string,
  opts?: ExtractCleanTeamsOpts
): CleanTeamsResult {
  const h = headline?.trim();
  let a = cleanTeamString(team1Raw);
  let b = cleanTeamString(team2Raw);

  if ((!a || !b || isInvalidTeamName(a) || isInvalidTeamName(b)) && h) {
    const sp = splitVsHeadline(h);
    if (sp) {
      a = sp[0];
      b = sp[1];
    }
  }

  if (h && (!a || !b || isInvalidTeamName(a) || isInvalidTeamName(b))) {
    const sp = splitVsHeadline(h);
    if (sp) {
      a = sp[0];
      b = sp[1];
    }
  }

  a = normalizeFranchiseName(a);
  b = normalizeFranchiseName(b);

  if (!a || !b) {
    const loose = scoreboardLooseTeams(team1Raw, team2Raw, h ?? "", opts);
    if (loose) return loose;
    teamLog({ rawHeadline: h ?? "", parsedTeams: [a, b], reason: "empty_after_clean" });
    return { ok: false, reason: "empty_teams" };
  }
  if (isInvalidTeamName(a) || isInvalidTeamName(b)) {
    const loose = scoreboardLooseTeams(team1Raw, team2Raw, h ?? "", opts);
    if (loose) return loose;
    teamLog({ rawHeadline: h ?? "", parsedTeams: [a, b], reason: "invalid_token" });
    return { ok: false, reason: "invalid_team_token" };
  }

  teamLog({ rawHeadline: h ?? "", parsedTeams: [a, b] });
  return { ok: true, team1: a, team2: b };
}
