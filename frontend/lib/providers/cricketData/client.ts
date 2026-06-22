const CRICAPI_BASE = "https://api.cricapi.com/v1";
export const CRICKETDATA_PROVIDER_ID = "cricketdata";

export type FetchMode = "static" | "live";

export type CricketDataResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const REVALIDATE_SECONDS = 30;

function getApiKey(): string | undefined {
  const key = process.env.CRIC_API_KEY;
  return key?.trim() || undefined;
}

export async function fetchCricketDataJson(
  path: string,
  searchParams: Record<string, string> = {},
  mode: FetchMode = "static"
): Promise<CricketDataResult<unknown>> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return {
      ok: false,
      error: "Server misconfiguration: CRIC_API_KEY is not set.",
    };
  }

  const url = new URL(`${CRICAPI_BASE}/${path}`);
  url.searchParams.set("apikey", apiKey);
  Object.entries(searchParams).forEach(([k, v]) => {
    if (v !== undefined && v !== "") url.searchParams.set(k, v);
  });

  const fetchInit: RequestInit =
    mode === "live"
      ? { cache: "no-store", headers: { Accept: "application/json" } }
      : {
          headers: { Accept: "application/json" },
          next: { revalidate: REVALIDATE_SECONDS },
        };

  try {
    const res = await fetch(url.toString(), fetchInit);

    if (res.status === 429) {
      return {
        ok: false,
        error:
          "Cricket API rate limit reached. Please try again in a few minutes.",
      };
    }

    if (res.status >= 500) {
      return { ok: false, error: "Cricket API is temporarily unavailable." };
    }

    const json: unknown = await res.json();

    if (!res.ok) {
      const reason =
        typeof json === "object" &&
        json !== null &&
        "reason" in json &&
        typeof (json as { reason?: unknown }).reason === "string"
          ? (json as { reason: string }).reason
          : `Request failed (${res.status})`;
      return { ok: false, error: reason };
    }

    if (
      typeof json === "object" &&
      json !== null &&
      "status" in json &&
      (json as { status?: unknown }).status === "failure"
    ) {
      const body = json as Record<string, unknown>;
      const reason =
        typeof body.reason === "string" ? body.reason : "API returned failure.";
      return { ok: false, error: reason };
    }

    return { ok: true, data: json };
  } catch {
    return {
      ok: false,
      error: "Network error while contacting Cricket API.",
    };
  }
}
