"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import StatusBadge from "@/components/leagues/StatusBadge";
import AnnouncementsCard from "@/features/leagues/components/detail/AnnouncementsCard";
import AvailabilityCard from "@/features/leagues/components/detail/AvailabilityCard";
import BracketView from "@/features/leagues/components/detail/BracketView";
import RecentResultsCard from "@/features/leagues/components/detail/RecentResultsCard";
import RunningSessionsCard from "@/features/leagues/components/detail/RunningSessionsCard";

import SidebarAssignedTeamsCard from "@/features/leagues/components/detail/SidebarAssignedTeamsCard";
import StandingsCard from "@/features/leagues/components/detail/StandingsCard";
import UpcomingMatchesCard from "@/features/leagues/components/detail/UpcomingMatchesCard";
import type { LeagueDetailContentProps } from "@/features/leagues/components/detail/types";
import { FORMAT_LABELS, ROTATION_LABELS } from "@/lib/league-types";
import { getInitials } from "@/lib/league-utils";
import { getSportCoverImage } from "@/features/leagues/components/detail/sportCover";

type Props = {
  data: LeagueDetailContentProps;
};

/* ─── Helpers ───────────────────────────────────────────────────────── */

function getProgressMetrics(data: LeagueDetailContentProps) {
  if (data.isRunningLeague) {
    const totalSessions = data.sortedRunningSessions.length;
    const finalizedSessions = data.sortedRunningSessions.filter(
      (session) => session.status === "finalized"
    ).length;
    const percent =
      totalSessions > 0
        ? Math.round((finalizedSessions / totalSessions) * 100)
        : 0;

    return {
      value: `${percent}%`,
      label:
        totalSessions > 0
          ? `${finalizedSessions}/${totalSessions} sessions finalized`
          : "No sessions yet",
      percent,
    };
  }

  const totalMatches =
    data.completedMatches.length + data.displayedUpcomingMatches.length;
  const percent =
    totalMatches > 0
      ? Math.round((data.completedMatches.length / totalMatches) * 100)
      : 0;

  return {
    value: `${percent}%`,
    label:
      totalMatches > 0
        ? `${data.completedMatches.length}/${totalMatches} matchups completed`
        : "No matchups yet",
    percent,
  };
}

function getParticipantRecord(data: LeagueDetailContentProps): string {
  if (!data.currentUserId) return "—";

  const standing = data.standings.find(
    (s) => s.user_id === data.currentUserId
  );
  if (!standing) return "—";

  if (data.isRunningLeague && data.isRunningProgressMode) {
    return `${standing.points > 0 ? "+" : ""}${standing.points.toFixed(1)}%`;
  }

  if (data.isRacketLeague || data.league.scoring_format === "team_vs_team") {
    return `${standing.wins}W – ${standing.losses}L`;
  }

  if (data.league.scoring_format === "individual_points") {
    return `${standing.totalPoints} pts`;
  }

  return `${standing.points} pts`;
}

function getParticipantRank(data: LeagueDetailContentProps): {
  rank: number | null;
  previousRank: number | null | undefined;
} {
  if (!data.currentUserId) return { rank: null, previousRank: null };

  const standing = data.standings.find(
    (s) => s.user_id === data.currentUserId
  );
  if (!standing) return { rank: null, previousRank: null };

  return { rank: standing.rank, previousRank: standing.previousRank };
}

function getNextMatchInfo(data: LeagueDetailContentProps): string {
  if (data.isRunningLeague) {
    const openSession = data.sortedRunningSessions.find(
      (s) => s.status === "open" || s.status === "scheduled"
    );
    if (openSession) {
      return openSession.week_number
        ? `Week ${openSession.week_number}`
        : "Open session";
    }
    return "None";
  }

  if (data.displayedUpcomingMatches.length === 0) return "None";

  const nextMatch = data.displayedUpcomingMatches[0];
  const opponents = nextMatch.participants.filter(
    (p) => p.user_id !== data.currentUserId
  );
  const opponentNames = opponents
    .map((p) => p.name || "?")
    .join(" & ");

  if (opponentNames) return `vs ${opponentNames}`;

  const sideA = nextMatch.participants
    .filter((p) => p.team === "A")
    .map((p) => p.name || "?")
    .join(" & ");
  const sideB = nextMatch.participants
    .filter((p) => p.team === "B")
    .map((p) => p.name || "?")
    .join(" & ");

  return sideA && sideB ? `${sideA} vs ${sideB}` : "Scheduled";
}

