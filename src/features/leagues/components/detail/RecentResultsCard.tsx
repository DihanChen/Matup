"use client";

import StatusBadge from "@/components/leagues/StatusBadge";
import type { LeagueDetailContentProps } from "@/features/leagues/components/detail/types";

type Props = {
  data: LeagueDetailContentProps;
};

export default function RecentResultsCard({ data }: Props) {
  const {
    isParticipantView,
    hasRecentResults,
    recentResultsSpanClass,
    displayedRecentResults,
    renderMatchResult,
  } = data;

  if (!hasRecentResults) return null;

  return (
    <div
      className={`${
        isParticipantView ? "order-4" : ""
      } ${recentResultsSpanClass} bg-white rounded-2xl border border-zinc-200 overflow-hidden`}
    >
      <div className="p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-zinc-900">
            {isParticipantView ? "Your Recent Results" : "Recent Results"}
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            {isParticipantView
              ? "Your latest completed matches and outcomes."
              : "Most recent completed matches across the league."}
          </p>
        </div>
        <div className="space-y-3">
          {displayedRecentResults.map((match) => (
            <div
              key={match.id}
              className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-4"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500/60 via-amber-400/50 to-transparent" />
              <div className="flex items-start justify-between gap-3 mb-3 pt-1">
                <div>
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 text-[11px] font-semibold uppercase tracking-wide mb-1.5">
                    Final
                  </div>
                  <div className="text-sm font-semibold text-zinc-900">
                    {match.week_number ? `Week ${match.week_number}` : "Match"}
                  </div>
                  {match.match_date && (
                    <div className="text-xs text-zinc-500 mt-0.5">
                      {new Date(match.match_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                  )}
                </div>
                <StatusBadge status="completed" label="Completed" />
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5">
                {renderMatchResult(match)}
              </div>
              {match.notes && (
                <p className="text-xs text-zinc-500 mt-2.5">
                  {match.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
