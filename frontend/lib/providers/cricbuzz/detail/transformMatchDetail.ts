import type { BattingRow, BowlingRow, CommentaryItem, Match } from "@/lib/data/matches";
import { extractCommentaryFromJsonRoots } from "@/lib/providers/cricbuzzScraper/commentary";
import { extractBattingBowlingFromJsonRoots } from "@/lib/providers/cricbuzzScraper/scorecard";

function asRec(v: unknown): Record<string, unknown> | null {
  if (typeof v !== "object" || v === null || Array.isArray(v)) return null;
  return v as Record<string, unknown>;
}

function str(v: unknown, d = ""): string {
  if (v === undefined || v === null) return d;
  return String(v);
}

function num(v: unknown, d = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function formatOverBallLabel(r: Record<string, unknown>): string {
  const ov = num(r.overNumber ?? r.ovrNbr ?? r.ovr ?? r.overNbr ?? r.over ?? r.o, -1);
  const bn = num(r.ballNumber ?? r.ballNbr ?? r.ballNBR ?? r.nbr ?? r.b ?? r.bn, -1);
  if (ov >= 0 && bn >= 0) {
    const oi = Math.floor(ov);
    return `${oi}.${bn}`;
  }
  const raw = str(r.over ?? r.ov ?? r.ball ?? "").trim();
  const m = raw.match(/^(\d+)\.(\d+)/);
  if (m) return `${m[1]}.${m[2]}`;
  return "";
}

function isCommRow(r: Record<string, unknown>): boolean {
  return Boolean(
    str(
      r.commText ??
        r.text ??
        r.description ??
        r.commentary ??
        r.comment ??
        r.comm ??
        ""
    ).trim()
  );
}

/**
 * Ball-by-ball / commLines style rows (feeds recent-over parsing when over is `12.3`).
 */
function extractBallCommentaryRows(roots: unknown[], maxItems: number): CommentaryItem[] {
  const out: CommentaryItem[] = [];
  const seen = new Set<string>();

  function pushRow(r: Record<string, unknown>): void {
    if (out.length >= maxItems) return;
    if (!isCommRow(r)) return;
    const text = str(
      r.commText ?? r.text ?? r.description ?? r.commentary ?? r.comment ?? r.comm ?? ""
    ).trim();
    if (!text) return;
    let over = formatOverBallLabel(r);
    const evt = asRec(r.event);
    if (!over && evt) {
      over = formatOverBallLabel({ ...r, ...evt });
    }
    if (!over) over = str(r.over ?? r.ov ?? "").trim() || "—";
    const key = `${over}|${text.slice(0, 200)}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ over, text });
  }

  function walk(node: unknown): void {
    if (out.length >= maxItems) return;
    if (node === null || node === undefined) return;
    if (Array.isArray(node)) {
      if (node.length && typeof node[0] === "object" && node[0] !== null) {
        const r0 = asRec(node[0]);
        if (r0 && isCommRow(r0)) {
          for (const x of node) {
            const r = asRec(x);
            if (r) pushRow(r);
            if (out.length >= maxItems) return;
          }
          return;
        }
      }
      for (const x of node) walk(x);
      return;
    }
    const r = asRec(node);
    if (!r) return;

    const arrays = [
      r.commLines,
      r.commentaryList,
      r.ballCommentary,
      r.ballList,
      r.commentaries,
      asRec(r.overSummary)?.recentOvers,
      asRec(r.overSummary)?.balls,
    ];
    for (const arr of arrays) {
      if (Array.isArray(arr) && arr.length && asRec(arr[0]) && isCommRow(asRec(arr[0])!)) {
        for (const x of arr) {
          const row = asRec(x);
          if (row) pushRow(row);
          if (out.length >= maxItems) return;
        }
      }
    }

    for (const v of Object.values(r)) walk(v);
  }

  for (const root of roots) walk(root);
  return out;
}

function commentaryQualityScore(rows: CommentaryItem[]): number {
  let s = rows.length * 3;
  for (const c of rows) {
    if (/^\d+\.\d+/.test(c.over.trim())) s += 12;
    else if (/^\d+\.\d+/.test(c.text.trim())) s += 10;
    if (/\b(wicket|four|six|wide|no ball|runs?)\b/i.test(c.text)) s += 1;
  }
  return s;
}

function mergeCommentaryLists(a: CommentaryItem[], b: CommentaryItem[], max: number): CommentaryItem[] {
  const qa = commentaryQualityScore(a);
  const qb = commentaryQualityScore(b);
  let primary: CommentaryItem[];
  let secondary: CommentaryItem[];
  if (qb > qa) {
    primary = b;
    secondary = a;
  } else {
    primary = a;
    secondary = b;
  }
  const seen = new Set<string>();
  const out: CommentaryItem[] = [];
  const push = (c: CommentaryItem) => {
    const k = `${c.over}|${c.text.slice(0, 160)}`;
    if (seen.has(k)) return;
    seen.add(k);
    out.push(c);
  };
  for (const c of primary) push(c);
  for (const c of secondary) {
    if (out.length >= max) break;
    push(c);
  }
  const sorted = out
    .map((c, i) => ({ c, i, k: sortKeyForCommentary(c, i) }))
    .sort((x, y) => (x.k !== y.k ? x.k - y.k : x.i - y.i))
    .map((x) => x.c);
  return sorted.slice(-max);
}

function sortKeyForCommentary(c: CommentaryItem, seq: number): number {
  const m = c.over.trim().match(/^(\d+)\.(\d+)/) ?? c.text.trim().match(/^(\d+)\.(\d+)/);
  if (!m) return 500_000 + seq;
  return parseInt(m[1], 10) * 200 + parseInt(m[2], 10);
}

export type MatchDetailTransformMeta = {
  extractionSource: string;
  detailUrl?: string;
};

export type MatchDetailEnrichment = {
  batting: BattingRow[];
  bowling: BowlingRow[];
  commentary: CommentaryItem[];
};

const DETAIL_LOG = "[cricscore:detail]";

function detailLog(...args: unknown[]): void {
  if (process.env.NODE_ENV === "development") {
    console.log(DETAIL_LOG, ...args);
  }
}

function countRecentOverCandidates(commentary: CommentaryItem[]): number {
  let n = 0;
  for (const c of commentary) {
    if (/^\d+\.\d+/.test(c.over.trim()) || /^\d+\.\d+/.test(c.text.trim())) n++;
  }
  return n;
}

function ballDisplayFromRow(r: Record<string, unknown>): string | null {
  const runs = num(r.runs ?? r.r ?? r.run, -1);
  const isWicket =
    r.isWicket === true ||
    r.wicket === true ||
    /wicket|out/i.test(str(r.commText ?? r.text ?? r.event ?? ""));
  if (isWicket) return "W";
  if (runs === 4) return "4";
  if (runs === 6) return "6";
  if (runs === 0) return "0";
  if (runs > 0) return String(runs);
  const evt = str(r.event ?? r.ballType ?? r.type ?? "").toLowerCase();
  if (evt.includes("wicket")) return "W";
  if (evt.includes("four")) return "4";
  if (evt.includes("six")) return "6";
  if (evt.includes("wide")) return "wd";
  if (evt.includes("noball") || evt.includes("no ball")) return "nb";
  return null;
}

/**
 * Convert recentOvers / overSummary JSON into synthetic commentary lines for ball parsing.
 */
function extractRecentOversAsCommentary(roots: unknown[], maxItems: number): CommentaryItem[] {
  const out: CommentaryItem[] = [];
  const seen = new Set<string>();

  function pushBall(overInt: number, ballNbr: number, text: string): void {
    if (out.length >= maxItems || !text.trim()) return;
    const over = `${overInt}.${ballNbr}`;
    const key = `${over}|${text.slice(0, 80)}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ over, text: text.trim() });
  }

  function walkOverSummary(arr: unknown[]): void {
    for (const item of arr) {
      const r = asRec(item);
      if (!r) continue;
      const overInt = num(r.overNumber ?? r.over ?? r.ovrNbr ?? r.ovr, -1);
      const balls = r.balls ?? r.ballList ?? r.commLines;
      if (Array.isArray(balls)) {
        for (const b of balls) {
          const br = asRec(b);
          if (!br) continue;
          const bn = num(br.ballNumber ?? br.ballNbr ?? br.nbr ?? br.b, -1);
          const disp = ballDisplayFromRow(br);
          const text =
            str(br.commText ?? br.text ?? "").trim() ||
            (disp ? `${overInt >= 0 ? overInt : "?"}.${bn >= 0 ? bn : "?"} ${disp === "W" ? "Wicket" : disp + " run(s)"}` : "");
          if (overInt >= 0 && bn >= 0 && text) pushBall(overInt, bn, text);
        }
      }
      const runStr = str(r.runs ?? r.runSummary ?? "").trim();
      if (overInt >= 0 && runStr) {
        pushBall(overInt, 6, `Over ${overInt}: ${runStr}`);
      }
    }
  }

  function walk(node: unknown): void {
    if (out.length >= maxItems) return;
    if (node === null || node === undefined) return;
    if (Array.isArray(node)) {
      for (const x of node) walk(x);
      return;
    }
    const r = asRec(node);
    if (!r) return;

    for (const k of ["recentOvers", "inningsOvers", "lastOvers"]) {
      const arr = r[k];
      if (Array.isArray(arr) && arr.length) walkOverSummary(arr);
    }
    const os = asRec(r.overSummary);
    if (os?.recentOvers && Array.isArray(os.recentOvers)) {
      walkOverSummary(os.recentOvers);
    }

    for (const v of Object.values(r)) walk(v);
  }

  for (const root of roots) walk(root);
  return out;
}

