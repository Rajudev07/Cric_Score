import { NextResponse } from "next/server";
import { getMatchByIdFresh } from "@/lib/api/cricapi";
import { cachedAggregatedFetch } from "@/lib/cache/redisEdgeCache";
import { reportApiRouteFailure } from "@/lib/monitoring/logger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id: rawId } = await params;
    const id = decodeURIComponent(rawId);
    const { result, cache } = await cachedAggregatedFetch({
      cacheKey: `cricscore:match:${rawId}:v1`,
      ttlMs: 18_000,
      staleServeMs: 180_000,
      exSeconds: 240,
      fetcher: () => getMatchByIdFresh(id),
    });
    if (!result.ok) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[api/cricket/match] upstream:", result.error, "id=", id);
      }
      return NextResponse.json(
        { ok: false, error: result.error, data: null },
        { status: 503, headers: { "x-cricscore-cache": cache } }
      );
    }
    if (!result.data) {
      return NextResponse.json(
        { ok: true, data: null },
        { status: 200, headers: { "x-cricscore-cache": cache } }
      );
    }
    return NextResponse.json(result, {
      status: 200,
      headers: { "x-cricscore-cache": cache },
    });
  } catch (e) {
    reportApiRouteFailure("/api/cricket/match/[id]", e);
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[api/cricket/match] unhandled:",
        e instanceof Error ? e.message : String(e)
      );
    }
    return NextResponse.json(
      { ok: false, error: "Match unavailable", data: null },
      { status: 503 }
    );
  }
}
