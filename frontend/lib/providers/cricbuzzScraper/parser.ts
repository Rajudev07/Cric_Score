import { safeJsonParse, summarizeJsonKeys } from "@/lib/providers/cricbuzzScraper/safeJsonParse";

function devLog(...args: unknown[]) {
  if (process.env.NODE_ENV === "development") {
    console.log("[cricscore:cricbuzz-scraper:parser]", ...args);
  }
}

export type JsonExtractionStrategyLog = {
  name: string;
  attempted: boolean;
  parseOk: boolean;
  rootsAdded: number;
  parseError?: string;
  keySample?: string[];
};

function extractBalancedJson(text: string, start: number): string | null {
  const open = text[start];
  if (open !== "{" && open !== "[") return null;
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      if (esc) {
        esc = false;
      } else if (c === "\\") {
        esc = true;
      } else if (c === '"') {
        inStr = false;
      }
      continue;
    }
    if (c === '"') {
      inStr = true;
      continue;
    }
    if (c === open) depth++;
    else if (c === close) {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

function scoreJsonRelevance(s: string): number {
  let n = 0;
  if (s.includes("matchInfo")) n += 5;
  if (s.includes("seriesMatches")) n += 4;
  if (s.includes("team1")) n += 2;
  if (s.includes("team2")) n += 2;
  if (s.includes("matchScore")) n += 3;
  if (s.includes("matchId")) n += 3;
  if (s.includes("live")) n += 1;
  if (s.includes("scoreCard") || s.includes("scorecard")) n += 4;
  if (s.includes("commText") || s.includes("commLines")) n += 4;
  if (s.includes("commentary")) n += 3;
  if (s.includes("batsman") || s.includes("batsmen")) n += 3;
  if (s.includes("recentOvers") || s.includes("overSummary")) n += 3;
  return n;
}

function pushUniqueRoot(
  out: unknown[],
  seen: Set<string>,
  value: unknown,
  log: JsonExtractionStrategyLog
): void {
  let ser: string;
  try {
    ser = JSON.stringify(value);
  } catch {
    return;
  }
  if (ser.length < 40) return;
  if (seen.has(ser)) return;
  seen.add(ser);
  out.push(value);
  log.rootsAdded += 1;
  if (!log.keySample?.length) {
    log.keySample = summarizeJsonKeys(value);
  }
}

/** Next.js: JSON inside <script id="__NEXT_DATA__"> */
function tryNextDataScript(
  html: string,
  out: unknown[],
  seen: Set<string>,
  log: JsonExtractionStrategyLog
): void {
  log.attempted = true;
  const re =
    /<script[^>]*\bid=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i;
  const m = re.exec(html);
  if (!m?.[1]) {
    log.parseOk = false;
    log.parseError = "no_script_tag";
    return;
  }
  const res = safeJsonParse(m[1]);
  if (!res.ok) {
    log.parseOk = false;
    log.parseError = res.error;
    return;
  }
  log.parseOk = true;
  pushUniqueRoot(out, seen, res.value, log);
}

function tryWindowAssignments(
  html: string,
  out: unknown[],
  seen: Set<string>,
  log: JsonExtractionStrategyLog
): void {
  log.attempted = true;
  const patterns: RegExp[] = [
    /\bwindow\.__INITIAL_STATE__\s*=\s*\{/g,
    /\bwindow\.__NUXT__\s*=\s*\{/g,
    /\bwindow\.__PRELOADED_STATE__\s*=\s*\{/g,
    /\b__APP_STATE__\s*=\s*\{/g,
    /\b__NEXT_DATA__\s*=\s*\{/g,
  ];
  let anyOk = false;
  for (const re of patterns) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      const start = m.index + m[0].length - 1;
      const slice = extractBalancedJson(html, start);
      if (!slice || slice.length < 80) continue;
      if (scoreJsonRelevance(slice) < 3) continue;
      const res = safeJsonParse(slice);
      if (!res.ok) {
        log.parseError = res.error;
        continue;
      }
      anyOk = true;
      pushUniqueRoot(out, seen, res.value, log);
    }
  }
  log.parseOk = anyOk || log.rootsAdded > 0;
}

function tryJsonParseCalls(
  html: string,
  out: unknown[],
  seen: Set<string>,
  log: JsonExtractionStrategyLog
): void {
  log.attempted = true;
  let anyOk = false;
  let pos = 0;
  const needle = "JSON.parse(";
  while ((pos = html.indexOf(needle, pos)) !== -1) {
    let i = pos + needle.length;
    while (i < html.length && /\s/.test(html[i]!)) i++;
    const c = html[i];
    if (c !== "{" && c !== "[") {
      pos += needle.length;
      continue;
    }
    const slice = extractBalancedJson(html, i);
    if (!slice || slice.length < 80) {
      pos += needle.length;
      continue;
    }
    if (scoreJsonRelevance(slice) < 3) {
      pos += needle.length;
      continue;
    }
    const res = safeJsonParse(slice);
    if (!res.ok) {
      log.parseError = res.error;
      pos += needle.length;
      continue;
    }
    anyOk = true;
    pushUniqueRoot(out, seen, res.value, log);
    pos += needle.length;
  }
  log.parseOk = anyOk || log.rootsAdded > 0;
}

function tryScriptBlocks(
  html: string,
  out: unknown[],
  seen: Set<string>,
  log: JsonExtractionStrategyLog
): void {
  log.attempted = true;
  let anyOk = false;
  const scriptRe = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  let blockIndex = 0;
  while ((m = scriptRe.exec(html)) !== null) {
    blockIndex++;
    const body = m[1];
    if (body.length < 80) continue;
    const rel = scoreJsonRelevance(body);
    if (rel < 2 && !/matchInfo|seriesMatches|matchList|team1/i.test(body)) {
      continue;
    }
    let tries = 0;
    for (let i = 0; i < body.length && tries < 60; i++) {
      const c = body[i];
      if (c !== "{" && c !== "[") continue;
      tries++;
      const slice = extractBalancedJson(body, i);
      if (!slice || slice.length < 80) continue;
      if (scoreJsonRelevance(slice) < 4) continue;
      const res = safeJsonParse(slice);
      if (!res.ok) {
        log.parseError = res.error;
        continue;
      }
      anyOk = true;
      pushUniqueRoot(out, seen, res.value, log);
    }
  }
  log.parseOk = anyOk || log.rootsAdded > 0;
}

function tryLdJson(html: string, out: unknown[], seen: Set<string>, log: JsonExtractionStrategyLog): void {
  log.attempted = true;
  let anyOk = false;
  const ldRe =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = ldRe.exec(html)) !== null) {
    const res = safeJsonParse(m[1]);
    if (!res.ok) {
      log.parseError = res.error;
      continue;
    }
    anyOk = true;
    pushUniqueRoot(out, seen, res.value, log);
  }
  log.parseOk = anyOk || log.rootsAdded > 0;
}

/** Walk HTML for embedded matchInfo objects (Cricbuzz mobile / hydration fragments). */
function tryMatchInfoAnchors(
  html: string,
  out: unknown[],
  seen: Set<string>,
  log: JsonExtractionStrategyLog
): void {
  log.attempted = true;
  let anyOk = false;
  const needle = '"matchInfo"';
  let pos = 0;
  while ((pos = html.indexOf(needle, pos)) !== -1) {
    let start = pos;
    while (start > 0 && html[start] !== "{") start--;
    if (html[start] !== "{") {
      pos += needle.length;
      continue;
    }
    const slice = extractBalancedJson(html, start);
    if (!slice || slice.length < 60) {
      pos += needle.length;
      continue;
    }
    const res = safeJsonParse(slice);
    if (!res.ok) {
      log.parseError = res.error;
      pos += needle.length;
      continue;
    }
    anyOk = true;
    pushUniqueRoot(out, seen, res.value, log);
    pos += needle.length;
  }
  log.parseOk = anyOk || log.rootsAdded > 0;
}

function runStrategy(
  name: string,
  fn: (html: string, out: unknown[], seen: Set<string>, log: JsonExtractionStrategyLog) => void,
  html: string,
  out: unknown[],
  seen: Set<string>,
  trace: JsonExtractionStrategyLog[]
): void {
  const log: JsonExtractionStrategyLog = {
    name,
    attempted: false,
    parseOk: false,
    rootsAdded: 0,
  };
  const before = out.length;
  fn(html, out, seen, log);
  if (out.length > before && !log.keySample?.length) {
    log.keySample = summarizeJsonKeys(out[out.length - 1]);
  }
  trace.push(log);
}

export function extractEmbeddedJsonWithTrace(html: string): {
  roots: unknown[];
  trace: JsonExtractionStrategyLog[];
} {
  const out: unknown[] = [];
  const seen = new Set<string>();
  const trace: JsonExtractionStrategyLog[] = [];

  runStrategy("next_data_script", tryNextDataScript, html, out, seen, trace);
  runStrategy("window_assignments", tryWindowAssignments, html, out, seen, trace);
  runStrategy("json_parse_calls", tryJsonParseCalls, html, out, seen, trace);
  runStrategy("script_blocks", tryScriptBlocks, html, out, seen, trace);
  runStrategy("ld_json", tryLdJson, html, out, seen, trace);
  runStrategy("matchinfo_anchors", tryMatchInfoAnchors, html, out, seen, trace);

  if (process.env.NODE_ENV === "development") {
    devLog("extraction trace", trace);
    devLog("total extracted JSON roots", out.length);
  }
  return { roots: out, trace };
}

/** @deprecated path — use extractEmbeddedJsonWithTrace when diagnostics needed */
export function extractEmbeddedJsonFromHtml(html: string): unknown[] {
  return extractEmbeddedJsonWithTrace(html).roots;
}
