"use client";

import type { LeagueDetailContentProps } from "@/features/leagues/components/detail/types";

type Props = {
  data: LeagueDetailContentProps;
};

export default function SidebarAssignedTeamsCard({ data }: Props) {
  const {
    isAssignedDoubles,
    isOwnerOrAdmin,
    assignedTeams,
    unpairedAssignedMemberIds,
    getMemberNameById,
    onOpenAssignedTeamsModal,
  } = data;

  if (!isAssignedDoubles) return null;

  return (
    <div className="bg-white rounded-3xl border border-zinc-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-zinc-500">Assigned Teams</h2>
        {isOwnerOrAdmin && (
          <button
            type="button"
            onClick={onOpenAssignedTeamsModal}
            className="text-xs font-medium text-orange-500 hover:underline"
          >
            Edit
          </button>
        )}
      </div>

      {assignedTeams.length === 0 ? (
        <p className="text-sm text-zinc-500">No fixed teams saved yet.</p>
      ) : (
        <div className="space-y-2">
          {assignedTeams.map((team, index) => (
            <div
              key={`${team.playerAId}-${team.playerBId}-${index}`}
              className="p-2.5 rounded-xl bg-zinc-50 text-sm text-zinc-700"
            >
              <span className="font-medium">{team.playerAName || getMemberNameById(team.playerAId)}</span>
              <span className="mx-1.5 text-zinc-400">&</span>
              <span className="font-medium">{team.playerBName || getMemberNameById(team.playerBId)}</span>
            </div>
          ))}
        </div>
      )}

      {unpairedAssignedMemberIds.length > 0 && (
        <div className="mt-3 text-xs text-zinc-500 break-words">
          Unpaired: {unpairedAssignedMemberIds.map((memberId) => getMemberNameById(memberId)).join(", ")}
        </div>
      )}

      {assignedTeams.length < 2 && (
        <p className="mt-3 text-xs text-amber-600">
          Add at least 2 teams before generating the schedule.
        </p>
      )}
    </div>
  );
}
