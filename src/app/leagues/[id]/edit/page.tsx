import { use } from "react";
import LeagueCreatePageClient from "@/features/leagues/components/LeagueCreatePageClient";

type Props = {
  params: Promise<{ id: string }>;
};

export default function LeagueEditPage({ params }: Props) {
  const { id } = use(params);
  return <LeagueCreatePageClient mode="edit" leagueId={id} />;
}
