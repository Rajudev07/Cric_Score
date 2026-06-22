import type { BattingRow, CommentaryItem, Match } from "@/lib/data/matches";

export type BallKind =
  | "wicket"
  | "four"
  | "six"
  | "dot"
  | "runs"
  | "wide"
  | "noball"
  | "bye"
  | "legbye"
  | "unknown";

export interface BallEvent {
  overInt: number;
  ballDecimal: number;
  display: string;
  kind: BallKind;
  runs: number;
  rawText: string;
}

export interface RecentOver {
  overNumber: number;
  balls: BallEvent[];
}

export interface PartnershipInfo {
  label: string;
  runs: number;
  balls: number;
  batters: string;
}

export interface FallOfWicketInfo {
  wicket: number;
  score: string;
  batter: string;
  over: string;
}

export interface MatchInfoFields {
  venue?: string;
  toss?: string;
  decision?: string;
  matchType: string;
  tournament: string;
  matchNumber?: string;
  startDisplay?: string;
}

function parseBallDecimal(
  overField: string,
  text: string
): { overInt: number; ballDecimal: number } | null {
  const fromField = overField.trim().match(/^(\d+)\.(\d+)/);
  const fromText = text.match(/^\s*(\d+)\.(\d+)\b/);
  const m = fromField ?? fromText;
  if (!m) return null;
  const overInt = parseInt(m[1], 10);
  const ballPart = m[2];
  const ballDecimal = parseFloat(`${overInt}.${ballPart}`);
  if (!Number.isFinite(ballDecimal)) return null;
  return { overInt, ballDecimal };
}

function classifyBall(text: string): {
  display: string;
  kind: BallKind;
  runs: number;
} | null {
  const t = text.toLowerCase();
  if (
    /\bwicket\b|\bout!\b|\bout,|\bout:|caught\b|bowled\b|lbw\b|stumped\b|run out\b/i.test(
      text
    )
  ) {
    return { display: "W", kind: "wicket", runs: 0 };
  }
  if (/\bfour\b|\bfour!\b|\b4\s+runs\b| four /i.test(text)) {
    return { display: "4", kind: "four", runs: 4 };
  }
  if (/\bsix\b|\bsix!\b|\b6\s+runs\b/i.test(text)) {
    return { display: "6", kind: "six", runs: 6 };
  }
  if (/\bwide\b|\bwd\b/i.test(text) && !/\bwide\s+of\b/i.test(t)) {
    return { display: "wd", kind: "wide", runs: 1 };
  }
  if (/\bno ball\b|\bno-ball\b|\bnb\b/i.test(t)) {
    return { display: "nb", kind: "noball", runs: 1 };
  }
  if (/leg\s*bye/i.test(t)) {
    return { display: "lb", kind: "legbye", runs: 1 };
  }
  if (/\bbye\b/i.test(t) && !/leg\s*bye/i.test(t)) {
    return { display: "b", kind: "bye", runs: 1 };
  }
  const runM = t.match(/(\d+)\s+runs?/);
  if (runM) {
    const r = parseInt(runM[1], 10);
    if (r === 0) return { display: "0", kind: "dot", runs: 0 };
    return { display: String(r), kind: "runs", runs: r };
  }
  if (/no run|dot ball|no\s+run/i.test(t)) {
    return { display: "0", kind: "dot", runs: 0 };
  }
  if (/\bone run\b|\ba single\b/i.test(t)) {
    return { display: "1", kind: "runs", runs: 1 };
  }
  if (/\btwo runs\b|\b2 runs\b/i.test(t)) {
    return { display: "2", kind: "runs", runs: 2 };
  }
  if (/\bthree runs\b|\b3 runs\b/i.test(t)) {
    return { display: "3", kind: "runs", runs: 3 };
  }
  return null;
}

/**
 * Parse ball-by-ball events from commentary lines (Cricbuzz-style comm text).
 */
