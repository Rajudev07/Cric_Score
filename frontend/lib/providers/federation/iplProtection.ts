import type { Match } from "@/lib/data/matches";
import { containsIplSignals } from "@/lib/utils/iplDetection";

const IPL_VENUE_HINTS =
  /\b(wankhede|eden gardens|chinnaswamy|arun jaitley|narendra modi|chepauk|m\.?a\.?\s*chidambaram|d\.?y\.?\s*patil|brabourne|w\.?p\.?s\s*pavilion|barsapara|dharamsala|mohali|jaipur|lucknow|hyderabad)\b/i;

const IPL_FRANCHISE_RE =
  /\b(delhi capitals|rajasthan royals|mumbai indians|chennai super kings|kolkata knight riders|royal challengers|sunrisers hyderabad|punjab kings|gujarat titans|lucknow super giants)\b/i;

const IPL_STATUS_RE =
  /\b(ipl|tata\s*ipl|indian premier league|strategic timeout|powerplay|super over|play.?off|eliminator|qualifier)\b/i;

/**
 * When true, federation must not drop the row for weak flags and should merge partial payloads aggressively.
 */
export function isIplProtectionMode(m: Match): boolean {
  const blob = `${m.league} ${m.team1} ${m.team2} ${m.status}`;
  if (containsIplSignals(blob, { silent: true })) return true;
  if (IPL_FRANCHISE_RE.test(`${m.team1} ${m.team2}`)) return true;
  if (IPL_STATUS_RE.test(m.status)) return true;
  if (IPL_VENUE_HINTS.test(blob)) return true;
  return false;
}
