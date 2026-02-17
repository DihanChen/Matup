"use client";

import { useMemo, useState } from "react";
import StatusBadge from "@/components/leagues/StatusBadge";
import type { LeagueDetailContentProps } from "@/features/leagues/components/detail/types";
import type { LeagueMatch } from "@/lib/league-types";

type Props = {
  data: LeagueDetailContentProps;
};

const OWNER_VISIBLE_MATCHES_STEP = 12;

function toStatusLabel(statusKey: string): string {
  return statusKey.replace(/_/g, " ");
}

function getStatusKey(match: LeagueMatch): string {
  if (match.source === "workflow" && match.workflow_status) {
    return match.workflow_status;
  }
  return "scheduled";
}

function getSideNames(match: LeagueMatch): { sideANames: string; sideBNames: string } {
  const teamA = match.participants.filter((participant) => participant.team === "A");
  const teamB = match.participants.filter((participant) => participant.team === "B");
  return {
    sideANames: teamA.map((participant) => participant.name || "?").join(" & "),
    sideBNames: teamB.map((participant) => participant.name || "?").join(" & "),
  };
}

function getSortableDateValue(matchDate: string | null): number {
  if (!matchDate) return Number.MAX_SAFE_INTEGER;
  const parsed = new Date(`${matchDate}T00:00:00`).getTime();
  return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
}

