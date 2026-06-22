import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DiagnosticsPanel from "@/components/ops/DiagnosticsPanel";
import { collectOpsDiagnostics, isOpsDashboardEnabled } from "@/lib/ops/runtimeDiagnostics";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ops · CricScore",
  robots: { index: false, follow: false },
};

export default async function OpsPage() {
  if (!isOpsDashboardEnabled()) {
    notFound();
  }
  const initial = await collectOpsDiagnostics();
  return (
    <div className="min-h-screen bg-black px-4 py-8 sm:px-6">
      <DiagnosticsPanel initial={initial} />
    </div>
  );
}
