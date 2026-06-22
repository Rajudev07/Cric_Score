import type { BattingRow, BowlingRow } from "@/lib/data/matches";

function asRec(v: unknown): Record<string, unknown> | null {
  if (typeof v !== "object" || v === null || Array.isArray(v)) return null;
  return v as Record<string, unknown>;
}

function num(v: unknown, d = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function str(v: unknown, d = ""): string {
  if (v === undefined || v === null) return d;
  return String(v);
}

function isBattingLike(o: unknown): boolean {
  const r = asRec(o);
  if (!r) return false;
  const hasRuns =
    r.runs !== undefined ||
    r.r !== undefined ||
    r.batRuns !== undefined ||
    r.batrun !== undefined;
  const hasName =
    r.batName !== undefined ||
    r.name !== undefined ||
    r.shortName !== undefined ||
    r.fullName !== undefined ||
    r.nickName !== undefined ||
    r.batShortName !== undefined ||
    asRec(r.batsman)?.name !== undefined;
  const hasBalls = r.balls !== undefined || r.b !== undefined || r.batBalls !== undefined;
  return (hasRuns || hasBalls) && hasName;
}

function isBowlingLike(o: unknown): boolean {
  const r = asRec(o);
  if (!r) return false;
  const hasWk = r.wickets !== undefined || r.w !== undefined || r.wkts !== undefined;
  const hasOvers = r.overs !== undefined || r.o !== undefined || r.bowlOvers !== undefined;
  const hasName =
    r.bowlName !== undefined ||
    r.name !== undefined ||
    r.shortName !== undefined ||
    asRec(r.bowler)?.name !== undefined;
  return hasName && (hasWk || hasOvers);
}

function mapBatting(o: Record<string, unknown>): BattingRow | null {
  const nested = asRec(o.batsman) ?? asRec(o.batter);
  const name = str(
    o.batName ??
      o.name ??
      o.shortName ??
      o.fullName ??
      o.nickName ??
      o.batShortName ??
      nested?.name ??
      nested?.shortName ??
      nested?.fullName ??
      ""
  );
  if (!name || /^(did not bat|dnb)$/i.test(name.trim())) return null;
  return {
    batter: name,
    runs: num(o.runs ?? o.r ?? o.batRuns ?? o.batrun),
    balls: num(o.balls ?? o.b ?? o.batBalls),
    fours: num(o.fours ?? o["4s"] ?? o.four ?? o.boundaries ?? o.fourX),
    sixes: num(o.sixes ?? o["6s"] ?? o.six ?? o.sixX),
    sr: num(o.strikeRate ?? o.sr ?? o.strikerate ?? o.batStrikeRate),
  };
}

function mapBowling(o: Record<string, unknown>): BowlingRow | null {
  const nested = asRec(o.bowler);
  const name = str(
    o.bowlName ?? o.name ?? o.shortName ?? nested?.name ?? nested?.shortName ?? ""
  );
  if (!name) return null;
  return {
    bowler: name,
    overs: str(o.overs ?? o.o ?? o.bowlOvers, "0"),
    runs: num(o.runs ?? o.r ?? o.bowlRuns),
    wickets: num(o.wickets ?? o.w ?? o.wkts),
    economy: num(o.economy ?? o.econ ?? o.eco ?? o.ECON ?? o.bowlEcon),
  };
}

function walkScoreCardInnings(node: unknown, pushBat: (rows: unknown[]) => void, pushBowl: (rows: unknown[]) => void): void {
  const r = asRec(node);
  if (!r) return;

  const scoreCards = [r.scoreCard, r.scorecard, r.scoreCardList, r.scorecardList];
  for (const sc of scoreCards) {
    if (!Array.isArray(sc)) continue;
    for (const inn of sc) {
      const ir = asRec(inn);
      if (!ir) continue;
      const bat =
        ir.batsman ??
        ir.batsmen ??
        ir.batting ??
        asRec(ir.batTeamDetails)?.batsmanData ??
        asRec(ir.batTeamDetails)?.batsmen;
      if (Array.isArray(bat) && bat.length) pushBat(bat);
      const bowl =
        ir.bowler ??
        ir.bowlers ??
        ir.bowling ??
        asRec(ir.bowlTeamDetails)?.bowlersData ??
        asRec(ir.bowlTeamDetails)?.bowler;
      if (Array.isArray(bowl) && bowl.length) pushBowl(bowl);
    }
  }
}

/**
 * Walk embedded JSON roots and collect batting / bowling rows (Cricbuzz-style keys).
 */
export function extractBattingBowlingFromJsonRoots(roots: unknown[]): {
  batting: BattingRow[];
  bowling: BowlingRow[];
} {
  const batting: BattingRow[] = [];
  const bowling: BowlingRow[] = [];
  const seenBat = new Set<string>();
  const seenBowl = new Set<string>();

  function pushBat(rows: unknown[]): void {
    for (const row of rows) {
      const r = asRec(row);
      if (!r || !isBattingLike(r)) continue;
      const m = mapBatting(r);
      if (!m) continue;
      const key = `${m.batter}-${m.runs}-${m.balls}`;
      if (seenBat.has(key)) continue;
      seenBat.add(key);
      batting.push(m);
    }
  }

  function pushBowl(rows: unknown[]): void {
    for (const row of rows) {
      const r = asRec(row);
      if (!r || !isBowlingLike(r)) continue;
      const m = mapBowling(r);
      if (!m) continue;
      const key = `${m.bowler}-${m.overs}-${m.wickets}`;
      if (seenBowl.has(key)) continue;
      seenBowl.add(key);
      bowling.push(m);
    }
  }

  function walk(node: unknown): void {
    if (node === null || node === undefined) return;
    if (Array.isArray(node)) {
      if (
        node.length > 0 &&
        node.every((x) => typeof x === "object" && x !== null && isBattingLike(x))
      ) {
        pushBat(node);
        return;
      }
      if (
        node.length > 0 &&
        node.every((x) => typeof x === "object" && x !== null && isBowlingLike(x))
      ) {
        pushBowl(node);
        return;
      }
      for (const x of node) walk(x);
      return;
    }
    const r = asRec(node);
    if (!r) return;

    walkScoreCardInnings(r, pushBat, pushBowl);

    const batArrays = [
      r.batsman,
      r.batsmen,
      r.batting,
      r.batters,
      asRec(r.batTeamDetails)?.batsmanData,
      asRec(r.batTeamDetails)?.batsmen,
      asRec(r.inningsBatTeam)?.batsman,
    ];
    for (const arr of batArrays) {
      if (Array.isArray(arr) && arr.length && isBattingLike(arr[0])) {
        pushBat(arr);
      }
    }

    const bowlArrays = [
      r.bowler,
      r.bowlers,
      r.bowling,
      asRec(r.bowlTeamDetails)?.bowlersData,
      asRec(r.bowlTeamDetails)?.bowler,
      asRec(r.inningsBowlTeam)?.bowler,
    ];
    for (const arr of bowlArrays) {
      if (Array.isArray(arr) && arr.length && isBowlingLike(arr[0])) {
        pushBowl(arr);
      }
    }

    if (Array.isArray(r.innings)) {
      for (const inn of r.innings) {
        const ir = asRec(inn);
        if (!ir) continue;
        const bi = ir.batting ?? ir.batsmen ?? ir.batsman ?? asRec(ir.batTeamDetails)?.batsmanData;
        if (Array.isArray(bi) && bi.length && isBattingLike(bi[0])) {
          pushBat(bi);
        }
        const bo = ir.bowling ?? ir.bowlers ?? ir.bowler ?? asRec(ir.bowlTeamDetails)?.bowlersData;
        if (Array.isArray(bo) && bo.length && isBowlingLike(bo[0])) {
          pushBowl(bo);
        }
      }
    }

    for (const v of Object.values(r)) walk(v);
  }

  for (const root of roots) walk(root);

  return { batting, bowling };
}
