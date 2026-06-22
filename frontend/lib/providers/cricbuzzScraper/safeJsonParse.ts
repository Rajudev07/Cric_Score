export type SafeJsonParseResult =
  | { ok: true; value: unknown }
  | { ok: false; error: string };

/** Parse JSON without throwing; always returns a result object. */
export function safeJsonParse(text: string): SafeJsonParseResult {
  const t = text.trim();
  if (!t) return { ok: false, error: "empty_input" };
  try {
    return { ok: true, value: JSON.parse(t) as unknown };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export function summarizeJsonKeys(value: unknown, maxKeys = 40): string[] {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) {
    if (!value.length) return ["[]"];
    const first = value[0];
    if (first && typeof first === "object" && !Array.isArray(first)) {
      return [`[array len=${value.length}]`, ...Object.keys(first as object).slice(0, maxKeys)];
    }
    return [`[array len=${value.length}]`];
  }
  if (typeof value === "object") {
    return Object.keys(value as object).slice(0, maxKeys);
  }
  return [typeof value];
}
