import { NextResponse } from "next/server";
import { getUpcomingMatches } from "@/lib/api/cricapi";
import { reportApiRouteFailure } from "@/lib/monitoring/logger";

export async function GET() {
  try {
    const result = await getUpcomingMatches();
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error, data: [] },
        { status: 503 }
      );
    }
    return NextResponse.json(result, { status: 200 });
  } catch (e) {
    reportApiRouteFailure("/api/cricket/upcoming", e);
    return NextResponse.json(
      { ok: false, error: "Upcoming feed unavailable", data: [] },
      { status: 503 }
    );
  }
}
