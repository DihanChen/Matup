"use client";

import StatusBadge from "@/components/leagues/StatusBadge";
import type { LeagueDetailContentProps } from "@/features/leagues/components/detail/types";

type Props = {
  data: LeagueDetailContentProps;
};

export default function PendingReviewsCard({ data }: Props) {
  const {
    hasPendingResultReviews,
    hasUpcomingMatches,
    isParticipantView,
    displayedPendingReviewMatches,
    reviewingSubmissionId,
    onHandleReviewSubmission,
    onOpenRejectSubmissionModal,
  } = data;

  if (!hasPendingResultReviews) return null;

  return (
    <div
      className={`${
        hasUpcomingMatches ? "md:col-span-4" : "md:col-span-12"
      } ${
        isParticipantView ? "order-3" : ""
      } bg-white rounded-2xl border border-zinc-200 p-4 sm:p-6`}
    >
      <div className="flex items-center justify-between mb-4 gap-2">
        <h2 className="text-lg font-semibold text-zinc-900">
          {isParticipantView ? "Awaiting Your Confirmation" : "Pending Result Reviews"}
        </h2>
        <span className="text-xs font-medium text-zinc-500">
          {displayedPendingReviewMatches.length} pending
        </span>
      </div>
      <div className="space-y-3">
        {displayedPendingReviewMatches.map((match) => {
          const teamA = match.participants.filter((p) => p.team === "A");
          const teamB = match.participants.filter((p) => p.team === "B");
          const sideANames = teamA.map((p) => p.name || "?").join(" & ");
          const sideBNames = teamB.map((p) => p.name || "?").join(" & ");
          const isReviewing = reviewingSubmissionId === match.latest_submission?.id;

          return (
            <div key={match.id} className="p-4 bg-zinc-50 rounded-xl">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-zinc-900">
                  {match.week_number ? `Week ${match.week_number}` : "Match"}
                </span>
                <StatusBadge status="awaiting_confirmation" label="Awaiting Confirmation" />
              </div>
              {teamA.length > 0 && teamB.length > 0 && (
                <div className="text-sm text-zinc-500 break-words">{sideANames} vs {sideBNames}</div>
              )}
              {match.match_date && (
                <div className="text-xs text-zinc-400 mt-1">
                  {new Date(match.match_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              )}
              {match.latest_submission?.payload && (
                <div className="mt-2 p-2.5 bg-white rounded-lg border border-zinc-100">
                  <div className="text-xs text-zinc-500 mb-1">Submitted result:</div>
                  <div className="text-sm font-medium">
                    Winner:{" "}
                    <span className="text-orange-500">
                      {match.latest_submission.payload.winner === "A" ? sideANames : sideBNames}
                    </span>
                  </div>
                  {match.latest_submission.payload.sets && (
                    <div className="text-xs text-zinc-500 mt-0.5">
                      {match.latest_submission.payload.sets
                        .map((set: number[]) => `${set[0]}-${set[1]}`)
                        .join(", ")}
                    </div>
                  )}
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onHandleReviewSubmission(match, "confirm")}
                  disabled={isReviewing}
                  className="px-3 py-1.5 bg-green-600 text-white rounded-full text-xs font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isReviewing ? "Processing..." : "Confirm"}
                </button>
                <button
                  type="button"
                  onClick={() => onOpenRejectSubmissionModal(match)}
                  disabled={isReviewing}
                  className="px-3 py-1.5 border border-red-300 text-red-600 rounded-full text-xs font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
