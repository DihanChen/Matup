"use client";

import Link from "next/link";
import type { LeagueDetailContentProps } from "@/features/leagues/components/detail/types";

type Props = {
  data: LeagueDetailContentProps;
};

export default function SidebarActionsCard({ data }: Props) {
  const {
    league,
    hasLeagueActions,
    showRecordResultsAction,
    showGenerateSchedule,
    canGenerateSchedule,
    generateScheduleMessage,
    generating,
    isRunningLeague,
    showManageTeamsAction,
    showEmailMembersAction,
    hasSecondaryLeagueActionPair,
    showDeleteLeagueAction,
    onHandleGenerateSchedule,
    onOpenAssignedTeamsModal,
    onOpenEmailModal,
    onOpenDeleteLeague,
  } = data;

  if (!hasLeagueActions) return null;

  return (
    <div className="bg-white rounded-3xl border border-zinc-200 p-5">
      <h2 className="text-sm font-semibold text-zinc-900 mb-3">League Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {showRecordResultsAction && (
          <Link
            href={`/leagues/${league.id}/record`}
            className="sm:col-span-2 inline-flex items-center justify-center px-3 py-2.5 bg-orange-500 text-white rounded-full text-sm font-medium hover:bg-orange-600 transition-colors"
          >
            Record Results
          </Link>
        )}

        {showGenerateSchedule && (
          <div className="sm:col-span-2">
            <button
              onClick={onHandleGenerateSchedule}
              disabled={generating || !canGenerateSchedule}
              className="w-full inline-flex items-center justify-center px-3 py-2.5 border border-orange-500 text-orange-500 rounded-full text-sm font-medium hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating
                ? "Generating..."
                : isRunningLeague
                ? "Generate Sessions"
                : "Generate Schedule"}
            </button>
            {generateScheduleMessage && (
              <p className="mt-1.5 text-xs text-amber-600 text-center">
                {generateScheduleMessage}
              </p>
            )}
          </div>
        )}

        {showManageTeamsAction && (
          <button
            onClick={onOpenAssignedTeamsModal}
            className={`${
              hasSecondaryLeagueActionPair ? "" : "sm:col-span-2"
            } inline-flex items-center justify-center px-3 py-2 border border-zinc-200 text-zinc-700 rounded-full text-sm font-medium hover:bg-zinc-50 transition-colors`}
          >
            Manage Teams
          </button>
        )}

        {showEmailMembersAction && (
          <button
            onClick={onOpenEmailModal}
            className={`${
              hasSecondaryLeagueActionPair ? "" : "sm:col-span-2"
            } inline-flex items-center justify-center px-3 py-2 border border-zinc-200 text-zinc-700 rounded-full text-sm font-medium hover:bg-zinc-50 transition-colors`}
          >
            Email Members
          </button>
        )}

        {showDeleteLeagueAction && (
          <button
            onClick={onOpenDeleteLeague}
            className="sm:col-span-2 inline-flex items-center justify-center px-3 py-2 border border-red-300 text-red-500 rounded-full text-sm font-medium hover:bg-red-50 transition-colors"
          >
            Delete League
          </button>
        )}
      </div>
    </div>
  );
}