export function parseBallEventsFromCommentary(
  commentary: CommentaryItem[]
): BallEvent[] {
  const out: BallEvent[] = [];
  const seen = new Set<string>();

  for (const item of commentary) {
    const pos = parseBallDecimal(item.over, item.text);
    if (!pos) {
      const overLine = item.text.match(/\bover\s+(\d+)\s*:\s*([0-9wdnbW\s]+)/i);
      if (overLine) {
        const overInt = parseInt(overLine[1]!, 10);
        const tokens = overLine[2]!.trim().split(/\s+/);
        tokens.forEach((tok, i) => {
          const t = tok.toUpperCase();
          let display = tok;
          let kind: BallKind = "unknown";
          let runs = 0;
          if (t === "W") {
            display = "W";
            kind = "wicket";
          } else if (t === "WD" || t === "WIDE") {
            display = "wd";
            kind = "wide";
            runs = 1;
          } else if (t === "NB") {
            display = "nb";
            kind = "noball";
            runs = 1;
          } else if (/^\d+$/.test(t)) {
            const r = parseInt(t, 10);
            display = String(r);
            runs = r;
            kind = r === 0 ? "dot" : r === 4 ? "four" : r === 6 ? "six" : "runs";
          } else {
            return;
          }
          const ballDecimal = overInt + (i + 1) / 10;
          const key = `${ballDecimal}|${display}`;
          if (seen.has(key)) return;
          seen.add(key);
          out.push({
            overInt,
            ballDecimal,
            display,
            kind,
            runs,
            rawText: item.text,
          });
        });
      }
      continue;
    }
    const cls = classifyBall(item.text);
    if (!cls) continue;
    const key = `${pos.ballDecimal}|${cls.display}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      overInt: pos.overInt,
      ballDecimal: pos.ballDecimal,
      display: cls.display,
      kind: cls.kind,
      runs: cls.runs,
      rawText: item.text,
    });
  }

  out.sort((a, b) => a.ballDecimal - b.ballDecimal);
  return out;
}

export function buildRecentOvers(
  events: BallEvent[],
  maxOvers = 5
): RecentOver[] {
  if (!events.length) return [];
  const byOver = new Map<number, BallEvent[]>();
  for (const e of events) {
    const arr = byOver.get(e.overInt) ?? [];
    arr.push(e);
    byOver.set(e.overInt, arr);
  }
  for (const [, balls] of byOver) {
    balls.sort((a, b) => a.ballDecimal - b.ballDecimal);
  }
  const sortedKeys = [...byOver.keys()].sort((a, b) => a - b);
  const lastKeys = sortedKeys.slice(-maxOvers).reverse();
  return lastKeys.map((overNumber) => ({
    overNumber,
    balls: byOver.get(overNumber) ?? [],
  }));
}

export function derivePartnerships(
  commentary: CommentaryItem[],
  batting: BattingRow[]
): PartnershipInfo[] {
  const out: PartnershipInfo[] = [];
  const joined = commentary.map((c) => c.text).join("\n");
  const re = /partnership\s*[:\s]+(\d+)\s*\(\s*(\d+)\s*\)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(joined)) !== null) {
    out.push({
      label: "Partnership",
      runs: parseInt(m[1], 10),
      balls: parseInt(m[2], 10),
      batters: "—",
    });
  }

  if (batting.length >= 2) {
    const withBalls = batting.filter((b) => b.balls > 0);
    const tail = withBalls.slice(-2);
    if (tail.length === 2) {
      out.unshift({
        label: "Crease (scorecard)",
        runs: tail[0].runs + tail[1].runs,
        balls: tail[0].balls + tail[1].balls,
        batters: `${tail[0].batter} · ${tail[1].batter}`,
      });
    }
  }

  return out.slice(0, 6);
}

export function deriveFallOfWickets(
  commentary: CommentaryItem[]
): FallOfWicketInfo[] {
  const rows: FallOfWicketInfo[] = [];
  let wk = 0;
  for (const c of commentary) {
    const scoreM = c.text.match(/\b(\d+)\/(\d+)\b/);
    const overM = c.text.match(/(\d+\.\d+)\s*ov/i);
    const wicketish =
      /\b(wicket|caught|bowled|lbw|stumped|run out|OUT)\b/i.test(c.text) ||
      /\bout!\b/i.test(c.text);
    if (wicketish && scoreM) {
      wk += 1;
      const batter =
        c.text.replace(/^[^a-zA-Z]*/, "").slice(0, 72).trim() || "—";
      rows.push({
        wicket: wk,
        score: `${scoreM[1]}/${scoreM[2]}`,
        batter,
        over: overM?.[1] ?? (c.over !== "—" ? c.over : "—"),
      });
    }
  }
  return rows.slice(-12);
}

export function deriveMatchInfo(match: Match): MatchInfoFields {
  const status = match.status;
  const toss =
    status.match(/toss[:\s]+([^.|]+(?:\([^)]*\))?)/i)?.[1]?.trim() ??
    status.match(/won the toss[:\s,]+([^.|]+)/i)?.[1]?.trim();
  const decision =
    status.match(/opt(?:ed)?\s+to\s+(bat|bowl|field)[^.,]*/i)?.[0]?.trim();
  const venue =
    status.match(/\bat\s+([^.|\n]+)/i)?.[1]?.trim() ??
    status.match(/venue[:\s]+([^.|]+)/i)?.[1]?.trim();
  const matchNumber =
    status.match(/(\d+)(?:st|nd|rd|th)\s+match/i)?.[0]?.trim() ??
    status.match(/match\s*#?\s*(\d+)/i)?.[0]?.trim();
  let startDisplay: string | undefined;
  if (match.startTimeIso) {
    const t = Date.parse(match.startTimeIso);
    startDisplay = Number.isFinite(t)
      ? new Date(t).toLocaleString([], {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : match.startTimeIso;
  }
  return {
    venue,
    toss,
    decision,
    matchType: match.matchType?.trim() || "—",
    tournament: match.league?.trim() || "—",
    matchNumber,
    startDisplay,
  };
}
