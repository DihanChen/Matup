import { Suspense } from "react";
import CourtCreatePageClient from "@/features/courts/components/CourtCreatePageClient";

export default function CourtCreatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <CourtCreatePageClient />
    </Suspense>
  );
}
