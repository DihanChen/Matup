"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import StatusBadge from "@/components/leagues/StatusBadge";
import BracketView from "@/features/leagues/components/detail/BracketView";
import LeagueShareButton from "@/features/leagues/components/detail/LeagueShareButton";
import RecentResultsCard from "@/features/leagues/components/detail/RecentResultsCard";
import RunningSessionsCard from "@/features/leagues/components/detail/RunningSessionsCard";
import SidebarAssignedTeamsCard from "@/features/leagues/components/detail/SidebarAssignedTeamsCard";
import type { LeagueDetailContentProps } from "@/features/leagues/components/detail/types";
import { getSportCoverImage } from "@/features/leagues/components/detail/sportCover";
import { getInitials } from "@/lib/league-utils";
import type { LeagueMatch } from "@/lib/league-types";

type Props = {
  data: LeagueDetailContentProps;
};

type ActivityItem = {
  id: string;
  title: string;
  detail: string;
  meta: string;
  timestamp: number;
  tone: "amber" | "blue" | "emerald" | "zinc";
};

/* ─── Helpers ───────────────────────────────────────────────────────── */

function getProgressMetrics(data: LeagueDetailContentProps) {
  if (data.isRunningLeague) {
    const totalSessions = data.sortedRunningSessions.length;
    const finalizedSessions = data.sortedRunningSessions.filter(
      (session) => session.status === "finalized"
    ).length;
    const percent = totalSessions > 0 ? Math.round((finalizedSessions / totalSessions) * 100) : 0;

    return {
      value: `${percent}%`,
      label:
        totalSessions > 0
          ? `${finalizedSessions}/${totalSessions} sessions finalized`
          : "No sessions yet",
      percent,
    };
  }

  const totalMatches = data.completedMatches.length + data.displayedUpcomingMatches.length;
  const percent = totalMatches > 0 ? Math.round((data.completedMatches.length / totalMatches) * 100) : 0;

  return {
    value: `${percent}%`,
    label:
      totalMatches > 0
        ? `${data.completedMatches.length}/${totalMatches} matchups completed`
        : "No matchups yet",
    percent,
  };
}

function getMemberMetric(
  data: LeagueDetailContentProps,
  memberId: string
): { label: string; value: string } | null {
  const standing = data.standings.find((item) => item.user_id === memberId);
  if (!standing) return null;

  if (data.isRunningLeague && data.isRunningProgressMode) {
    return {
      label: "Progress",
      value: `${standing.points > 0 ? "+" : ""}${standing.points.toFixed(1)}%`,
    };
  }

  if (data.isRacketLeague) {
    if (standing.played === 0) {
      return { label: "Win", value: "—" };
    }
    const winRate = Math.round((standing.wins / standing.played) * 100);
    return {
      label: "Win",
      value: `${winRate}%`,
    };
  }

  if (data.league.scoring_format === "individual_points") {
    return {
      label: "Points",
      value: String(standing.totalPoints),
    };
  }

  return {
    label: "Points",
    value: String(standing.points),
  };
}

function getSortedMembers(data: LeagueDetailContentProps) {
  const rankIndex = new Map(
    data.standings.map((standing, index) => [standing.user_id, index])
  );

  return [...data.members].sort((left, right) => {
    const leftRank = rankIndex.get(left.user_id) ?? Number.MAX_SAFE_INTEGER;
    const rightRank = rankIndex.get(right.user_id) ?? Number.MAX_SAFE_INTEGER;
    if (leftRank !== rightRank) return leftRank - rightRank;
    return (left.name || "").localeCompare(right.name || "");
  });
}

