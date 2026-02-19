import { Suspense } from "react";
import CourtDetailPageClient from "@/features/courts/components/CourtDetailPageClient";

export default function CourtDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <CourtDetailPageClient />
    </Suspense>
  );
}
