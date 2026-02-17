"use client";

import type { LeagueDetailContentProps } from "@/features/leagues/components/detail/types";

type Props = {
  data: LeagueDetailContentProps;
};

export default function SidebarNotesCard({ data }: Props) {
  const {
    isRacketLeague,
    isPickleballLeague,
    isRunningLeague,
    isOwnerOrAdmin,
  } = data;

  return (
    <div className="bg-zinc-50 rounded-3xl border border-zinc-200 p-6">
      <h2 className="text-sm font-semibold text-zinc-900 mb-3">League Notes</h2>
      <ul className="space-y-2 text-sm text-zinc-600">
        <li className="flex items-start gap-2">
          <span className="mt-1 inline-block w-1.5 h-1.5 rounded-full bg-orange-500" />
          <span>
            {isRacketLeague
              ? isPickleballLeague
                ? "Submit game scores after each match so pickleball standings stay current."
                : "Submit set scores after each match so standings stay current."
              : isRunningLeague
              ? "Log each run promptly to keep weekly rankings accurate."
              : "Record outcomes right after play to keep momentum visible."}
          </span>
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-1 inline-block w-1.5 h-1.5 rounded-full bg-orange-500" />
          <span>
            {isOwnerOrAdmin
              ? "Use League Actions to generate schedule updates and moderation workflows."
              : "Watch Upcoming Matches for your fixtures and confirm opponent submissions quickly."}
          </span>
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-1 inline-block w-1.5 h-1.5 rounded-full bg-orange-500" />
          <span>
            Invite consistency keeps competition fair: keep teams active and resolve disputes quickly.
          </span>
        </li>
      </ul>
    </div>
  );
}