export default function UpcomingMatchesCard({ data }: Props) {
  const {
    isParticipantView,
    hasUpcomingMatches,
    upcomingMatchesSpanClass,
    displayedUpcomingMatches,
    currentUserId,
    isOwnerOrAdmin,
    reviewingSubmissionId,
    resolvingFixtureId,
    onSelectSubmitResult,
    onHandleReviewSubmission,
    onOpenRejectSubmissionModal,
    onOpenResolveDisputeModal,
  } = data;
  const [searchValue, setSearchValue] = useState("");
  const [weekFilter, setWeekFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [visibleScheduledCount, setVisibleScheduledCount] = useState(
    OWNER_VISIBLE_MATCHES_STEP
  );

  const isOwnerManagementView = isOwnerOrAdmin && !isParticipantView;
  const normalizedSearch = searchValue.trim().toLowerCase();

  const todayLocal = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const matchCards = useMemo(() => {
    return [...displayedUpcomingMatches]
      .sort((left, right) => getSortableDateValue(left.match_date) - getSortableDateValue(right.match_date))
      .map((match) => {
        const { sideANames, sideBNames } = getSideNames(match);
        const statusKey = getStatusKey(match);
        const statusLabel = toStatusLabel(statusKey);
        const isDisputed = statusKey === "disputed";
        const hasPendingSubmission = match.latest_submission?.status === "pending";
        const userIsParticipant =
          !!currentUserId &&
          match.participants.some((participant) => participant.user_id === currentUserId);
        const isWorkflow = match.source === "workflow";
        const parsedMatchDate = match.match_date
          ? new Date(`${match.match_date}T00:00:00`)
          : null;
        const isFutureMatch =
          parsedMatchDate !== null &&
          !Number.isNaN(parsedMatchDate.getTime()) &&
          parsedMatchDate.getTime() > todayLocal.getTime();
        const canSubmit =
          isWorkflow &&
          (isOwnerOrAdmin || (userIsParticipant && !isFutureMatch)) &&
          match.workflow_status === "scheduled";
        const isOpponentWithPendingSubmission =
          userIsParticipant &&
          hasPendingSubmission &&
          match.latest_submission?.submitted_by !== currentUserId;
        const isReviewing = reviewingSubmissionId === match.latest_submission?.id;
        const weekKey = match.week_number ? String(match.week_number) : "none";
        const searchBlob = `${sideANames} ${sideBNames} ${statusLabel} ${match.week_number ?? ""}`.toLowerCase();

        return {
          match,
          sideANames,
          sideBNames,
          statusKey,
          statusLabel,
          weekKey,
          isDisputed,
          hasPendingSubmission,
          canSubmit,
          isOpponentWithPendingSubmission,
          isReviewing,
          searchBlob,
        };
      });
  }, [currentUserId, displayedUpcomingMatches, isOwnerOrAdmin, reviewingSubmissionId, todayLocal]);

  const weekOptions = useMemo(() => {
    return [...new Set(matchCards.map((item) => item.weekKey))];
  }, [matchCards]);

  const statusOptions = useMemo(() => {
    return [...new Set(matchCards.map((item) => item.statusKey))];
  }, [matchCards]);

  const ownerFilteredMatches = useMemo(() => {
    return matchCards.filter((item) => {
      if (weekFilter !== "all" && item.weekKey !== weekFilter) return false;
      if (statusFilter !== "all" && item.statusKey !== statusFilter) return false;
      if (normalizedSearch && !item.searchBlob.includes(normalizedSearch)) return false;
      return true;
    });
  }, [matchCards, normalizedSearch, statusFilter, weekFilter]);

  const needsActionMatches = useMemo(() => {
    return ownerFilteredMatches.filter((item) => item.isDisputed || item.hasPendingSubmission);
  }, [ownerFilteredMatches]);

  const scheduledMatches = useMemo(() => {
    return ownerFilteredMatches.filter((item) => !item.isDisputed && !item.hasPendingSubmission);
  }, [ownerFilteredMatches]);

  const visibleScheduledMatches = useMemo(() => {
    return scheduledMatches.slice(0, visibleScheduledCount);
  }, [scheduledMatches, visibleScheduledCount]);

  function renderMatchCard(item: (typeof matchCards)[number]) {
    return (
      <div
        key={item.match.id}
        className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-4 shadow-sm"
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500/70 via-amber-400/70 to-zinc-300/70" />
        <div className="pt-1.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-zinc-900">
              {item.match.week_number ? `Week ${item.match.week_number}` : "Scheduled Match"}
            </span>
            <StatusBadge status={item.statusKey} label={item.statusLabel} />
          </div>
          {item.sideANames && item.sideBNames && (
            <div className="text-sm text-zinc-500">
              {item.sideANames} vs {item.sideBNames}
            </div>
          )}
          {item.match.match_date && (
            <span className="text-xs text-zinc-400">
              {new Date(item.match.match_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            {item.canSubmit && (
              <button
                type="button"
                onClick={() => onSelectSubmitResult(item.match)}
                className="inline-flex items-center justify-center px-4 py-2 bg-orange-500 text-white rounded-full text-sm font-semibold hover:bg-orange-600 transition-colors"
              >
                Submit Result
              </button>
            )}
            {item.isOpponentWithPendingSubmission && (
              <>
                <button
                  type="button"
                  onClick={() => onHandleReviewSubmission(item.match, "confirm")}
                  disabled={item.isReviewing}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-full text-xs font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {item.isReviewing ? "Processing..." : "Confirm"}
                </button>
                <button
                  type="button"
                  onClick={() => onOpenRejectSubmissionModal(item.match)}
                  disabled={item.isReviewing}
                  className="px-3 py-1.5 border border-red-300 text-red-600 rounded-full text-xs font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  Reject
                </button>
              </>
            )}
            {isOwnerOrAdmin && item.isDisputed && (
              <button
                type="button"
                onClick={() => onOpenResolveDisputeModal(item.match)}
                disabled={resolvingFixtureId === item.match.id}
                className="px-3 py-1.5 border border-red-300 text-red-600 rounded-full text-xs font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {resolvingFixtureId === item.match.id ? "Resolving..." : "Resolve Dispute"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!hasUpcomingMatches) return null;

  return (
    <div
      className={`${
        isParticipantView ? "order-1" : ""
      } ${upcomingMatchesSpanClass} bg-white rounded-2xl border border-zinc-200 p-6`}
    >
      <div className="flex items-center justify-between mb-4 gap-2">
        <h2 className="text-lg font-semibold text-zinc-900">
          {isParticipantView ? "Current & Next Matches" : "Upcoming Matches"}
        </h2>
        {!isParticipantView && (
          <span className="text-xs font-medium text-zinc-500">
            {displayedUpcomingMatches.length} total
          </span>
        )}
      </div>
      {isOwnerManagementView ? (
        <div className="space-y-5">
          <div className="grid gap-2 sm:grid-cols-3">
            <input
              type="text"
              value={searchValue}
              onChange={(event) => {
                setSearchValue(event.target.value);
                setVisibleScheduledCount(OWNER_VISIBLE_MATCHES_STEP);
              }}
              placeholder="Search by player or week"
              className="sm:col-span-3 px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-sm text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <select
              value={weekFilter}
              onChange={(event) => {
                setWeekFilter(event.target.value);
                setVisibleScheduledCount(OWNER_VISIBLE_MATCHES_STEP);
              }}
              className="px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-sm text-zinc-700 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">All Weeks</option>
              {weekOptions.map((weekKey) => (
                <option key={weekKey} value={weekKey}>
                  {weekKey === "none" ? "No Week" : `Week ${weekKey}`}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setVisibleScheduledCount(OWNER_VISIBLE_MATCHES_STEP);
              }}
              className="px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-sm text-zinc-700 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              {statusOptions.map((statusKey) => (
                <option key={statusKey} value={statusKey}>
                  {toStatusLabel(statusKey)}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                setSearchValue("");
                setWeekFilter("all");
                setStatusFilter("all");
                setVisibleScheduledCount(OWNER_VISIBLE_MATCHES_STEP);
              }}
              className="px-3 py-2 border border-zinc-200 rounded-xl text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              Clear
            </button>
          </div>

          {needsActionMatches.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-900">Needs Action</h3>
                <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  {needsActionMatches.length}
                </span>
              </div>
              <div className="space-y-3">
                {needsActionMatches.map(renderMatchCard)}
              </div>
            </section>
          )}

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-900">Scheduled Matches</h3>
              <span className="text-xs font-medium text-zinc-500">
                {scheduledMatches.length} shown
              </span>
            </div>
            <div className="space-y-3">
              {visibleScheduledMatches.map(renderMatchCard)}
            </div>
            {scheduledMatches.length === 0 && (
              <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">
                No scheduled matches match your filters.
              </div>
            )}
            {scheduledMatches.length > visibleScheduledCount && (
              <button
                type="button"
                onClick={() =>
                  setVisibleScheduledCount((previous) => previous + OWNER_VISIBLE_MATCHES_STEP)
                }
                className="w-full py-2.5 border border-zinc-200 rounded-full text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                Load More Matches
              </button>
            )}
          </section>
        </div>
      ) : (
        <div className="space-y-3">
          {matchCards.map(renderMatchCard)}
        </div>
      )}
    </div>
  );
}
