"use client";

import type { LeagueDetailContentProps } from "@/features/leagues/components/detail/types";
import SidebarActionsCard from "@/features/leagues/components/detail/SidebarActionsCard";
import SidebarAssignedTeamsCard from "@/features/leagues/components/detail/SidebarAssignedTeamsCard";
import SidebarHostCard from "@/features/leagues/components/detail/SidebarHostCard";
import SidebarInfoCard from "@/features/leagues/components/detail/SidebarInfoCard";
import SidebarInviteConsoleCard from "@/features/leagues/components/detail/SidebarInviteConsoleCard";
import SidebarMembersDirectoryCard from "@/features/leagues/components/detail/SidebarMembersDirectoryCard";
import SidebarNotesCard from "@/features/leagues/components/detail/SidebarNotesCard";
import SidebarPlayersCard from "@/features/leagues/components/detail/SidebarPlayersCard";

type Props = {
  data: LeagueDetailContentProps;
};

export default function LeagueDetailSidebar({ data }: Props) {
  return (
    <div className="xl:col-span-4 flex flex-col gap-5 xl:sticky xl:top-6 h-fit">
      <SidebarPlayersCard data={data} />
      <SidebarActionsCard data={data} />
      <SidebarHostCard data={data} />
      <SidebarMembersDirectoryCard data={data} />
      <SidebarInviteConsoleCard data={data} />
      <SidebarAssignedTeamsCard data={data} />
      <SidebarNotesCard data={data} />
      <SidebarInfoCard data={data} />
    </div>
  );
}
