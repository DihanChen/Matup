"use client";

import StatusBadge from "@/components/leagues/StatusBadge";
import { FORMAT_LABELS, ROTATION_LABELS } from "@/lib/league-types";
import type { LeagueDetailContentProps } from "@/features/leagues/components/detail/types";

type Props = {
  data: LeagueDetailContentProps;
};

export default function HeaderCard({ data }: Props) {
  const {
    league,
    isRacketLeague,
    isDoubles,
    sportDisplayName,
    completedMatches,
    members,
    ownerCanToggleToParticipantView,
    ownerViewMode,
    onOwnerViewModeChange,
  } = data;

  return (
    <div className="md:col-span-12 bg-white rounded-3xl border border-zinc-200 overflow-hidden">
      <div className="relative h-52 sm:h-64 bg-gradient-to-br from-orange-300 via-orange-500 to-amber-500">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.45),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.32),transparent_38%)]" />
        <div className="absolute -right-10 -bottom-12 w-48 h-48 rounded-full bg-zinc-900/15 blur-2xl" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {isRacketLeague ? (
            <>
              <span className="inline-flex items-center px-3 py-1 bg-white/85 text-zinc-900 rounded-full text-xs font-semibold">
                {sportDisplayName} League
              </span>
              <span className="inline-flex items-center px-3 py-1 bg-zinc-900/70 text-white rounded-full text-xs font-medium">
                {FORMAT_LABELS[league.scoring_format]}
              </span>
            </>
          ) : (
            <>
              <span className="inline-flex items-center px-3 py-1 bg-white/85 text-zinc-900 rounded-full text-xs font-semibold capitalize">
                {league.sport_type}
              </span>
              <span className="inline-flex items-center px-3 py-1 bg-zinc-900/70 text-white rounded-full text-xs font-medium">
                {FORMAT_LABELS[league.scoring_format]}
              </span>
            </>
          )}
          {isDoubles && league.rotation_type && (
            <span className="inline-flex items-center px-3 py-1 bg-white/35 text-white rounded-full text-xs font-medium">
              {ROTATION_LABELS[league.rotation_type]}
            </span>
          )}
        </div>
        <div className="absolute right-4 bottom-4">
          <StatusBadge status={league.status} />
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 mb-2 break-words">{league.name}</h1>
        <p className="text-sm text-zinc-600 leading-relaxed">
          {league.description || "Competitive season play with structured matches, standings, and weekly momentum."}
        </p>
        {ownerCanToggleToParticipantView && (
          <div className="mt-4">
            <div className="inline-flex max-w-full flex-wrap items-center rounded-full border border-zinc-200 bg-zinc-50 p-1">
              <button
                type="button"
                onClick={() => onOwnerViewModeChange("owner")}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  ownerViewMode === "owner"
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Owner View
              </button>
              <button
                type="button"
                onClick={() => onOwnerViewModeChange("participant")}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  ownerViewMode === "participant"
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Participant View
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="rounded-2xl bg-zinc-50 border border-zinc-100 px-3 py-2">
            <div className="text-[11px] uppercase tracking-wide text-zinc-500 font-medium">Members</div>
            <div className="text-sm font-semibold text-zinc-900">{members.length}/{league.max_members}</div>
          </div>
          <div className="rounded-2xl bg-zinc-50 border border-zinc-100 px-3 py-2">
            <div className="text-[11px] uppercase tracking-wide text-zinc-500 font-medium">Format</div>
            <div className="text-sm font-semibold text-zinc-900 break-words">{FORMAT_LABELS[league.scoring_format]}</div>
          </div>
          <div className="rounded-2xl bg-zinc-50 border border-zinc-100 px-3 py-2">
            <div className="text-[11px] uppercase tracking-wide text-zinc-500 font-medium">Season</div>
            <div className="text-sm font-semibold text-zinc-900">{league.season_weeks ? `${league.season_weeks} weeks` : "Open"}</div>
          </div>
          <div className="rounded-2xl bg-zinc-50 border border-zinc-100 px-3 py-2">
            <div className="text-[11px] uppercase tracking-wide text-zinc-500 font-medium">Recorded</div>
            <div className="text-sm font-semibold text-zinc-900">{completedMatches.length} results</div>
          </div>
        </div>
      </div>
    </div>
  );
}
