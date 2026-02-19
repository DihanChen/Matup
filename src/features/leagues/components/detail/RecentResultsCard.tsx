"use client";

import StatusBadge from "@/components/leagues/StatusBadge";
import type { LeagueDetailContentProps } from "@/features/leagues/components/detail/types";
import type { LeagueMatch } from "@/lib/league-types";

type Props = {
  data: LeagueDetailContentProps;
};

type ResultPill = {
  label: string;
  className: string;
};

type ScoreBreakdown = {
  sideAValues: string[];
  sideBValues: string[];
  label: "Sets" | "Score";
};

function getWinnerSide(match: LeagueMatch): "A" | "B" | null {
  if (match.winner === "A" || match.winner === "B") return match.winner;
  return null;
}

function getScoreBreakdown(match: LeagueMatch): ScoreBreakdown | null {
  const setScores = match.participants.find((participant) => participant.set_scores?.sets.length)?.set_scores?.sets;
  if (setScores && setScores.length > 0) {
    return {
      sideAValues: setScores.map((set) => String(set[0])),
      sideBValues: setScores.map((set) => String(set[1])),
      label: "Sets",
    };
  }

  const sideAScore = match.participants.find(
    (participant) => participant.team === "A" && participant.score !== null
  )?.score;
  const sideBScore = match.participants.find(
    (participant) => participant.team === "B" && participant.score !== null
  )?.score;
  if (sideAScore !== undefined && sideAScore !== null && sideBScore !== undefined && sideBScore !== null) {
    return {
      sideAValues: [String(sideAScore)],
      sideBValues: [String(sideBScore)],
      label: "Score",
    };
  }

  return null;
}

function getResultPill(
  match: LeagueMatch,
  currentUserId: string | null,
  isParticipantView: boolean
): ResultPill | null {
  const winner = getWinnerSide(match);
  if (!winner) return null;

  if (isParticipantView && currentUserId) {
    const currentParticipant = match.participants.find(
      (participant) =>
        participant.user_id === currentUserId &&
        (participant.team === "A" || participant.team === "B")
    );

    if (currentParticipant?.team) {
      const isWinner = currentParticipant.team === winner;
      return isWinner
        ? {
            label: "Win",
            className: "border border-emerald-200 bg-emerald-50 text-emerald-700",
          }
        : {
            label: "Lose",
            className: "border border-rose-200 bg-rose-50 text-rose-700",
          };
    }
  }

  return {
    label: winner === "A" ? "Winner: A" : "Winner: B",
    className: "border border-zinc-200 bg-zinc-100 text-zinc-700",
  };
}

export default function RecentResultsCard({ data }: Props) {
  const {
    isParticipantView,
    hasRecentResults,
    recentResultsSpanClass,
    displayedRecentResults,
    currentUserId,
    renderMatchResult,
  } = data;

  if (!hasRecentResults) return null;

  return (
    <div
      className={`${
        isParticipantView ? "order-4" : ""
      } ${recentResultsSpanClass} bg-white rounded-2xl border border-zinc-200 overflow-hidden`}
    >
      <div className="p-4 sm:p-6">
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
          {displayedRecentResults.map((match) => {
            const scoreBreakdown = getScoreBreakdown(match);
            const resultPill = getResultPill(match, currentUserId, isParticipantView);

            return (
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
                  <div className="flex items-stretch justify-between gap-3">
                    <div className="min-w-0 flex-1 rounded-lg border border-zinc-100 bg-zinc-50/70 px-3 py-2 flex items-center">
                      {renderMatchResult(match)}
                    </div>
                    {(scoreBreakdown || resultPill) && (
                      <div className="shrink-0 min-w-[118px] rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-2">
                        {scoreBreakdown && (
                          <>
                            <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                              {scoreBreakdown.label}
                            </div>
                            <div className="mt-1 space-y-1">
                              <div className="flex items-center justify-between gap-2 text-xs text-zinc-700">
                                <span className="font-medium">A</span>
                                <div className="flex items-center gap-1">
                                  {scoreBreakdown.sideAValues.map((value, index) => (
                                    <span
                                      key={`score-a-${index}`}
                                      className="inline-flex min-w-5 items-center justify-center rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[11px] font-semibold text-zinc-900"
                                    >
                                      {value}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="flex items-center justify-between gap-2 text-xs text-zinc-700">
                                <span className="font-medium">B</span>
                                <div className="flex items-center gap-1">
                                  {scoreBreakdown.sideBValues.map((value, index) => (
                                    <span
                                      key={`score-b-${index}`}
                                      className="inline-flex min-w-5 items-center justify-center rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[11px] font-semibold text-zinc-900"
                                    >
                                      {value}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                        {resultPill && (
                          <div
                            className={`mt-2 inline-flex w-full items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${resultPill.className}`}
                          >
                            {resultPill.label}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {match.notes && (
                  <p className="text-xs text-zinc-500 mt-2.5">
                    {match.notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
