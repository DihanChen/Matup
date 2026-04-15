import { Suspense } from "react";
import LeagueCreatePageClient from "@/features/leagues/components/LeagueCreatePageClient";

export default function LeagueCreatePage() {
  return (
    <Suspense>
      <LeagueCreatePageClient />
    </Suspense>
  );
}
