import type { Match } from "@/lib/data/matches";
import { containsIplSignals } from "@/lib/utils/iplDetection";

/** Positive in-play / scoreboard signals (exclude bare completed "won by"). */
function statusHasLiveSignal(status: string): boolean {
  const s = status.toLowerCase();
  if (/\bwon by\b/.test(s) && !/\b(need|trail|target|runs)\b/.test(s)) return false;
  return /\b(need|won|trail|stumps|innings|target|elected|opt to|live|in progress|strategic timeout|drinks|powerplay|super over)\b/.test(
    s
  );
}

function hasScoreOrOvers(m: Match): boolean {
  const s1 = m.score1?.trim() ?? "";
  const s2 = m.score2?.trim() ?? "";
  const o = m.overs?.trim() ?? "";
  const hasScore = !!(
    (s1 && s1 !== "—" && !/^[\s—]+$/u.test(s1)) || (s2 && s2 !== "—" && !/^[\s—]+$/u.test(s2))
  );
  const hasOvers = !!(o && o !== "—" && /\d/.test(o));
  return hasScore || hasOvers;
}

function isHighlightsOrListingPage(status: string, league: string): boolean {
  const s = `${status} ${league}`.toLowerCase();
  return /\bhighlights\b/.test(s) || /\bpoints table\b/.test(s) || /\bstandings\b/.test(s);
}

function isPreviewOrScheduleOnly(status: string, m: Match): boolean {
  const s = status.toLowerCase();
  if (
    /\bpreview\b/.test(s) ||
    /\bpreview\s*:/.test(s) ||
    /\bschedule\b/.test(s) ||
    /\bfantasy tips\b/.test(s)
  ) {
    return true;
  }
  if (/\bupcoming\b/.test(s) && !hasScoreOrOvers(m)) return true;
  return false;
}

/**
 * True only for IPL/franchise context rows that look genuinely in-play (not schedule/preview-only).
 */
export function isRealLiveIplMatch(m: Match): boolean {
  const hay = `${m.league} ${m.team1} ${m.team2} ${m.status}`;
  if (!containsIplSignals(hay, { silent: true })) {
    return false;
  }

  if (m.matchEnded && !m.isLive && !hasScoreOrOvers(m)) {
    return false;
  }

  if (isHighlightsOrListingPage(m.status, m.league)) {
    return false;
  }

  const liveSignals = hasScoreOrOvers(m) || statusHasLiveSignal(m.status);
  if (!liveSignals) {
    return false;
  }

  if (isPreviewOrScheduleOnly(m.status, m) && !hasScoreOrOvers(m)) {
    return false;
  }

  return true;
}
