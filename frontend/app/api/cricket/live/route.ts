import { NextResponse } from "next/server";
import { getLiveMatchesFresh } from "@/lib/api/cricapi";
import { cachedAggregatedFetch } from "@/lib/cache/redisEdgeCache";
import { reportApiRouteFailure } from "@/lib/monitoring/logger";

export async function GET() {
  try {
    const { result, cache } = await cachedAggregatedFetch({
      cacheKey: "cricscore:live:v2",
      ttlMs: 12_000,
      staleServeMs: 120_000,
      exSeconds: 200,
      fetcher: getLiveMatchesFresh,
    });
    if (!result.ok) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[api/cricket/live] upstream:", result.error);
      }
      return NextResponse.json(
        { ok: false, error: result.error, data: [] },
        { status: 503, headers: { "x-cricscore-cache": cache } }
      );
    }
    return NextResponse.json(result, {
      status: 200,
      headers: { "x-cricscore-cache": cache },
    });
  } catch (e) {
    reportApiRouteFailure("/api/cricket/live", e);
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[api/cricket/live] unhandled:",
        e instanceof Error ? e.message : String(e)
      );
    }
    return NextResponse.json(
      { ok: false, error: "Live feed unavailable", data: [] },
      { status: 503 }
    );
  }
}