function formatRelativeTime(dateInput: string | number | null) {
  if (dateInput === null || dateInput === "") return "Unknown time";

  const parsed = new Date(dateInput);
  if (Number.isNaN(parsed.getTime())) return "Unknown time";

  const diffMs = Date.now() - parsed.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getMatchLabel(match: LeagueMatch, fallbackIndex: number) {
  return match.week_number ? `Week ${match.week_number}` : `Match ${fallbackIndex + 1}`;
}

function getMatchSummary(match: LeagueMatch) {
  const sideA = match.participants
    .filter((participant) => participant.team === "A")
    .map((participant) => participant.name || "Anonymous")
    .join(" & ");
  const sideB = match.participants
    .filter((participant) => participant.team === "B")
    .map((participant) => participant.name || "Anonymous")
    .join(" & ");

  if (sideA && sideB && match.winner === "A") {
    return `${sideA} beat ${sideB}`;
  }
  if (sideA && sideB && match.winner === "B") {
    return `${sideB} beat ${sideA}`;
  }
  if (sideA && sideB) {
    return `${sideA} vs ${sideB}`;
  }
  return "Match result updated";
}

function buildActivityItems(data: LeagueDetailContentProps): ActivityItem[] {
  const activities: ActivityItem[] = [];

  data.completedMatches.slice(0, 3).forEach((match, index) => {
    activities.push({
      id: `result-${match.id}`,
      title: "Match Result Recorded",
      detail: getMatchSummary(match),
      meta: getMatchLabel(match, index),
      timestamp: new Date(match.created_at).getTime() || 0,
      tone: "amber",
    });
  });

  data.members
    .slice()
    .sort(
      (left, right) =>
        new Date(right.joined_at).getTime() - new Date(left.joined_at).getTime()
    )
    .slice(0, 2)
    .forEach((member) => {
      activities.push({
        id: `member-${member.id}`,
        title: "New Player Joined",
        detail: `${member.name || "Anonymous"} has entered the league`,
        meta: member.role === "owner" ? "Commissioner" : "Member",
        timestamp: new Date(member.joined_at).getTime() || 0,
        tone: "blue",
      });
    });

  data.leagueInvites.slice(0, 2).forEach((invite) => {
    activities.push({
      id: `invite-${invite.id}`,
      title: invite.status === "accepted" ? "Invite accepted" : "Invite sent",
      detail: invite.email,
      meta: invite.status === "accepted" ? "Member onboarded" : "Pending response",
      timestamp: new Date(invite.claimed_at || invite.invited_at).getTime() || 0,
      tone: "emerald",
    });
  });

  if (data.isRunningLeague && data.sortedRunningSessions.length > 0) {
    const latestSession = [...data.sortedRunningSessions].sort((left, right) => {
      const leftTime = new Date(left.starts_at || left.submission_deadline || 0).getTime();
      const rightTime = new Date(right.starts_at || right.submission_deadline || 0).getTime();
      return rightTime - leftTime;
    })[0];

    if (latestSession) {
      activities.push({
        id: `session-${latestSession.id}`,
        title:
          latestSession.status === "finalized" ? "Session finalized" : "Session scheduled",
        detail: latestSession.week_number
          ? `Week ${latestSession.week_number}`
          : "Open running session",
        meta: latestSession.distance_meters
          ? `${Math.round(latestSession.distance_meters / 1000)}K target`
          : latestSession.session_type.replace(/_/g, " "),
        timestamp:
          new Date(latestSession.starts_at || latestSession.submission_deadline || 0).getTime() ||
          0,
        tone: "blue",
      });
    }
  } else if (data.displayedUpcomingMatches.length > 0) {
    const latestScheduledMatch = [...data.displayedUpcomingMatches].sort(
      (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
    )[0];

    if (latestScheduledMatch) {
      activities.push({
        id: `scheduled-${latestScheduledMatch.id}`,
        title: `${getMatchLabel(latestScheduledMatch, 0)} scheduled`,
        detail: getMatchSummary(latestScheduledMatch),
        meta: latestScheduledMatch.match_date
          ? new Date(`${latestScheduledMatch.match_date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : "Upcoming",
        timestamp: new Date(latestScheduledMatch.created_at).getTime() || 0,
        tone: "zinc",
      });
    }
  }

  return activities
    .sort((left, right) => right.timestamp - left.timestamp)
    .slice(0, 5);
}

function formatOwnerDisplayName(name: string | null | undefined): string {
  if (!name) return "Owner";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1][0]}.`;
}

type HealthMetrics = {
  engagementRate: number;
  activePlayers: number;
  totalPlayers: number;
  pendingActions: number;
  inactivePlayers: string[];
};

function getLeagueHealthMetrics(data: LeagueDetailContentProps): HealthMetrics {
  const totalPlayers = data.members.length;
  const playerIdsWithMatches = new Set<string>();

  for (const match of data.completedMatches) {
    for (const p of match.participants) {
      playerIdsWithMatches.add(p.user_id);
    }
  }

  const activePlayers = data.members.filter((m) => playerIdsWithMatches.has(m.user_id)).length;
  const engagementRate = totalPlayers > 0 ? Math.round((activePlayers / totalPlayers) * 100) : 0;

  const pendingActions =
    data.pendingReviewMatches.length +
    data.displayedUpcomingMatches.filter(
      (m) => m.workflow_status === "disputed"
    ).length;

  // Find members with no matches in the last 3 weeks
  const maxWeek = Math.max(
    0,
    ...data.completedMatches.map((m) => m.week_number ?? 0)
  );
  const recentThreshold = Math.max(1, maxWeek - 2);
  const recentlyActivePlayers = new Set<string>();

  for (const match of data.completedMatches) {
    if ((match.week_number ?? 0) >= recentThreshold) {
      for (const p of match.participants) {
        recentlyActivePlayers.add(p.user_id);
      }
    }
  }

  const inactivePlayers = data.members
    .filter(
      (m) =>
        m.role !== "owner" &&
        playerIdsWithMatches.has(m.user_id) &&
        !recentlyActivePlayers.has(m.user_id)
    )
    .map((m) => m.name || "Anonymous");

  return { engagementRate, activePlayers, totalPlayers, pendingActions, inactivePlayers };
}

/* ─── Hero Banner Content ───────────────────────────────────────────── */

function HeroBannerContent({ data }: Props) {
  const [manageOpen, setManageOpen] = useState(false);
  const manageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (manageRef.current && !manageRef.current.contains(event.target as Node)) {
        setManageOpen(false);
      }
    }
    if (manageOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [manageOpen]);

  return (
    <div className="relative z-10 flex min-h-[280px] flex-col justify-end p-6 sm:min-h-[340px] sm:p-8">
      {/* Share button — absolute top-right so it never shifts layout */}
      {data.isOwnerOrAdmin && (
        <div className="absolute right-6 top-6 z-20 sm:right-8 sm:top-8">
          <LeagueShareButton
            inviteCode={data.inviteCode}
            onCopyInviteLink={data.onHandleCopyInviteLink}
            onInviteByEmail={data.onOpenInviteModal}
          />
        </div>
      )}

      {/* Bottom: Title + toggle on left, action buttons on right */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        {/* Left: Tags + Title + view toggle */}
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-medium capitalize text-white backdrop-blur-sm">
              {data.league.sport_type?.replace(/_/g, " ") || "Sport"}
            </span>
            <StatusBadge status={data.league.status} />
          </div>
          <h1 className="text-3xl font-bold text-white sm:text-4xl break-words">
            {data.league.name}
          </h1>
          {data.ownerCanToggleToParticipantView && (
            <div className="mt-3 inline-flex items-center rounded-full border border-white/30 bg-white/15 p-0.5 backdrop-blur-sm">
              <button
                type="button"
                onClick={() => data.onOwnerViewModeChange("owner")}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  data.ownerViewMode === "owner"
                    ? "bg-white text-zinc-900"
                    : "text-white/80 hover:text-white"
                }`}
              >
                Owner
              </button>
              <button
                type="button"
                onClick={() => data.onOwnerViewModeChange("participant")}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  data.ownerViewMode === "participant"
                    ? "bg-white text-zinc-900"
                    : "text-white/80 hover:text-white"
                }`}
              >
                Participant
              </button>
            </div>
          )}
          {data.generateScheduleMessage && (
            <p className="mt-2 text-sm text-amber-200">{data.generateScheduleMessage}</p>
          )}
        </div>

        {/* Right: Action buttons */}
        <div className="flex flex-wrap items-center gap-2 lg:flex-col lg:items-end lg:gap-2 sm:min-w-[180px]">
          <button
            type="button"
            onClick={data.onOpenInviteModal}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-600"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM2.046 15.253c-.058.468.172.92.57 1.175A9.953 9.953 0 0 0 8 18c1.982 0 3.83-.578 5.384-1.573.398-.254.628-.707.57-1.175a6.001 6.001 0 0 0-11.908 0ZM15.75 6.5a.75.75 0 0 0-1.5 0v2h-2a.75.75 0 0 0 0 1.5h2v2a.75.75 0 0 0 1.5 0v-2h2a.75.75 0 0 0 0-1.5h-2v-2Z" />
            </svg>
            Invite Players
          </button>

          {/* Manage Matches with dropdown */}
          <div ref={manageRef} className="relative">
            <button
              type="button"
              onClick={() => setManageOpen((prev) => !prev)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/40 bg-white/15 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/25"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M5.433 13.917l1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
              </svg>
              League Settings
              <svg className={`h-4 w-4 transition-transform ${manageOpen ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
              </svg>
            </button>

            {manageOpen && (
              <div className="absolute left-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-lg sm:left-auto sm:right-0">
                <button
                  type="button"
                  onClick={() => {
                    data.onHandleEditLeague();
                    setManageOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
                >
                  <svg className="h-4 w-4 text-zinc-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M5.433 13.917l1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                    <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                  </svg>
                  Edit League
                </button>

                <button
                  type="button"
                  onClick={() => {
                    data.onHandleCopyLeague();
                    setManageOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
                >
                  <svg className="h-4 w-4 text-zinc-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M6.5 2A2.5 2.5 0 0 0 4 4.5v8A2.5 2.5 0 0 0 6.5 15H9v.5A2.5 2.5 0 0 0 11.5 18h4A2.5 2.5 0 0 0 18 15.5v-8A2.5 2.5 0 0 0 15.5 5H13v-.5A2.5 2.5 0 0 0 10.5 2h-4Zm5 4.5h4a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Zm-5-3h4a1 1 0 0 1 1 1V5h-.5A2.5 2.5 0 0 0 8.5 7.5v6H6.5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z" />
                  </svg>
                  Copy League
                </button>

                <div className="my-1 border-t border-zinc-100" />

                {data.isRunningLeague && (
                  <button
                    type="button"
                    onClick={() => { data.onOpenCreateRunningSessionModal(); setManageOpen(false); }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
                  >
                    <svg className="h-4 w-4 text-zinc-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11.25a.75.75 0 0 0-1.5 0v4.59L7.3 13.3a.75.75 0 0 0 1.04 1.08l2.5-2.12a.75.75 0 0 0 .41-.76V6.75Z" clipRule="evenodd" />
                    </svg>
                    Create Session
                  </button>
                )}

                {data.showGenerateSchedule && (
                  <button
                    type="button"
                    onClick={() => { data.onHandleGenerateSchedule(); setManageOpen(false); }}
                    disabled={data.generating || !data.canGenerateSchedule}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <svg className="h-4 w-4 text-zinc-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75Z" clipRule="evenodd" />
                    </svg>
                    {data.generating
                      ? "Generating..."
                      : data.isRunningLeague
                      ? "Generate Sessions"
                      : "Generate Schedule"}
                  </button>
                )}

                {data.showManageTeamsAction && (
                  <button
                    type="button"
                    onClick={() => { data.onOpenAssignedTeamsModal(); setManageOpen(false); }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
                  >
                    <svg className="h-4 w-4 text-zinc-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path d="M7 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM14.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM1.615 16.428a1.224 1.224 0 0 1-.569-1.175 6.002 6.002 0 0 1 11.908 0c.058.468-.172.92-.57 1.174A9.953 9.953 0 0 1 7 18a9.953 9.953 0 0 1-5.385-1.572ZM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 0 0-1.588-3.755 4.502 4.502 0 0 1 5.874 2.636.818.818 0 0 1-.36.98A7.465 7.465 0 0 1 14.5 16Z" />
                    </svg>
                    Manage Teams
                  </button>
                )}

                {data.showEmailMembersAction && (
                  <button
                    type="button"
                    onClick={() => { data.onOpenEmailModal(); setManageOpen(false); }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
                  >
                    <svg className="h-4 w-4 text-zinc-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path d="M3 4a2 2 0 0 0-2 2v1.161l8.441 4.221a1.25 1.25 0 0 0 1.118 0L19 7.162V6a2 2 0 0 0-2-2H3Z" />
                      <path d="m19 8.839-7.77 3.885a2.75 2.75 0 0 1-2.46 0L1 8.839V14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.839Z" />
                    </svg>
                    Email Members
                  </button>
                )}

                {data.showDeleteLeagueAction && (
                  <>
                    <div className="my-1 border-t border-zinc-100" />
                    <button
                      type="button"
                      onClick={() => { data.onOpenDeleteLeague(); setManageOpen(false); }}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                    >
                      <svg className="h-4 w-4 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.519.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                      </svg>
                      Delete League
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Active Matchups (court-style) ─────────────────────────────────── */

function ActiveMatchupsCard({ data }: Props) {
  const matches = data.displayedUpcomingMatches.slice(0, 4);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
      <div className="mb-5">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
          <svg className="h-5 w-5 text-orange-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-6 8a6 6 0 1 1 12 0H4Z" />
          </svg>
          Active Matchups
        </h2>
      </div>

      {matches.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center text-sm text-zinc-500">
          No active matchups yet. Generate a schedule to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((match, index) => {
            const teamA = match.participants.filter((p) => p.team === "A");
            const teamB = match.participants.filter((p) => p.team === "B");
            const sideAName = teamA.map((p) => p.name || "?").join(" & ");
            const sideBName = teamB.map((p) => p.name || "?").join(" & ");
            const sideAInitials = teamA.map((p) => getInitials(p.name)).join("");
            const sideBInitials = teamB.map((p) => getInitials(p.name)).join("");
            const courtLabel = match.week_number
              ? `Week ${match.week_number}`
              : `Week ${index + 1}`;

            const hasPendingSubmission = match.latest_submission?.status === "pending";
            const isDisputed = match.workflow_status === "disputed";
            const canSubmit = match.workflow_status === "scheduled";

            const avatarA = teamA.length === 1
              ? data.members.find((m) => m.user_id === teamA[0].user_id)?.avatar_url
              : null;
            const avatarB = teamB.length === 1
              ? data.members.find((m) => m.user_id === teamB[0].user_id)?.avatar_url
              : null;

            return (
              <div key={match.id} className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-4">
                <div className="mb-2.5 text-xs font-semibold text-orange-500">
                  {courtLabel}
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Side A */}
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    {avatarA ? (
                      <Image
                        src={avatarA}
                        alt={sideAName}
                        width={32}
                        height={32}
                        className="h-8 w-8 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-white">
                        {sideAInitials || "?"}
                      </div>
                    )}
                    <span className="truncate text-sm font-medium text-zinc-900">{sideAName}</span>
                  </div>

                  {/* Center action */}
                  {canSubmit ? (
                    <button
                      type="button"
                      onClick={() => data.onSelectSubmitResult(match)}
                      className="shrink-0 rounded-full border-2 border-orange-500 bg-white px-4 py-1.5 text-xs font-semibold text-orange-500 transition-colors hover:bg-orange-50"
                    >
                      Add Score
                    </button>
                  ) : isDisputed ? (
                    <button
                      type="button"
                      onClick={() => data.onOpenResolveDisputeModal(match)}
                      disabled={data.resolvingFixtureId === match.id}
                      className="shrink-0 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                    >
                      Resolve
                    </button>
                  ) : hasPendingSubmission ? (
                    <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700">
                      Pending
                    </span>
                  ) : (
                    <span className="shrink-0 text-xs font-medium text-zinc-400">
                      vs
                    </span>
                  )}

                  {/* Side B */}
                  <div className="flex min-w-0 flex-1 items-center justify-end gap-2.5">
                    <span className="truncate text-sm font-medium text-zinc-900">{sideBName}</span>
                    {avatarB ? (
                      <Image
                        src={avatarB}
                        alt={sideBName}
                        width={32}
                        height={32}
                        className="h-8 w-8 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                        {sideBInitials || "?"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Link
        href={`/leagues/${data.league.id}/schedule`}
        className="mt-5 flex w-full items-center justify-center rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
      >
        View Full Schedule
      </Link>
    </section>
  );
}

/* ─── Members Card ──────────────────────────────────────────────────── */

function OwnerMembersCard({ data }: Props) {
  const members = getSortedMembers(data);

  return (
    <section className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
          <svg className="h-5 w-5 text-orange-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-6 8a6 6 0 1 1 12 0H4Z" />
          </svg>
          Members
        </h2>
        <span className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
          {data.members.length} Total
        </span>
      </div>

      <div className="flex-1 divide-y divide-zinc-100">
        {members.slice(0, 5).map((member, index) => {
          const metric = getMemberMetric(data, member.user_id);

          return (
            <Link
              key={member.id}
              href={`/users/${member.user_id}`}
              className="flex items-center gap-3 py-3 transition-colors hover:bg-zinc-50 first:pt-0 last:pb-0"
            >
              <div className="relative shrink-0">
                {member.avatar_url ? (
                  <Image
                    src={member.avatar_url}
                    alt={member.name || "Member"}
                    width={36}
                    height={36}
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-200 text-sm font-semibold text-zinc-600">
                    {getInitials(member.name)}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white ring-2 ring-white">
                  {index + 1}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-zinc-900">
                  {member.name || "Anonymous"}
                </div>
                {metric && (
                  <div className="text-xs text-zinc-400">{metric.label}</div>
                )}
              </div>
              {metric && (
                <span className="text-lg font-bold text-orange-500">{metric.value}</span>
              )}
            </Link>
          );
        })}
      </div>

      <Link
        href={`/leagues/${data.league.id}/schedule`}
        className="mt-auto flex w-full items-center justify-center rounded-full border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
      >
        View Full Schedule
      </Link>
    </section>
  );
}

/* ─── Recent Log (timeline) ─────────────────────────────────────────── */

const TONE_DOT_COLORS: Record<string, string> = {
  amber: "bg-orange-500",
  blue: "bg-blue-500",
  emerald: "bg-emerald-500",
  zinc: "bg-zinc-400",
};

function OwnerRecentLogCard({ data }: Props) {
  const items = buildActivityItems(data);

  return (
    <section className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-2">
        <div className="h-6 w-1 rounded-full bg-orange-500" />
        <h2 className="text-lg font-semibold text-zinc-900">Recent Log</h2>
      </div>

      <div className="flex-1">
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center text-sm text-zinc-500">
            Activity will appear here once the league starts moving.
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {items.map((item) => (
              <div key={item.id} className="flex items-start gap-3 py-3.5 first:pt-0 last:pb-0">
                <div className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${TONE_DOT_COLORS[item.tone] || "bg-zinc-400"}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-zinc-900">{item.title}</div>
                      <div className="mt-0.5 text-sm text-zinc-500">{item.detail}</div>
                    </div>
                    <span className="shrink-0 text-xs text-zinc-400">
                      {formatRelativeTime(item.timestamp)}
                    </span>
                  </div>
                  <span className="mt-1 inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500">
                    {item.meta}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </section>
  );
}

/* ─── League Health Section ─────────────────────────────────────────── */

function LeagueHealthSection({ data }: Props) {
  const health = getLeagueHealthMetrics(data);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-zinc-900 mb-3">League Health</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Engagement Rate */}
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              health.engagementRate >= 75
                ? "bg-emerald-50"
                : health.engagementRate >= 50
                ? "bg-amber-50"
                : "bg-red-50"
            }`}
          >
            <svg className={`h-5 w-5 ${
              health.engagementRate >= 75
                ? "text-emerald-500"
                : health.engagementRate >= 50
                ? "text-amber-500"
                : "text-red-500"
            }`} viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
            </svg>
          </div>
          <div>
            <div className="text-xs text-zinc-500">Engagement</div>
            <div className="text-sm font-bold text-zinc-900">
              {health.engagementRate}%
              <span className="ml-1 text-xs font-normal text-zinc-400">
                ({health.activePlayers}/{health.totalPlayers} played)
              </span>
            </div>
          </div>
        </div>

        {/* Pending Actions */}
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            health.pendingActions > 0 ? "bg-amber-50" : "bg-emerald-50"
          }`}>
            <svg className={`h-5 w-5 ${
              health.pendingActions > 0 ? "text-amber-500" : "text-emerald-500"
            }`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <div className="text-xs text-zinc-500">Pending Actions</div>
            <div className="text-sm font-bold text-zinc-900">
              {health.pendingActions === 0 ? (
                <span className="text-emerald-600">All clear</span>
              ) : (
                <>
                  {health.pendingActions} awaiting review
                </>
              )}
            </div>
          </div>
        </div>

        {/* Inactive Players */}
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            health.inactivePlayers.length > 0 ? "bg-red-50" : "bg-emerald-50"
          }`}>
            <svg className={`h-5 w-5 ${
              health.inactivePlayers.length > 0 ? "text-red-400" : "text-emerald-500"
            }`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <div className="text-xs text-zinc-500">Dropout Risk</div>
            <div className="text-sm font-bold text-zinc-900">
              {health.inactivePlayers.length === 0 ? (
                <span className="text-emerald-600">None</span>
              ) : (
                <span className="text-red-500" title={health.inactivePlayers.join(", ")}>
                  {health.inactivePlayers.length} inactive recently
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Dashboard ────────────────────────────────────────────────── */

export default function OwnerLeagueDashboard({ data }: Props) {
  const progress = getProgressMetrics(data);
  const detailedResultsData: LeagueDetailContentProps = {
    ...data,
    hasRecentResults: data.completedMatches.length > 0,
    displayedRecentResults: data.completedMatches.slice(0, 3),
    recentResultsSpanClass: "",
  };

  return (
    <div className="space-y-8">
      {/* ── Hero Banner ── */}
      <section className="relative rounded-3xl">
        {/* Background image clipped to rounded corners */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl">
          <Image
            src={getSportCoverImage(data.league.sport_type)}
            alt=""
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
        </div>

        <HeroBannerContent data={data} />
      </section>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {/* Total Players */}
        <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
            <svg className="h-5 w-5 text-orange-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M7 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM14.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM1.615 16.428a1.224 1.224 0 0 1-.569-1.175 6.002 6.002 0 0 1 11.908 0c.058.468-.172.92-.57 1.174A9.953 9.953 0 0 1 7 18a9.953 9.953 0 0 1-5.385-1.572ZM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 0 0-1.588-3.755 4.502 4.502 0 0 1 5.874 2.636.818.818 0 0 1-.36.98A7.465 7.465 0 0 1 14.5 16Z" />
            </svg>
          </div>
          <div className="mt-3 text-xs font-medium text-zinc-500">Total Players</div>
          <div className="mt-0.5 text-2xl font-bold text-zinc-900">{data.members.length}</div>
        </div>

        {/* Matches Played */}
        <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
            <svg className="h-5 w-5 text-orange-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 1a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 1ZM5.05 3.05a.75.75 0 0 1 1.06 0l1.062 1.06a.75.75 0 1 1-1.06 1.06L5.05 4.11a.75.75 0 0 1 0-1.06ZM14.95 3.05a.75.75 0 0 1 0 1.06l-1.06 1.062a.75.75 0 0 1-1.062-1.06l1.06-1.06a.75.75 0 0 1 1.06 0ZM10.766 7.51a.75.75 0 0 0-1.37.365l-.492 6.861a.75.75 0 0 0 1.204.65l1.043-.799.985 3.678a.75.75 0 0 0 1.45-.388l-.978-3.646 1.292.204a.75.75 0 0 0 .74-1.16L10.766 7.51Z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="mt-3 text-xs font-medium text-zinc-500">Matches Played</div>
          <div className="mt-0.5">
            <span className="text-2xl font-bold text-zinc-900">{data.completedMatches.length}</span>
            <span className="ml-1 text-sm text-zinc-400">
              / {data.completedMatches.length + data.displayedUpcomingMatches.length}
            </span>
          </div>
        </div>

        {/* Season Progress */}
        <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
              <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M2 4.25A2.25 2.25 0 0 1 4.25 2h11.5A2.25 2.25 0 0 1 18 4.25v8.5A2.25 2.25 0 0 1 15.75 15h-3.105a3.501 3.501 0 0 0 1.1 1.677A.75.75 0 0 1 13.26 18H6.74a.75.75 0 0 1-.484-1.323A3.501 3.501 0 0 0 7.355 15H4.25A2.25 2.25 0 0 1 2 12.75v-8.5Zm1.5 0a.75.75 0 0 1 .75-.75h11.5a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-.75.75H4.25a.75.75 0 0 1-.75-.75v-7.5Z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600">
              {progress.value} Complete
            </span>
          </div>
          <div className="mt-3 text-xs font-medium text-zinc-500">Season Progress</div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-400"
              style={{ width: progress.percent > 0 ? `${Math.min(100, Math.max(6, progress.percent))}%` : "0%" }}
            />
          </div>
        </div>

        {/* Current MVP / Leader */}
        <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
            <svg className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 1c-1.828 0-3.623.149-5.371.435a.75.75 0 0 0-.629.74v.659a4.503 4.503 0 0 0 2.77 4.159 4.501 4.501 0 0 0 1.938 2.632l-.573 2.292H7a.75.75 0 0 0 0 1.5h.25v1.333a.75.75 0 0 0 .183.493l1.25 1.458a.75.75 0 0 0 1.134 0l1.25-1.458a.75.75 0 0 0 .183-.493v-1.333H11a.75.75 0 0 0 0-1.5h-1.134l-.573-2.292a4.501 4.501 0 0 0 1.938-2.632 4.503 4.503 0 0 0 2.769-4.16v-.658a.75.75 0 0 0-.629-.74A34.067 34.067 0 0 0 10 1ZM5.5 3.57v-.264C7 3.106 8.489 3 10 3s3 .106 4.5.306v.264a3.003 3.003 0 0 1-1.58 2.644A4.526 4.526 0 0 0 10 3.5c-1.2 0-2.29.47-3.093 1.237A3.003 3.003 0 0 1 5.5 3.57Z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="mt-3 text-xs font-medium text-zinc-500">Current MVP</div>
          <div className="mt-0.5 truncate text-xl font-bold text-zinc-900">
            {(() => {
              if (data.standings.length > 0) {
                return formatOwnerDisplayName(data.standings[0].name);
              }
              return "TBD";
            })()}
          </div>
        </div>
      </div>

      {/* ── League Health ── */}
      {data.completedMatches.length > 0 && (
        <LeagueHealthSection data={data} />
      )}

      {/* ── Teams Setup Banner ── */}
      {data.needsTeamSetup && (
        <section className="rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M18 10A8 8 0 1 1 2 10a8 8 0 0 1 16 0Zm-8-4a.75.75 0 0 0-.75.75v4.25a.75.75 0 0 0 1.5 0V6.75A.75.75 0 0 0 10 6Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <div>
                <h2 className="text-base font-semibold text-amber-900">Set up fixed doubles teams</h2>
                <p className="mt-1 text-sm text-amber-800">
                  Pair your members before the schedule is generated so matchups stay locked.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={data.onOpenAssignedTeamsModal}
              className="inline-flex items-center justify-center rounded-full bg-amber-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-600"
            >
              Set Up Teams
            </button>
          </div>
        </section>
      )}

      {/* ── Tournament Bracket ── */}
      {data.league.league_type === "tournament" && data.allMatches.length > 0 && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">Bracket</h2>
          <BracketView matches={data.allMatches} />
        </section>
      )}

      {/* ── Two-column: Active Matchups | Members ── */}
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        {data.isRunningLeague ? (
          <RunningSessionsCard data={data} />
        ) : (
          <ActiveMatchupsCard data={data} />
        )}
        <OwnerMembersCard data={data} />
      </div>

      {/* ── Recent Log + Recent Results (side by side) ── */}
      <div className="grid gap-8 lg:grid-cols-2">
        <OwnerRecentLogCard data={data} />
        {detailedResultsData.hasRecentResults ? (
          <RecentResultsCard data={detailedResultsData} />
        ) : (
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-zinc-900">Recent Results</h2>
              <p className="text-xs text-zinc-500 mt-1">Most recent completed matches across the league.</p>
            </div>
            <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center text-sm text-zinc-500">
              No completed matches yet. Results will appear here once matches are played.
            </div>
          </section>
        )}
      </div>

      {/* ── Assigned Teams (if doubles) ── */}
      {data.isAssignedDoubles && <SidebarAssignedTeamsCard data={data} />}
    </div>
  );
}