/* ─── Hero Banner ──────────────────────────────────────────────────── */

function ParticipantHeroBanner({ data }: Props) {
  const {
    league,
    members,
    isMember,
    currentMemberRole,
    leaving,
    ownerCanToggleToParticipantView,
    ownerViewMode,
    onOwnerViewModeChange,
    onHandleLeave,
  } = data;

  return (
    <section className="relative rounded-3xl">
      <div className="absolute inset-0 overflow-hidden rounded-3xl">
        <Image
          src={getSportCoverImage(league.sport_type)}
          alt=""
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
      </div>

      <div className="relative z-10 flex min-h-[260px] flex-col justify-end p-6 sm:min-h-[320px] sm:p-8">
        {/* Top-left badges */}
        <div className="absolute left-6 top-6 flex flex-wrap items-center gap-2 sm:left-8 sm:top-8">
          <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-medium capitalize text-white backdrop-blur-sm">
            {league.sport_type?.replace(/_/g, " ") || "Sport"}
          </span>
          <StatusBadge status={league.status} />
        </div>

        {/* Bottom content */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          {/* Left: title + description + toggle */}
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-white sm:text-4xl break-words">
              {league.name}
            </h1>
            {league.description && (
              <p className="mt-2 max-w-xl text-sm text-white/60 leading-relaxed line-clamp-2">
                {league.description}
              </p>
            )}
            {ownerCanToggleToParticipantView && (
              <div className="mt-3 inline-flex items-center rounded-full border border-white/30 bg-white/15 p-0.5 backdrop-blur-sm">
                <button
                  type="button"
                  onClick={() => onOwnerViewModeChange("owner")}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    ownerViewMode === "owner"
                      ? "bg-white text-zinc-900"
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  Owner
                </button>
                <button
                  type="button"
                  onClick={() => onOwnerViewModeChange("participant")}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    ownerViewMode === "participant"
                      ? "bg-white text-zinc-900"
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  Participant
                </button>
              </div>
            )}
          </div>

          {/* Right: avatar row + leave button */}
          <div className="flex items-center gap-3">
            {/* Player avatars */}
            <div className="flex -space-x-2">
              {members.slice(0, 5).map((member) => (
                <div
                  key={member.id}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-black/20 overflow-hidden bg-zinc-300"
                  title={member.name || "Member"}
                >
                  {member.avatar_url ? (
                    <Image
                      src={member.avatar_url}
                      alt={member.name || ""}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] font-semibold text-white">
                      {getInitials(member.name)}
                    </span>
                  )}
                </div>
              ))}
              {members.length > 5 && (
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/20 ring-2 ring-black/20 text-[10px] font-semibold text-white backdrop-blur-sm">
                  +{members.length - 5}
                </div>
              )}
            </div>

            {isMember && currentMemberRole !== "owner" && (
              <button
                type="button"
                onClick={onHandleLeave}
                disabled={leaving}
                className="inline-flex items-center justify-center rounded-full border border-white/40 bg-white/15 px-4 py-2 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/25 disabled:opacity-50"
              >
                {leaving ? "Leaving..." : "Leave League"}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Stats Row ────────────────────────────────────────────────────── */

function ParticipantStatsRow({ data }: Props) {
  const progress = getProgressMetrics(data);
  const record = getParticipantRecord(data);
  const { rank, previousRank } = getParticipantRank(data);
  const nextMatch = getNextMatchInfo(data);

  const rankMovement =
    rank !== null && previousRank != null ? previousRank - rank : 0;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {/* Your Rank */}
      <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
          <svg
            className="h-5 w-5 text-orange-500"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 1c-1.828 0-3.623.149-5.371.435a.75.75 0 0 0-.629.74v.659a4.503 4.503 0 0 0 2.77 4.159 4.501 4.501 0 0 0 1.938 2.632l-.573 2.292H7a.75.75 0 0 0 0 1.5h.25v1.333a.75.75 0 0 0 .183.493l1.25 1.458a.75.75 0 0 0 1.134 0l1.25-1.458a.75.75 0 0 0 .183-.493v-1.333H11a.75.75 0 0 0 0-1.5h-1.134l-.573-2.292a4.501 4.501 0 0 0 1.938-2.632 4.503 4.503 0 0 0 2.769-4.16v-.658a.75.75 0 0 0-.629-.74A34.067 34.067 0 0 0 10 1ZM5.5 3.57v-.264C7 3.106 8.489 3 10 3s3 .106 4.5.306v.264a3.003 3.003 0 0 1-1.58 2.644A4.526 4.526 0 0 0 10 3.5c-1.2 0-2.29.47-3.093 1.237A3.003 3.003 0 0 1 5.5 3.57Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="mt-3 text-xs font-medium text-zinc-500">Your Rank</div>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span className="text-2xl font-bold text-zinc-900">
            {rank !== null ? `#${rank}` : "—"}
          </span>
          {rankMovement > 0 && (
            <span className="inline-flex items-center text-emerald-600 text-xs font-medium">
              <svg
                className="w-3 h-3 mr-0.5"
                viewBox="0 0 12 12"
                fill="currentColor"
              >
                <path d="M6 2l4 5H2z" />
              </svg>
              {rankMovement}
            </span>
          )}
          {rankMovement < 0 && (
            <span className="inline-flex items-center text-red-500 text-xs font-medium">
              <svg
                className="w-3 h-3 mr-0.5"
                viewBox="0 0 12 12"
                fill="currentColor"
              >
                <path d="M6 10l4-5H2z" />
              </svg>
              {Math.abs(rankMovement)}
            </span>
          )}
        </div>
      </div>

      {/* Your Record */}
      <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
          <svg
            className="h-5 w-5 text-blue-500"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 1a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 1ZM5.05 3.05a.75.75 0 0 1 1.06 0l1.062 1.06a.75.75 0 1 1-1.06 1.06L5.05 4.11a.75.75 0 0 1 0-1.06ZM14.95 3.05a.75.75 0 0 1 0 1.06l-1.06 1.062a.75.75 0 0 1-1.062-1.06l1.06-1.06a.75.75 0 0 1 1.06 0ZM10.766 7.51a.75.75 0 0 0-1.37.365l-.492 6.861a.75.75 0 0 0 1.204.65l1.043-.799.985 3.678a.75.75 0 0 0 1.45-.388l-.978-3.646 1.292.204a.75.75 0 0 0 .74-1.16L10.766 7.51Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="mt-3 text-xs font-medium text-zinc-500">
          Your Record
        </div>
        <div className="mt-0.5 text-2xl font-bold text-zinc-900">{record}</div>
      </div>

      {/* Next Match */}
      <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
          <svg
            className="h-5 w-5 text-emerald-500"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="mt-3 text-xs font-medium text-zinc-500">
          {data.isRunningLeague ? "Next Session" : "Next Match"}
        </div>
        <div className="mt-0.5 truncate text-lg font-bold text-zinc-900">
          {nextMatch}
        </div>
      </div>

      {/* Season Progress */}
      <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
            <svg
              className="h-5 w-5 text-amber-500"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M2 4.25A2.25 2.25 0 0 1 4.25 2h11.5A2.25 2.25 0 0 1 18 4.25v8.5A2.25 2.25 0 0 1 15.75 15h-3.105a3.501 3.501 0 0 0 1.1 1.677A.75.75 0 0 1 13.26 18H6.74a.75.75 0 0 1-.484-1.323A3.501 3.501 0 0 0 7.355 15H4.25A2.25 2.25 0 0 1 2 12.75v-8.5Zm1.5 0a.75.75 0 0 1 .75-.75h11.5a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-.75.75H4.25a.75.75 0 0 1-.75-.75v-7.5Z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-600">
            {progress.value}
          </span>
        </div>
        <div className="mt-3 text-xs font-medium text-zinc-500">
          Season Progress
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-400"
            style={{
              width:
                progress.percent > 0
                  ? `${Math.min(100, Math.max(6, progress.percent))}%`
                  : "0%",
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Pending Actions Banner ───────────────────────────────────────── */

function PendingActionsBanner({ data }: Props) {
  const {
    displayedPendingReviewMatches,
    reviewingSubmissionId,
    onHandleReviewSubmission,
    onOpenRejectSubmissionModal,
  } = data;

  if (displayedPendingReviewMatches.length === 0) return null;

  return (
    <section className="rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <svg
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
              clipRule="evenodd"
            />
          </svg>
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-amber-900">
            Action Required
          </h2>
          <p className="text-sm text-amber-800 mt-0.5">
            You have {displayedPendingReviewMatches.length} result
            {displayedPendingReviewMatches.length !== 1 ? "s" : ""} awaiting
            your confirmation
          </p>

          <div className="mt-3 space-y-2">
            {displayedPendingReviewMatches.map((match) => {
              const teamA = match.participants.filter((p) => p.team === "A");
              const teamB = match.participants.filter((p) => p.team === "B");
              const sideANames = teamA
                .map((p) => p.name || "?")
                .join(" & ");
              const sideBNames = teamB
                .map((p) => p.name || "?")
                .join(" & ");
              const isReviewing =
                reviewingSubmissionId === match.latest_submission?.id;

              return (
                <div
                  key={match.id}
                  className="flex flex-wrap items-center gap-2 rounded-xl bg-white/70 px-3 py-2.5"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-zinc-900">
                      {match.week_number
                        ? `Week ${match.week_number}`
                        : "Match"}
                    </span>
                    {sideANames && sideBNames && (
                      <span className="ml-2 text-sm text-zinc-500">
                        {sideANames} vs {sideBNames}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onHandleReviewSubmission(match, "confirm")
                      }
                      disabled={isReviewing}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-full text-xs font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      {isReviewing ? "..." : "Confirm"}
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
      </div>
    </section>
  );
}

/* ─── League Info Card ─────────────────────────────────────────────── */

function LeagueInfoCard({ data }: Props) {
  const { league, ownerMember, members, currentUserId, isDoubles } = data;
  const [membersExpanded, setMembersExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-zinc-900 mb-4">League Info</h2>

      {/* Host */}
      {ownerMember && (
        <Link
          href={`/users/${ownerMember.user_id}`}
          className="flex items-center gap-3 mb-5 hover:opacity-80 transition-opacity"
        >
          {ownerMember.avatar_url ? (
            <Image
              src={ownerMember.avatar_url}
              alt={ownerMember.name || "Host"}
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200 text-sm font-semibold text-zinc-600">
              {getInitials(ownerMember.name)}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-zinc-900">
              {ownerMember.name || "League Owner"}
            </p>
            <p className="text-xs text-zinc-500">League Host</p>
          </div>
        </Link>
      )}

      {/* Key Info */}
      <div className="border-t border-zinc-100 pt-4 space-y-2.5 text-sm">
        <div className="flex justify-between gap-3">
          <span className="text-zinc-500">Match Type</span>
          <span className="font-medium text-zinc-900 text-right break-words">
            {FORMAT_LABELS[league.scoring_format]}
          </span>
        </div>
        {isDoubles && league.rotation_type && (
          <div className="flex justify-between gap-3">
            <span className="text-zinc-500">Rotation</span>
            <span className="font-medium text-zinc-900 text-right break-words">
              {ROTATION_LABELS[league.rotation_type]}
            </span>
          </div>
        )}
        <div className="flex justify-between gap-3">
          <span className="text-zinc-500">Type</span>
          <span className="font-medium text-zinc-900 capitalize text-right break-words">
            {league.league_type}
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-zinc-500">Capacity</span>
          <span className="font-medium text-zinc-900">
            {members.length}/{league.max_members}
          </span>
        </div>
        {league.start_date && (
          <div className="flex justify-between gap-3">
            <span className="text-zinc-500">Start Date</span>
            <span className="font-medium text-zinc-900 text-right">
              {new Date(league.start_date).toLocaleDateString()}
            </span>
          </div>
        )}
        {league.season_weeks && (
          <div className="flex justify-between gap-3">
            <span className="text-zinc-500">Season</span>
            <span className="font-medium text-zinc-900">
              {league.season_weeks} weeks
            </span>
          </div>
        )}
      </div>

      {/* Members (collapsible) */}
      <div className="border-t border-zinc-100 mt-4 pt-4">
        <button
          type="button"
          onClick={() => setMembersExpanded(!membersExpanded)}
          className="flex w-full items-center justify-between text-sm font-medium text-zinc-900 hover:text-zinc-600 transition-colors"
        >
          <span>Members ({members.length})</span>
          <svg
            className={`h-4 w-4 text-zinc-400 transition-transform ${
              membersExpanded ? "rotate-180" : ""
            }`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {membersExpanded && (
          <div className="mt-3 space-y-2.5 max-h-64 overflow-y-auto">
            {members.map((member) => (
              <Link
                key={member.id}
                href={`/users/${member.user_id}`}
                className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
              >
                {member.avatar_url ? (
                  <Image
                    src={member.avatar_url}
                    alt={member.name || "Member"}
                    width={28}
                    height={28}
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-semibold text-zinc-600">
                    {getInitials(member.name)}
                  </div>
                )}
                <span className="flex-1 truncate text-sm text-zinc-900">
                  {member.name || "Anonymous"}
                  {member.user_id === currentUserId && (
                    <span className="ml-1 text-xs text-orange-500">(You)</span>
                  )}
                </span>
                {member.role !== "member" && (
                  <span
                    className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                      member.role === "owner"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    {member.role}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Dashboard ───────────────────────────────────────────────── */

export default function ParticipantLeagueDashboard({ data }: Props) {
  // Override span classes so reused cards don't apply old 12-col grid sizing
  const cardData: LeagueDetailContentProps = {
    ...data,
    upcomingMatchesSpanClass: "",
    recentResultsSpanClass: "",
  };

  const detailedResultsData: LeagueDetailContentProps = {
    ...cardData,
    hasRecentResults: data.completedMatches.length > 0,
    displayedRecentResults: data.completedMatches.slice(0, 3),
  };

  return (
    <div className="space-y-8">
      {/* 1. Hero Banner */}
      <ParticipantHeroBanner data={data} />

      {/* 2. Stats Row */}
      <ParticipantStatsRow data={data} />

      {/* 3. Pending Actions Banner */}
      <PendingActionsBanner data={data} />

      {/* 4. Teams Setup Banner */}
      {data.needsTeamSetup && (
        <section className="rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10A8 8 0 1 1 2 10a8 8 0 0 1 16 0Zm-8-4a.75.75 0 0 0-.75.75v4.25a.75.75 0 0 0 1.5 0V6.75A.75.75 0 0 0 10 6Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <div>
                <h2 className="text-base font-semibold text-amber-900">
                  Set Up Your Doubles Teams
                </h2>
                <p className="text-sm text-amber-800 mt-1">
                  Pair your members into fixed teams before generating the
                  schedule.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={data.onOpenAssignedTeamsModal}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-full bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors"
            >
              Set Up Teams
            </button>
          </div>
        </section>
      )}

      {/* 6. Tournament Bracket */}
      {data.league.league_type === "tournament" &&
        data.allMatches.length > 0 && (
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4">
              Bracket
            </h2>
            <BracketView matches={data.allMatches} />
          </section>
        )}

      {/* 7. Two-column: Upcoming Matches | Standings */}
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        {data.isRunningLeague ? (
          <RunningSessionsCard data={cardData} />
        ) : (
          <div>
            <UpcomingMatchesCard data={cardData} />
          </div>
        )}
        <div>
          <StandingsCard data={cardData} />
        </div>
      </div>

      {/* 8. Two-column: Recent Results | League Info */}
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          {detailedResultsData.hasRecentResults ? (
            <RecentResultsCard data={detailedResultsData} />
          ) : (
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-zinc-900">
                  Your Recent Results
                </h2>
                <p className="text-xs text-zinc-500 mt-1">
                  Your latest completed matches and outcomes.
                </p>
              </div>
              <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center text-sm text-zinc-500">
                No completed matches yet. Results will appear here once matches
                are played.
              </div>
            </div>
          )}
        </div>
        <LeagueInfoCard data={data} />
      </div>

      {/* 9. Announcements */}
      {data.announcements.length > 0 && (
        <AnnouncementsCard announcements={data.announcements} />
      )}

      {/* 10. Availability (season leagues) */}
      {data.isMember && data.league.league_type === "season" && (
        <AvailabilityCard
          leagueId={data.league.id}
          seasonWeeks={data.league.season_weeks}
          currentUserId={data.currentUserId}
        />
      )}

      {/* 11. Assigned Teams (doubles) */}
      {data.isAssignedDoubles && <SidebarAssignedTeamsCard data={data} />}
    </div>
  );
}