/**
 * Normalize Cricbuzz detail JSON roots into scorecard + commentary.
 */
export function transformMatchDetail(
  roots: unknown[],
  meta: MatchDetailTransformMeta
): MatchDetailEnrichment {
  const bb = extractBattingBowlingFromJsonRoots(roots);
  const leg = extractCommentaryFromJsonRoots(roots, 600);
  const ball = extractBallCommentaryRows(roots, 600);
  const recentFallback = extractRecentOversAsCommentary(roots, 120);
  const commentary = mergeCommentaryLists(
    mergeCommentaryLists(leg, ball, 600),
    recentFallback,
    600
  );

  const recentCandidates = countRecentOverCandidates(commentary);

  detailLog({
    extractionSource: meta.extractionSource,
    detailUrl: meta.detailUrl,
    battingRows: bb.batting.length,
    bowlingRows: bb.bowling.length,
    commentaryCount: commentary.length,
    recentOverCandidates: recentCandidates,
  });

  return {
    batting: bb.batting,
    bowling: bb.bowling,
    commentary,
  };
}

function battingRichness(rows: BattingRow[]): number {
  return (
    rows.length * 40 +
    rows.reduce((s, r) => s + (r.balls > 0 ? 6 : 0) + (r.runs > 0 ? 2 : 0), 0)
  );
}

function bowlingRichness(rows: BowlingRow[]): number {
  return rows.length * 35 + rows.reduce((s, r) => s + (parseFloat(r.overs) > 0 ? 5 : 0), 0);
}

/**
 * Prefer Cricbuzz-derived slices when richer; keep CricketData when it already carries more signal.
 */
export function mergeDetailEnrichmentIntoMatch(
  base: Match,
  cricbuzz: MatchDetailEnrichment
): Match {
  const bat =
    battingRichness(cricbuzz.batting) >= battingRichness(base.batting) && cricbuzz.batting.length
      ? cricbuzz.batting
      : base.batting.length
        ? base.batting
        : cricbuzz.batting;
  const bowl =
    bowlingRichness(cricbuzz.bowling) >= bowlingRichness(base.bowling) && cricbuzz.bowling.length
      ? cricbuzz.bowling
      : base.bowling.length
        ? base.bowling
        : cricbuzz.bowling;
  const comm = mergeCommentaryLists(base.commentary, cricbuzz.commentary, 650);

  return {
    ...base,
    batting: bat,
    bowling: bowl,
    commentary: comm,
  };
}
