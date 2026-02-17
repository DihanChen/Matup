import type { ReactNode } from "react";
import type {
  AssignedTeamPair,
  League,
  LeagueInvite,
  LeagueMatch,
  LeagueMember,
  RunningSession,
  Standing,
  TeamStanding,
} from "@/lib/league-types";

export type LeagueDetailContentProps = {
  league: League;
  members: LeagueMember[];
  standings: Standing[];
  teamStandings: TeamStanding[];
  leagueInvites: LeagueInvite[];
  assignedTeams: AssignedTeamPair[];
  unpairedAssignedMemberIds: string[];
  pendingReviewMatches: LeagueMatch[];
  displayedRecentResults: LeagueMatch[];
  displayedPendingReviewMatches: LeagueMatch[];
  displayedUpcomingMatches: LeagueMatch[];
  ownerMember: LeagueMember | null;
  completedMatches: LeagueMatch[];
  sortedRunningSessions: RunningSession[];
  isRacketLeague: boolean;
  isPickleballLeague: boolean;
  isDoubles: boolean;
  isAssignedDoubles: boolean;
  isRunningLeague: boolean;
  isRunningProgressMode: boolean;
  isOwnerOrAdmin: boolean;
  isMember: boolean;
  isFull: boolean;
  isParticipantView: boolean;
  isAuthenticated: boolean;
  currentMemberRole: LeagueMember["role"] | null;
  hasRecentResults: boolean;
  hasPendingResultReviews: boolean;
  hasUpcomingMatches: boolean;
  needsTeamSetup: boolean;
  hasLeagueActions: boolean;
  showGenerateSchedule: boolean;
  canGenerateSchedule: boolean;
  generateScheduleMessage: string | null;
  showRecordResultsAction: boolean;
  showManageTeamsAction: boolean;
  showEmailMembersAction: boolean;
  showDeleteLeagueAction: boolean;
  hasSecondaryLeagueActionPair: boolean;
  ownerCanToggleToParticipantView: boolean;
  ownerViewMode: "owner" | "participant";
  recentResultsSpanClass: string;
  upcomingMatchesSpanClass: string;
  currentUserId: string | null;
  inviteCode: string;
  inviteError: string | null;
  inviteSuccess: string | null;
  joining: boolean;
  leaving: boolean;
  generating: boolean;
  creatingSession: boolean;
  sessionsError: string | null;
  submittingRunSessionId: string | null;
  reviewingSubmissionId: string | null;
  reviewingRunId: string | null;
  finalizingSessionId: string | null;
  resolvingFixtureId: string | null;
  sportDisplayName: string;
  onOwnerViewModeChange: (mode: "owner" | "participant") => void;
  onHandleJoin: () => void;
  onHandleLeave: () => void;
  onHandleCopyInviteLink: () => void;
  onOpenInviteModal: () => void;
  onHandleGenerateSchedule: () => void;
  onOpenAssignedTeamsModal: () => void;
  onOpenEmailModal: () => void;
  onOpenDeleteLeague: () => void;
  onHandleCopyInviteCode: () => void;
  onOpenCreateRunningSessionModal: () => void;
  onOpenRunEntryModal: (session: RunningSession) => void;
  onHandleFinalizeRunningSession: (sessionId: string) => void;
  onHandleReviewRun: (
    runningSessionId: string,
    runId: string,
    decision: "approve" | "reject"
  ) => void;
  onOpenRejectRunModal: (sessionId: string, runId: string, runnerName: string) => void;
  onHandleReviewSubmission: (
    match: LeagueMatch,
    decision: "confirm" | "reject",
    reason?: string
  ) => void;
  onOpenRejectSubmissionModal: (match: LeagueMatch) => void;
  onOpenResolveDisputeModal: (match: LeagueMatch) => void;
  onSelectSubmitResult: (match: LeagueMatch) => void;
  getMemberNameById: (memberId: string) => string;
  renderMatchResult: (match: LeagueMatch) => ReactNode;
};
