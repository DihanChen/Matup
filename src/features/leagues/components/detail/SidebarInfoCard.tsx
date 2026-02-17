"use client";

import { FORMAT_LABELS, ROTATION_LABELS } from "@/lib/league-types";
import type { LeagueDetailContentProps } from "@/features/leagues/components/detail/types";

type Props = {
  data: LeagueDetailContentProps;
};

export default function SidebarInfoCard({ data }: Props) {
  const { league, isDoubles } = data;

  return (
    <div className="bg-white rounded-3xl border border-zinc-200 p-6">
      <h2 className="text-sm font-medium text-zinc-500 mb-4">League Info</h2>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between gap-3">
          <span className="text-zinc-500">Match Type</span>
          <span className="font-medium text-zinc-900 text-right break-words">{FORMAT_LABELS[league.scoring_format]}</span>
        </div>
        {isDoubles && league.rotation_type && (
          <div className="flex justify-between gap-3">
            <span className="text-zinc-500">Rotation</span>
            <span className="font-medium text-zinc-900 text-right break-words">{ROTATION_LABELS[league.rotation_type]}</span>
          </div>
        )}
        <div className="flex justify-between gap-3">
          <span className="text-zinc-500">Type</span>
          <span className="font-medium text-zinc-900 capitalize text-right break-words">{league.league_type}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-zinc-500">Max Members</span>
          <span className="font-medium text-zinc-900">{league.max_members}</span>
        </div>
        {league.start_date && (
          <div className="flex justify-between gap-3">
            <span className="text-zinc-500">Start Date</span>
            <span className="font-medium text-zinc-900 text-right">{new Date(league.start_date).toLocaleDateString()}</span>
          </div>
        )}
        {league.season_weeks && (
          <div className="flex justify-between gap-3">
            <span className="text-zinc-500">Season Length</span>
            <span className="font-medium text-zinc-900 text-right">{league.season_weeks} weeks</span>
          </div>
        )}
        <div className="flex justify-between gap-3">
          <span className="text-zinc-500">Status</span>
          <span className="font-medium text-zinc-900 capitalize text-right">{league.status}</span>
        </div>
      </div>
    </div>
  );
}
