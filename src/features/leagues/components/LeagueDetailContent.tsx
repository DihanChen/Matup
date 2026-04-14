"use client";

import LeaguePublicPreview from "@/features/leagues/components/detail/LeaguePublicPreview";
import OwnerLeagueDashboard from "@/features/leagues/components/detail/OwnerLeagueDashboard";
import ParticipantLeagueDashboard from "@/features/leagues/components/detail/ParticipantLeagueDashboard";
import type { LeagueDetailContentProps } from "@/features/leagues/components/detail/types";

export type { LeagueDetailContentProps } from "@/features/leagues/components/detail/types";

export default function LeagueDetailContent(props: LeagueDetailContentProps) {
  // Owner viewing as owner → Owner Dashboard
  const showOwnerDashboard =
    props.currentMemberRole === "owner" && !props.isParticipantView;

  if (showOwnerDashboard) {
    return <OwnerLeagueDashboard data={props} />;
  }

  // Member (or owner toggling to participant view) → Participant Dashboard
  if (props.isMember) {
    return <ParticipantLeagueDashboard data={props} />;
  }

  // Non-member / unauthenticated → Public Preview
  return <LeaguePublicPreview data={props} />;
}
