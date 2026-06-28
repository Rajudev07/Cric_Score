import { NextResponse } from "next/server";
import { getCricketDataQuotaSnapshot } from "@/lib/providers/cricketData/cache";
import { isOpsDashboardEnabled } from "@/lib/ops/runtimeDiagnostics";

export async function GET() {
  if (!isOpsDashboardEnabled()) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, ...getCricketDataQuotaSnapshot() });
}
