"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { getApiBaseUrl } from "@/lib/api";
import type { User } from "@supabase/supabase-js";
import StatusBadge from "@/components/leagues/StatusBadge";
import SubmitResultModal from "@/components/leagues/SubmitResultModal";
import CreateSessionModal from "@/components/leagues/CreateSessionModal";
import DeleteLeagueModal from "@/components/leagues/DeleteLeagueModal";
import EmailMembersModal from "@/components/leagues/EmailMembersModal";
import InviteModal from "@/components/leagues/InviteModal";
import ManageTeamsModal from "@/components/leagues/ManageTeamsModal";
import RejectModal from "@/components/leagues/RejectModal";
import ResolveDisputeModal from "@/components/leagues/ResolveDisputeModal";
import RunEntryModal from "@/components/leagues/RunEntryModal";
import {
  EMAIL_REGEX,
  FORMAT_LABELS,
  ROTATION_LABELS,
  getRunningModeFromRules,
  mapFixturesToLegacyMatches,
  mergeWorkflowMatches,
} from "@/lib/league-types";
import type {
  ApiAssignedTeamsResponse,
  ApiFixture,
  ApiInvitesResponse,
  ApiRunningSessionsResponse,
  ApiStandingsResponse,
  AssignedTeamPair,
  League,
  LeagueInvite,
  LeagueMatch,
  LeagueMember,
  RunningMode,
  RunningSession,
  Standing,
  TeamStanding,
} from "@/lib/league-types";
import { formatDistance, formatDuration, getInitials } from "@/lib/league-utils";

function toIsoFromLocalDateTime(localDateTime: string): string | undefined {
  const value = localDateTime.trim();
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

function formatSideNames(match: LeagueMatch, side: "A" | "B"): string {
  const names = match.participants
    .filter((participant) => participant.team === side)
    .map((participant) => participant.name || "Anonymous")
    .join(" & ");
  return names || `Side ${side}`;
}

export default function LeagueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leagueId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [league, setLeague] = useState<League | null>(null);
  const [members, setMembers] = useState<LeagueMember[]>([]);
  const [matches, setMatches] = useState<LeagueMatch[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [teamStandings, setTeamStandings] = useState<TeamStanding[]>([]);
  const [runningMode, setRunningMode] = useState<RunningMode>("personal_progress");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [reviewingSubmissionId, setReviewingSubmissionId] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [leagueInvites, setLeagueInvites] = useState<LeagueInvite[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmailInput, setInviteEmailInput] = useState("");
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [sendingInvites, setSendingInvites] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [runningSessions, setRunningSessions] = useState<RunningSession[]>([]);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [submittingRunSessionId, setSubmittingRunSessionId] = useState<string | null>(null);
  const [reviewingRunId, setReviewingRunId] = useState<string | null>(null);
  const [finalizingSessionId, setFinalizingSessionId] = useState<string | null>(null);
  const [creatingSession, setCreatingSession] = useState(false);
  const [resolvingFixtureId, setResolvingFixtureId] = useState<string | null>(null);
  const [showCreateSessionModal, setShowCreateSessionModal] = useState(false);
  const [createSessionWeek, setCreateSessionWeek] = useState("");
  const [createSessionDistance, setCreateSessionDistance] = useState("5000");
  const [createSessionStart, setCreateSessionStart] = useState("");
  const [createSessionDeadline, setCreateSessionDeadline] = useState("");
  const [runEntrySession, setRunEntrySession] = useState<RunningSession | null>(null);
  const [runEntryMinutes, setRunEntryMinutes] = useState("");
  const [runEntrySeconds, setRunEntrySeconds] = useState("");
  const [runEntryDistanceMeters, setRunEntryDistanceMeters] = useState("");
  const [rejectSubmissionMatch, setRejectSubmissionMatch] = useState<LeagueMatch | null>(null);
  const [rejectSubmissionReason, setRejectSubmissionReason] = useState("");
  const [rejectRunTarget, setRejectRunTarget] = useState<{
    sessionId: string;
    runId: string;
    runnerName: string;
  } | null>(null);
  const [rejectRunReason, setRejectRunReason] = useState("");
  const [resolveMatchTarget, setResolveMatchTarget] = useState<LeagueMatch | null>(null);
  const [resolveWinner, setResolveWinner] = useState<"A" | "B">("A");
  const [resolveReason, setResolveReason] = useState("");
  const [assignedTeams, setAssignedTeams] = useState<AssignedTeamPair[]>([]);
  const [unpairedAssignedMemberIds, setUnpairedAssignedMemberIds] = useState<string[]>([]);
  const [showAssignedTeamsModal, setShowAssignedTeamsModal] = useState(false);
  const [assignedTeamDrafts, setAssignedTeamDrafts] = useState<
    Array<{ playerAId: string; playerBId: string }>
  >([]);
  const [assignedTeamsError, setAssignedTeamsError] = useState<string | null>(null);
  const [savingAssignedTeams, setSavingAssignedTeams] = useState(false);
  const [submitResultMatch, setSubmitResultMatch] = useState<LeagueMatch | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [ownerViewMode, setOwnerViewMode] = useState<"owner" | "participant">("owner");

  useEffect(() => {
    if (!inviteSuccess) return;
    if (!inviteSuccess.toLowerCase().includes("copied")) return;

    const timeout = window.setTimeout(() => {
      setInviteSuccess(null);
    }, 2500);

    return () => window.clearTimeout(timeout);
  }, [inviteSuccess]);

  useEffect(() => {
    if (!successMessage) return;
    const timeout = window.setTimeout(() => setSuccessMessage(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [successMessage]);

  const loadWorkflowFixtures = useCallback(
    async (accessToken: string): Promise<LeagueMatch[]> => {
      try {
        const response = await fetch(`${getApiBaseUrl()}/api/leagues/${leagueId}/fixtures`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) return [];
        const data = (await response.json()) as { fixtures?: ApiFixture[] };
        return mapFixturesToLegacyMatches(data.fixtures || []);
      } catch {
        return [];
      }
    },
    [leagueId]
  );

  const loadBackendStandings = useCallback(
    async (accessToken: string): Promise<ApiStandingsResponse | null> => {
      try {
        const response = await fetch(
          `${getApiBaseUrl()}/api/leagues/${leagueId}/standings`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) return null;
        return (await response.json()) as ApiStandingsResponse;
      } catch {
        return null;
      }
    },
    [leagueId]
  );

  const loadLeagueInvites = useCallback(
    async (accessToken: string): Promise<ApiInvitesResponse | null> => {
      try {
        const response = await fetch(
          `${getApiBaseUrl()}/api/leagues/${leagueId}/invites`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        if (!response.ok) return null;
        return (await response.json()) as ApiInvitesResponse;
      } catch {
        return null;
      }
    },
    [leagueId]
  );

  const loadRunningSessions = useCallback(
    async (accessToken: string): Promise<RunningSession[]> => {
      try {
        const response = await fetch(
          `${getApiBaseUrl()}/api/leagues/${leagueId}/sessions`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        if (!response.ok) return [];
        const data = (await response.json()) as ApiRunningSessionsResponse;
        return data.sessions || [];
      } catch {
        return [];
      }
    },
    [leagueId]
  );

  const loadAssignedTeams = useCallback(
    async (accessToken: string): Promise<ApiAssignedTeamsResponse | null> => {
      try {
        const response = await fetch(
          `${getApiBaseUrl()}/api/leagues/${leagueId}/teams/assigned`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        if (!response.ok) return null;
        return (await response.json()) as ApiAssignedTeamsResponse;
      } catch {
        return null;
      }
    },
    [leagueId]
  );

  const currentMember = members.find((m) => m.user_id === user?.id);
  const isOwnerOrAdmin =
    currentMember?.role === "owner" || currentMember?.role === "admin";
  const isMember = !!currentMember;
  const isFull = members.length >= (league?.max_members || 0);
  const isRacketLeague =
    league?.scoring_format === "singles" || league?.scoring_format === "doubles";
  const isPickleballLeague = league?.sport_type === "pickleball";
  const isDoubles = league?.scoring_format === "doubles";
  const isAssignedDoubles = isDoubles && league?.rotation_type === "assigned";
  const isRunningLeague = league?.sport_type === "running";
  const emailRecipientCount = members.filter((m) => m.user_id !== user?.id).length;
  const ownerCanToggleToParticipantView =
    isOwnerOrAdmin &&
    !!user?.id &&
    matches.some((match) =>
      match.participants.some((participant) => participant.user_id === user.id)
    );

  useEffect(() => {
    if (!ownerCanToggleToParticipantView && ownerViewMode !== "owner") {
      setOwnerViewMode("owner");
    }
  }, [ownerCanToggleToParticipantView, ownerViewMode]);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      setLoading(true);
      setStandings([]);
      setTeamStandings([]);
      setRunningSessions([]);
      setSessionsError(null);
      setRunningMode("personal_progress");
      setAssignedTeams([]);
      setUnpairedAssignedMemberIds([]);
      setAssignedTeamsError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      // Get league
      const { data: leagueData, error: leagueError } = await supabase
        .from("leagues")
        .select("*")
        .eq("id", leagueId)
        .single();

      if (leagueError || !leagueData) {
        setError("League not found");
        setLoading(false);
        return;
      }

      setLeague(leagueData);
      setRunningMode(getRunningModeFromRules(leagueData.rules_jsonb));

      // Get members
      const { data: membersData } = await supabase
        .from("league_members")
        .select("id, user_id, role, joined_at")
        .eq("league_id", leagueId);
      const currentRole = membersData?.find((member) => member.user_id === user?.id)?.role;
      const canManageInvites = currentRole === "owner" || currentRole === "admin";
      if (!canManageInvites) {
        setInviteCode("");
        setLeagueInvites([]);
      }

      let memberProfiles: { id: string; name: string | null; avatar_url: string | null }[] = [];

      if (membersData && membersData.length > 0) {
        const userIds = membersData.map((m) => m.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, name, avatar_url")
          .in("id", userIds);

        memberProfiles = profiles || [];

        const membersWithInfo = membersData.map((m) => {
          const profile = memberProfiles.find((p) => p.id === m.user_id);
          return {
            ...m,
            name: profile?.name ?? null,
            avatar_url: profile?.avatar_url ?? null,
          };
        });

        setMembers(membersWithInfo);
      }

      // Get legacy matches/results (existing v1 data)
      const { data: matchesData } = await supabase
        .from("league_matches")
        .select("*")
        .eq("league_id", leagueId)
        .order("created_at", { ascending: false });

      let legacyMatchesWithParticipants: LeagueMatch[] = [];
      if (matchesData && matchesData.length > 0) {
        const matchIds = matchesData.map((m) => m.id);
        const { data: participantsData } = await supabase
          .from("match_participants")
          .select("match_id, user_id, team, score, time_seconds, points, set_scores")
          .in("match_id", matchIds);

        // Get participant names
        const pUserIds = [
          ...new Set(participantsData?.map((p) => p.user_id) || []),
        ];
        const { data: pProfiles } = await supabase
          .from("profiles")
          .select("id, name, avatar_url")
          .in("id", pUserIds.length > 0 ? pUserIds : ["_"]);

        const matchesWithParticipants: LeagueMatch[] = matchesData.map((match) => ({
          ...match,
          source: "legacy",
          workflow_status: undefined,
          latest_submission: null,
          participants: (participantsData || [])
            .filter((p) => p.match_id === match.id)
            .map((p) => ({
              ...p,
              name: pProfiles?.find((pr) => pr.id === p.user_id)?.name ?? null,
            })),
        }));

        legacyMatchesWithParticipants = matchesWithParticipants;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const workflowMatches = session?.access_token
        ? await loadWorkflowFixtures(session.access_token)
        : [];

      setMatches(mergeWorkflowMatches(legacyMatchesWithParticipants, workflowMatches));

      if (session?.access_token) {
        const backendStandings = await loadBackendStandings(session.access_token);
        if (backendStandings?.standings) {
          setStandings(backendStandings.standings);
        }
        if (backendStandings?.teamStandings) {
          setTeamStandings(backendStandings.teamStandings);
        }
        if (
          backendStandings?.runningMode === "absolute_performance" ||
          backendStandings?.runningMode === "personal_progress"
        ) {
          setRunningMode(backendStandings.runningMode);
        }

        if (leagueData.sport_type === "running") {
          const sessions = await loadRunningSessions(session.access_token);
          setRunningSessions(sessions);
        }

        if (
          leagueData.scoring_format === "doubles" &&
          leagueData.rotation_type === "assigned" &&
          currentRole
        ) {
          const assignedTeamData = await loadAssignedTeams(session.access_token);
          if (assignedTeamData) {
            setAssignedTeams(assignedTeamData.pairs || []);
            setUnpairedAssignedMemberIds(assignedTeamData.unpairedMemberIds || []);
          }
        }

        if (canManageInvites) {
          const inviteData = await loadLeagueInvites(session.access_token);
          if (inviteData?.inviteCode) {
            setInviteCode(inviteData.inviteCode);
            setLeagueInvites(inviteData.invites || []);
          }
        }
      }

      setLoading(false);
    }

    fetchData();
  }, [leagueId, loadWorkflowFixtures, loadBackendStandings, loadLeagueInvites, loadRunningSessions, loadAssignedTeams]);

  async function handleGenerateSchedule() {
    if (!league || !user) return;

    setGenerating(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setError("You must be logged in to generate schedule.");
      setGenerating(false);
      return;
    }

    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/leagues/${leagueId}/schedule/generate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error || "Failed to generate schedule");
        setGenerating(false);
        return;
      }

      const workflowMatches = await loadWorkflowFixtures(session.access_token);
      setMatches((prev) => mergeWorkflowMatches(prev, workflowMatches));
      const backendStandings = await loadBackendStandings(session.access_token);
      if (backendStandings?.standings) {
        setStandings(backendStandings.standings);
      }
      if (backendStandings?.teamStandings) {
        setTeamStandings(backendStandings.teamStandings);
      }
      if (
        backendStandings?.runningMode === "absolute_performance" ||
        backendStandings?.runningMode === "personal_progress"
      ) {
        setRunningMode(backendStandings.runningMode);
      }
      if (isRunningLeague) {
        const sessions = await loadRunningSessions(session.access_token);
        setRunningSessions(sessions);
      }
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Failed to generate schedule");
    } finally {
      setGenerating(false);
    }
  }

  async function handleReviewSubmission(
    match: LeagueMatch,
    decision: "confirm" | "reject",
    reason?: string
  ) {
    if (!match.latest_submission?.id) return;

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setError("You must be logged in to review results.");
      return;
    }

    setReviewingSubmissionId(match.latest_submission.id);
    setError(null);

    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/fixtures/${match.id}/results/confirm`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            submissionId: match.latest_submission.id,
            decision,
            reason,
          }),
        }
      );

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error || "Failed to review result submission");
        return;
      }

      const workflowMatches = await loadWorkflowFixtures(session.access_token);
      setMatches((prev) => mergeWorkflowMatches(prev, workflowMatches));
      const backendStandings = await loadBackendStandings(session.access_token);
      if (backendStandings?.standings) {
        setStandings(backendStandings.standings);
      }
      if (backendStandings?.teamStandings) {
        setTeamStandings(backendStandings.teamStandings);
      }
      if (
        backendStandings?.runningMode === "absolute_performance" ||
        backendStandings?.runningMode === "personal_progress"
      ) {
        setRunningMode(backendStandings.runningMode);
      }
    } catch (reviewError) {
      setError(
        reviewError instanceof Error
          ? reviewError.message
          : "Failed to review result submission"
      );
    } finally {
      setReviewingSubmissionId(null);
    }
  }

  function openRejectSubmissionModal(match: LeagueMatch) {
    setRejectSubmissionMatch(match);
    setRejectSubmissionReason("");
  }

  async function handleSubmitSubmissionRejection() {
    if (!rejectSubmissionMatch) return;
    await handleReviewSubmission(
      rejectSubmissionMatch,
      "reject",
      rejectSubmissionReason.trim() || undefined
    );
    setRejectSubmissionMatch(null);
  }

  async function handleCopyInviteCode() {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      setInviteSuccess("Invite code copied.");
    } catch {
      setInviteError("Unable to copy invite code.");
    }
  }

  async function handleCopyInviteLink() {
    if (!league || !inviteCode) return;
    const link = `${window.location.origin}/leagues/join?leagueId=${league.id}&code=${inviteCode}`;
    try {
      await navigator.clipboard.writeText(link);
      setInviteSuccess("Invite link copied.");
    } catch {
      setInviteError("Unable to copy invite link.");
    }
  }

  function openInviteModal() {
    setInviteError(null);
    setInviteSuccess(null);
    setInviteEmailInput("");
    setInviteEmails([]);
    setShowInviteModal(true);
  }

  function closeInviteModal() {
    if (sendingInvites) return;
    setShowInviteModal(false);
    setInviteEmailInput("");
    setInviteEmails([]);
  }

  function addInviteEmailFromInput() {
    const tokens = inviteEmailInput
      .split(/[\s,;]+/)
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);

    if (tokens.length === 0) return;

    const valid = tokens.filter((email) => EMAIL_REGEX.test(email));
    if (valid.length === 0) {
      setInviteError("Enter a valid email address.");
      return;
    }

    setInviteEmails((prev) => [...new Set([...prev, ...valid])]);
    setInviteEmailInput("");

    if (valid.length < tokens.length) {
      setInviteError("Some entries were skipped because they are invalid.");
    } else {
      setInviteError(null);
    }
  }

  function removeInviteEmail(email: string) {
    setInviteEmails((prev) => prev.filter((item) => item !== email));
  }

  async function handleSendInvites() {
    if (!league || !isOwnerOrAdmin) return;
    const pendingTokens = inviteEmailInput
      .split(/[\s,;]+/)
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
    const pendingValid = pendingTokens.filter((email) => EMAIL_REGEX.test(email));
    const emails = [...new Set([...inviteEmails, ...pendingValid])];

    if (pendingTokens.length > 0 && pendingValid.length === 0 && emails.length === 0) {
      setInviteError("Enter a valid email address.");
      return;
    }

    if (emails.length === 0) {
      setInviteError("Add at least one email.");
      return;
    }

    setSendingInvites(true);
    setInviteError(null);
    setInviteSuccess(null);

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setInviteError("You must be logged in.");
      setSendingInvites(false);
      return;
    }

    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/leagues/${league.id}/invites`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ emails }),
        }
      );

      const data = (await response.json().catch(() => null)) as ApiInvitesResponse | { error?: string } | null;
      if (!response.ok) {
        setInviteError((data as { error?: string } | null)?.error || "Failed to send invites.");
        setSendingInvites(false);
        return;
      }

      const inviteData = data as ApiInvitesResponse;
      setInviteCode(inviteData.inviteCode || "");
      setLeagueInvites(inviteData.invites || []);
      setInviteEmailInput("");
      setInviteEmails([]);
      setShowInviteModal(false);

      const sentCount = inviteData.sent ?? 0;
      const failedCount = inviteData.failed?.length ?? 0;
      if (inviteData.emailError) {
        setInviteError(`Invites saved but emails failed: ${inviteData.emailError}`);
      } else if (failedCount > 0) {
        setInviteSuccess(`Invites saved. ${sentCount} sent, ${failedCount} failed.`);
      } else {
        setInviteSuccess(`Invites sent to ${sentCount} recipients.`);
      }
    } catch (sendError) {
      setInviteError(sendError instanceof Error ? sendError.message : "Failed to send invites.");
    } finally {
      setSendingInvites(false);
    }
  }

  async function refreshRunningData(accessToken: string) {
    const sessions = await loadRunningSessions(accessToken);
    setRunningSessions(sessions);
    const backendStandings = await loadBackendStandings(accessToken);
    if (backendStandings?.standings) {
      setStandings(backendStandings.standings);
    }
    if (backendStandings?.teamStandings) {
      setTeamStandings(backendStandings.teamStandings);
    }
    if (
      backendStandings?.runningMode === "absolute_performance" ||
      backendStandings?.runningMode === "personal_progress"
    ) {
      setRunningMode(backendStandings.runningMode);
    }
  }

  async function handleSubmitResultSuccess() {
    setSubmitResultMatch(null);
    setSuccessMessage("Result submitted successfully.");

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) return;

    const workflowMatches = await loadWorkflowFixtures(session.access_token);
    setMatches((prev) => mergeWorkflowMatches(prev, workflowMatches));
    const backendStandings = await loadBackendStandings(session.access_token);
    if (backendStandings?.standings) {
      setStandings(backendStandings.standings);
    }
    if (backendStandings?.teamStandings) {
      setTeamStandings(backendStandings.teamStandings);
    }
    if (
      backendStandings?.runningMode === "absolute_performance" ||
      backendStandings?.runningMode === "personal_progress"
    ) {
      setRunningMode(backendStandings.runningMode);
    }
  }

  function getMemberNameById(memberId: string): string {
    return members.find((member) => member.user_id === memberId)?.name || "Anonymous";
  }

  function openAssignedTeamsModal() {
    setAssignedTeamsError(null);
    if (assignedTeams.length > 0) {
      setAssignedTeamDrafts(
        assignedTeams.map((team) => ({
          playerAId: team.playerAId,
          playerBId: team.playerBId,
        }))
      );
    } else {
      setAssignedTeamDrafts([]);
    }
    setShowAssignedTeamsModal(true);
  }

  function updateAssignedTeamDraft(
    index: number,
    field: "playerAId" | "playerBId",
    value: string
  ) {
    setAssignedTeamDrafts((prev) =>
      prev.map((draft, rowIndex) =>
        rowIndex === index ? { ...draft, [field]: value } : draft
      )
    );
  }

  function addAssignedTeamDraft() {
    setAssignedTeamDrafts((prev) => [...prev, { playerAId: "", playerBId: "" }]);
  }

  function removeAssignedTeamDraft(index: number) {
    setAssignedTeamDrafts((prev) => prev.filter((_, rowIndex) => rowIndex !== index));
  }

  function isAssignedSlotTaken(
    memberId: string,
    currentIndex: number,
    currentField: "playerAId" | "playerBId"
  ): boolean {
    return assignedTeamDrafts.some((draft, rowIndex) => {
      if (rowIndex === currentIndex) {
        const otherField = currentField === "playerAId" ? "playerBId" : "playerAId";
        return draft[otherField] === memberId;
      }
      return draft.playerAId === memberId || draft.playerBId === memberId;
    });
  }

  async function handleSaveAssignedTeams() {
    if (!league || !isOwnerOrAdmin) return;

    const normalizedDrafts = assignedTeamDrafts
      .map((draft) => ({
        playerAId: draft.playerAId.trim(),
        playerBId: draft.playerBId.trim(),
      }))
      .filter((draft) => draft.playerAId || draft.playerBId);

    const used = new Set<string>();
    for (const draft of normalizedDrafts) {
      if (!draft.playerAId || !draft.playerBId) {
        setAssignedTeamsError("Each team row must have two players.");
        return;
      }
      if (draft.playerAId === draft.playerBId) {
        setAssignedTeamsError("A team cannot include the same player twice.");
        return;
      }
      if (used.has(draft.playerAId) || used.has(draft.playerBId)) {
        setAssignedTeamsError("Each member can only be in one assigned team.");
        return;
      }
      used.add(draft.playerAId);
      used.add(draft.playerBId);
    }

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setAssignedTeamsError("You must be logged in.");
      return;
    }

    setSavingAssignedTeams(true);
    setAssignedTeamsError(null);

    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/leagues/${league.id}/teams/assigned`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ pairs: normalizedDrafts }),
        }
      );

      const data = (await response.json().catch(() => null)) as
        | ApiAssignedTeamsResponse
        | { error?: string }
        | null;
      if (!response.ok) {
        setAssignedTeamsError((data as { error?: string } | null)?.error || "Failed to save teams.");
        return;
      }

      const assignedData = data as ApiAssignedTeamsResponse;
      setAssignedTeams(assignedData.pairs || []);
      setUnpairedAssignedMemberIds(assignedData.unpairedMemberIds || []);
      setShowAssignedTeamsModal(false);
    } catch (saveError) {
      setAssignedTeamsError(
        saveError instanceof Error ? saveError.message : "Failed to save teams."
      );
    } finally {
      setSavingAssignedTeams(false);
    }
  }

  function openCreateRunningSessionModal() {
    const nextWeek = (sortedRunningSessions[sortedRunningSessions.length - 1]?.week_number || 0) + 1;
    setCreateSessionWeek(String(nextWeek));
    setCreateSessionDistance("5000");
    setCreateSessionStart("");
    setCreateSessionDeadline("");
    setShowCreateSessionModal(true);
  }

  async function handleCreateRunningSession() {
    if (!league || !isOwnerOrAdmin) return;

    const weekNumber = Number.parseInt(createSessionWeek, 10);
    if (!Number.isFinite(weekNumber) || weekNumber < 1) {
      setSessionsError("Week number must be a positive integer.");
      return;
    }

    const distanceMeters = Number.parseInt(createSessionDistance, 10);
    if (!Number.isFinite(distanceMeters) || distanceMeters <= 0) {
      setSessionsError("Distance must be a positive number.");
      return;
    }
    const startsAt = toIsoFromLocalDateTime(createSessionStart);
    if (createSessionStart.trim() && !startsAt) {
      setSessionsError("Start date is invalid.");
      return;
    }

    const submissionDeadline = toIsoFromLocalDateTime(createSessionDeadline);
    if (createSessionDeadline.trim() && !submissionDeadline) {
      setSessionsError("Deadline is invalid.");
      return;
    }

    const supabase = createClient();
    const {
      data: { session: authSession },
    } = await supabase.auth.getSession();
    if (!authSession?.access_token) {
      setSessionsError("You must be logged in.");
      return;
    }

    setCreatingSession(true);
    setSessionsError(null);

    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/leagues/${league.id}/sessions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authSession.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            weekNumber,
            sessionType: "time_trial",
            distanceMeters,
            startsAt,
            submissionDeadline,
            comparisonMode: "personal_progress",
            status: "scheduled",
          }),
        }
      );
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setSessionsError(data?.error || "Failed to create session.");
        return;
      }

      const workflowMatches = await loadWorkflowFixtures(authSession.access_token);
      setMatches((prev) => mergeWorkflowMatches(prev, workflowMatches));
      await refreshRunningData(authSession.access_token);
      setShowCreateSessionModal(false);
    } catch (createError) {
      setSessionsError(createError instanceof Error ? createError.message : "Failed to create session.");
    } finally {
      setCreatingSession(false);
    }
  }

  function openRunEntryModal(session: RunningSession) {
    setRunEntrySession(session);
    const elapsedSeconds = session.my_run?.elapsed_seconds || 0;
    if (elapsedSeconds > 0) {
      const minutes = Math.floor(elapsedSeconds / 60);
      const seconds = Math.round(elapsedSeconds % 60);
      setRunEntryMinutes(String(minutes));
      setRunEntrySeconds(String(seconds).padStart(2, "0"));
    } else {
      setRunEntryMinutes("");
      setRunEntrySeconds("");
    }
    setRunEntryDistanceMeters(
      String(session.my_run?.distance_meters || session.distance_meters || 5000)
    );
  }

  async function handleSubmitRun() {
    if (!runEntrySession) return;

    const minutes = Number.parseInt(runEntryMinutes || "0", 10);
    const seconds = Number.parseInt(runEntrySeconds || "0", 10);
    if (
      !Number.isFinite(minutes) ||
      !Number.isFinite(seconds) ||
      minutes < 0 ||
      seconds < 0 ||
      seconds > 59
    ) {
      setSessionsError("Enter a valid time in MM:SS format.");
      return;
    }

    const elapsedSeconds = minutes * 60 + seconds;
    if (elapsedSeconds <= 0) {
      setSessionsError("Elapsed time must be greater than 0.");
      return;
    }

    const distanceMeters = Number.parseInt(runEntryDistanceMeters, 10);
    if (!Number.isFinite(distanceMeters) || distanceMeters <= 0) {
      setSessionsError("Distance must be a positive number.");
      return;
    }

    const supabase = createClient();
    const {
      data: { session: authSession },
    } = await supabase.auth.getSession();
    if (!authSession?.access_token) {
      setSessionsError("You must be logged in.");
      return;
    }

    setSubmittingRunSessionId(runEntrySession.id);
    setSessionsError(null);

    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/sessions/${runEntrySession.id}/runs/submit`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authSession.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            elapsedSeconds,
            distanceMeters,
          }),
        }
      );

      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setSessionsError(data?.error || "Failed to submit run.");
        return;
      }

      const workflowMatches = await loadWorkflowFixtures(authSession.access_token);
      setMatches((prev) => mergeWorkflowMatches(prev, workflowMatches));
      await refreshRunningData(authSession.access_token);
      setRunEntrySession(null);
    } catch (submitError) {
      setSessionsError(submitError instanceof Error ? submitError.message : "Failed to submit run.");
    } finally {
      setSubmittingRunSessionId(null);
    }
  }

  async function handleReviewRun(
    runningSessionId: string,
    runId: string,
    decision: "approve" | "reject",
    note?: string
  ) {
    const supabase = createClient();
    const {
      data: { session: authSession },
    } = await supabase.auth.getSession();
    if (!authSession?.access_token) {
      setSessionsError("You must be logged in.");
      return;
    }

    setReviewingRunId(runId);
    setSessionsError(null);

    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/sessions/${runningSessionId}/runs/${runId}/review`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authSession.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ decision, note }),
        }
      );
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setSessionsError(data?.error || "Failed to review run.");
        return;
      }
      await refreshRunningData(authSession.access_token);
    } catch (reviewError) {
      setSessionsError(reviewError instanceof Error ? reviewError.message : "Failed to review run.");
    } finally {
      setReviewingRunId(null);
    }
  }

  function openRejectRunModal(sessionId: string, runId: string, runnerName: string) {
    setRejectRunTarget({ sessionId, runId, runnerName });
    setRejectRunReason("");
  }

  async function handleSubmitRunRejection() {
    if (!rejectRunTarget) return;
    await handleReviewRun(
      rejectRunTarget.sessionId,
      rejectRunTarget.runId,
      "reject",
      rejectRunReason.trim() || undefined
    );
    setRejectRunTarget(null);
  }

  async function handleFinalizeRunningSession(runningSessionId: string) {
    const supabase = createClient();
    const {
      data: { session: authSession },
    } = await supabase.auth.getSession();
    if (!authSession?.access_token) {
      setSessionsError("You must be logged in.");
      return;
    }

    setFinalizingSessionId(runningSessionId);
    setSessionsError(null);
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/sessions/${runningSessionId}/finalize`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authSession.access_token}`,
          },
        }
      );
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setSessionsError(data?.error || "Failed to finalize session.");
        return;
      }

      const workflowMatches = await loadWorkflowFixtures(authSession.access_token);
      setMatches((prev) => mergeWorkflowMatches(prev, workflowMatches));
      await refreshRunningData(authSession.access_token);
    } catch (finalizeError) {
      setSessionsError(
        finalizeError instanceof Error ? finalizeError.message : "Failed to finalize session."
      );
    } finally {
      setFinalizingSessionId(null);
    }
  }

  function openResolveDisputeModal(match: LeagueMatch) {
    setResolveMatchTarget(match);
    setResolveWinner("A");
    setResolveReason("");
  }

  async function handleResolveDisputedFixture() {
    if (!resolveMatchTarget) return;
    const supabase = createClient();
    const {
      data: { session: authSession },
    } = await supabase.auth.getSession();
    if (!authSession?.access_token) {
      setError("You must be logged in.");
      return;
    }

    setResolvingFixtureId(resolveMatchTarget.id);
    setError(null);
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/fixtures/${resolveMatchTarget.id}/results/resolve`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authSession.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            payload: { winner: resolveWinner },
            reason: resolveReason.trim() || undefined,
          }),
        }
      );
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(data?.error || "Failed to resolve disputed fixture.");
        return;
      }

      const workflowMatches = await loadWorkflowFixtures(authSession.access_token);
      setMatches((prev) => mergeWorkflowMatches(prev, workflowMatches));
      const backendStandings = await loadBackendStandings(authSession.access_token);
      if (backendStandings?.standings) {
        setStandings(backendStandings.standings);
      }
      if (backendStandings?.teamStandings) {
        setTeamStandings(backendStandings.teamStandings);
      }
      if (
        backendStandings?.runningMode === "absolute_performance" ||
        backendStandings?.runningMode === "personal_progress"
      ) {
        setRunningMode(backendStandings.runningMode);
      }
      setResolveMatchTarget(null);
    } catch (resolveError) {
      setError(
        resolveError instanceof Error
          ? resolveError.message
          : "Failed to resolve disputed fixture."
      );
    } finally {
      setResolvingFixtureId(null);
    }
  }

  async function handleJoin() {
    if (!user) {
      router.push("/login");
      return;
    }

    setJoining(true);
    const supabase = createClient();

    await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          name: user.user_metadata?.name || null,
          avatar_url: user.user_metadata?.avatar_url || null,
        },
        { onConflict: "id" }
      );

    const { error } = await supabase.from("league_members").insert({
      league_id: leagueId,
      user_id: user.id,
      role: "member",
    });

    if (error) {
      setError(error.message);
      setJoining(false);
      return;
    }

    setMembers((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        user_id: user.id,
        role: "member",
        joined_at: new Date().toISOString(),
        name: user.user_metadata?.name || null,
        avatar_url: user.user_metadata?.avatar_url || null,
      },
    ]);
    setJoining(false);
  }

  async function handleLeave() {
    if (!user) return;

    setLeaving(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("league_members")
      .delete()
      .eq("league_id", leagueId)
      .eq("user_id", user.id);

    if (error) {
      setError(error.message);
      setLeaving(false);
      return;
    }

    setMembers((prev) => prev.filter((m) => m.user_id !== user.id));
    setLeaving(false);
  }

  async function handleDelete() {
    if (!user || !league || currentMember?.role !== "owner") return;
    setDeleting(true);
    setError(null);

    const supabase = createClient();

    // Delete match participants first (FK dependency)
    const matchIds = matches.map((m) => m.id);
    if (matchIds.length > 0) {
      await supabase.from("match_participants").delete().in("match_id", matchIds);
    }

    // Delete matches
    await supabase.from("league_matches").delete().eq("league_id", leagueId);

    // Delete members
    await supabase.from("league_members").delete().eq("league_id", leagueId);

    // Delete the league
    const { error: deleteError } = await supabase
      .from("leagues")
      .delete()
      .eq("id", leagueId)
      .eq("creator_id", user.id);

    if (deleteError) {
      setError(deleteError.message);
      setDeleting(false);
      return;
    }

    router.push("/leagues");
  }

  function openEmailModal() {
    if (!league) return;
    setEmailError(null);
    setEmailSuccess(null);
    setEmailSubject((prev) => prev || `League Update: ${league.name}`);
    setEmailMessage((prev) => prev || "");
    setShowEmailModal(true);
  }

  function closeEmailModal() {
    setShowEmailModal(false);
    setEmailError(null);
    setEmailSuccess(null);
  }

  async function handleSendEmail() {
    if (!league || !user) return;
    const trimmedSubject = emailSubject.trim();
    const trimmedMessage = emailMessage.trim();

    if (!trimmedSubject || !trimmedMessage) {
      setEmailError("Subject and message are required.");
      return;
    }

    if (emailRecipientCount === 0) {
      setEmailError("No members to email yet.");
      return;
    }

    setSendingEmail(true);
    setEmailError(null);
    setEmailSuccess(null);

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setEmailError("You must be logged in to send emails.");
      setSendingEmail(false);
      return;
    }

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/email/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          type: "league",
          id: league.id,
          subject: trimmedSubject,
          message: trimmedMessage,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setEmailError(data?.error || "Failed to send email.");
        setSendingEmail(false);
        return;
      }

      const data = await response.json();
      const failedCount = data?.failed?.length || 0;
      const successText = failedCount
        ? `Sent to ${data.sent} members (${failedCount} failed).`
        : `Sent to ${data.sent} members.`;
      setEmailSuccess(successText);
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : "Failed to send email.");
    } finally {
      setSendingEmail(false);
    }
  }

  const completedMatches = matches.filter((m) => m.status === "completed");
  const scheduledMatches = matches.filter((m) => m.status === "scheduled");
  const pendingReviewMatches = matches.filter(
    (match) =>
      match.source === "workflow" &&
      match.latest_submission?.status === "pending" &&
      match.latest_submission.submitted_by !== user?.id &&
      match.workflow_status !== "cancelled"
  );
  const sortedRunningSessions = [...runningSessions].sort(
    (a, b) => (a.week_number ?? 10_000) - (b.week_number ?? 10_000)
  );
  const ownerMember = members.find((member) => member.role === "owner") ?? members[0] ?? null;
  const isParticipantView =
    isMember &&
    (!isOwnerOrAdmin ||
      (ownerCanToggleToParticipantView && ownerViewMode === "participant"));
  const showRecordResultsAction = isOwnerOrAdmin;
  const showManageTeamsAction = isOwnerOrAdmin && isAssignedDoubles;
  const showEmailMembersAction = currentMember?.role === "owner";
  const showDeleteLeagueAction = currentMember?.role === "owner";
  const hasSecondaryLeagueActionPair = showManageTeamsAction && showEmailMembersAction;
  const participantRecentResults = user?.id
    ? completedMatches.filter((match) =>
        match.participants.some((participant) => participant.user_id === user.id)
      )
    : [];
  const displayedRecentResults = isParticipantView
    ? (participantRecentResults.length > 0 ? participantRecentResults : completedMatches).slice(0, 3)
    : [];
  const displayedPendingReviewMatches = isParticipantView && user?.id
      ? pendingReviewMatches.filter((match) =>
          match.participants.some((participant) => participant.user_id === user.id)
        )
      : isOwnerOrAdmin
        ? pendingReviewMatches
      : [];
  const participantScheduledMatches = user?.id
    ? scheduledMatches.filter((match) =>
        match.participants.some((participant) => participant.user_id === user.id)
      )
    : [];
  const participantCurrentMatches = participantScheduledMatches.filter((match) => {
    const statusKey =
      match.source === "workflow" && match.workflow_status
        ? match.workflow_status
        : "scheduled";
    return (
      statusKey === "awaiting_confirmation" ||
      statusKey === "disputed" ||
      match.latest_submission?.status === "pending"
    );
  });
  const participantNextMatches = participantScheduledMatches
    .filter(
      (match) =>
        !participantCurrentMatches.some((currentMatch) => currentMatch.id === match.id)
    )
    .sort((left, right) => {
      const leftTime = left.match_date
        ? new Date(left.match_date).getTime()
        : Number.MAX_SAFE_INTEGER;
      const rightTime = right.match_date
        ? new Date(right.match_date).getTime()
        : Number.MAX_SAFE_INTEGER;
      return leftTime - rightTime;
    });
  const displayedUpcomingMatches = isParticipantView
    ? [...participantCurrentMatches, ...participantNextMatches].slice(0, 2)
    : scheduledMatches;
  const hasRecentResults = isParticipantView && displayedRecentResults.length > 0;
  const hasPendingResultReviews = displayedPendingReviewMatches.length > 0;
  const hasUpcomingMatches = displayedUpcomingMatches.length > 0;
  const recentResultsSpanClass = isParticipantView
    ? (hasPendingResultReviews ? "md:col-span-8" : "md:col-span-12")
    : "md:col-span-5";
  const upcomingMatchesSpanClass = isParticipantView
    ? "md:col-span-5"
    : (hasPendingResultReviews ? "md:col-span-8" : "md:col-span-12");
  const isRunningProgressMode = isRunningLeague && runningMode === "personal_progress";
  const hasConfiguredAssignedTeams = !isAssignedDoubles || assignedTeams.length >= 2;
  const canGenerateSchedule =
    isOwnerOrAdmin &&
    ((isRacketLeague &&
      scheduledMatches.length === 0 &&
      (isDoubles ? members.length >= 4 && hasConfiguredAssignedTeams : members.length >= 2)) ||
      (isRunningLeague && sortedRunningSessions.length === 0 && members.length >= 1));
  const hasLeagueActions =
    showRecordResultsAction ||
    canGenerateSchedule ||
    showManageTeamsAction ||
    showEmailMembersAction ||
    showDeleteLeagueAction;

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 animate-pulse">
          <div className="h-10 w-60 bg-zinc-200 rounded-xl mb-6" />
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3].map((item) => (
                <div key={`league-detail-skeleton-main-${item}`} className="rounded-2xl border border-zinc-200 p-6">
                  <div className="h-5 w-36 bg-zinc-200 rounded mb-4" />
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-zinc-100 rounded" />
                    <div className="h-4 w-5/6 bg-zinc-100 rounded" />
                    <div className="h-4 w-3/5 bg-zinc-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div key={`league-detail-skeleton-side-${item}`} className="rounded-2xl border border-zinc-200 p-6">
                  <div className="h-4 w-24 bg-zinc-200 rounded mb-3" />
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-zinc-100 rounded" />
                    <div className="h-3 w-4/5 bg-zinc-100 rounded" />
                    <div className="h-3 w-2/3 bg-zinc-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !league) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="text-6xl mb-4">😕</div>
            <p className="text-zinc-500 mb-4">{error || "League not found"}</p>
            <Link
              href="/leagues"
              className="text-orange-500 hover:underline font-medium"
            >
              Back to leagues
            </Link>
          </div>
        </div>
      </div>
    );
  }

  function formatMatchResult(match: LeagueMatch) {
    if (!league) return null;
    const fmt = league.scoring_format;

    if (fmt === "singles" || fmt === "doubles") {
      const teamA = match.participants.filter((p) => p.team === "A");
      const teamB = match.participants.filter((p) => p.team === "B");
      const sideANames = teamA.map((p) => p.name || "?").join(" & ");
      const sideBNames = teamB.map((p) => p.name || "?").join(" & ");

      // Check for set scores
      const setScores = teamA[0]?.set_scores;
      if (setScores && setScores.sets && setScores.sets.length > 0) {
        const setDisplay = setScores.sets.map((s) => `${s[0]}-${s[1]}`).join(", ");
        return (
          <div className="text-sm">
            <div className="flex items-center gap-2">
              <span className={`font-medium ${match.winner === "A" ? "text-orange-500" : "text-zinc-900"}`}>
                {sideANames}
              </span>
              <span className="text-zinc-400">vs</span>
              <span className={`font-medium ${match.winner === "B" ? "text-orange-500" : "text-zinc-900"}`}>
                {sideBNames}
              </span>
            </div>
            <div className="text-xs text-zinc-500 mt-1">{setDisplay}</div>
          </div>
        );
      }

      return (
        <div className="text-sm flex items-center gap-2">
          <span className={`font-medium ${match.winner === "A" ? "text-orange-500" : "text-zinc-900"}`}>
            {sideANames}
          </span>
          <span className="text-zinc-400">vs</span>
          <span className={`font-medium ${match.winner === "B" ? "text-orange-500" : "text-zinc-900"}`}>
            {sideBNames}
          </span>
          {match.winner && (
            <span className="px-2 py-0.5 bg-orange-50 text-orange-600 text-xs font-medium rounded-full ml-auto">
              {match.winner === "A" ? sideANames : sideBNames} won
            </span>
          )}
        </div>
      );
    }

    if (fmt === "team_vs_team") {
      const teamA = match.participants.filter((p) => p.team === "A");
      const teamB = match.participants.filter((p) => p.team === "B");
      const scoreA = teamA[0]?.score ?? 0;
      const scoreB = teamB[0]?.score ?? 0;
      return (
        <div className="text-sm">
          <span className="font-medium text-zinc-900">
            Team A ({teamA.map((p) => p.name || "?").join(", ")})
          </span>
          <span className="mx-2 font-bold text-orange-500">
            {scoreA} - {scoreB}
          </span>
          <span className="font-medium text-zinc-900">
            Team B ({teamB.map((p) => p.name || "?").join(", ")})
          </span>
        </div>
      );
    }

    if (fmt === "individual_time") {
      const sorted = [...match.participants].sort(
        (a, b) => (a.time_seconds ?? 0) - (b.time_seconds ?? 0)
      );
      return (
        <div className="text-sm space-y-1">
          {sorted.map((p, i) => {
            const mins = Math.floor((p.time_seconds ?? 0) / 60);
            const secs = Math.round((p.time_seconds ?? 0) % 60);
            return (
              <div key={p.user_id} className="flex justify-between">
                <span>
                  {i + 1}. {p.name || "?"}
                </span>
                <span className="text-zinc-500">
                  {mins}:{secs.toString().padStart(2, "0")}
                </span>
              </div>
            );
          })}
        </div>
      );
    }

    if (fmt === "individual_points") {
      const sorted = [...match.participants].sort(
        (a, b) => (b.points ?? 0) - (a.points ?? 0)
      );
      return (
        <div className="text-sm space-y-1">
          {sorted.map((p, i) => (
            <div key={p.user_id} className="flex justify-between">
              <span>
                {i + 1}. {p.name || "?"}
              </span>
              <span className="text-zinc-500">{p.points ?? 0} pts</span>
            </div>
          ))}
        </div>
      );
    }

    return null;
  }

  const sportDisplayName =
    league.sport_type.charAt(0).toUpperCase() + league.sport_type.slice(1);

  return (
    <div className="min-h-screen bg-white">

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Link
          href="/leagues"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-colors text-sm font-medium mb-4 sm:mb-6"
        >
          <span className="text-zinc-500">←</span>
          <span>Back to leagues</span>
        </Link>

        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {successMessage}
          </div>
        )}

        <div className="grid xl:grid-cols-12 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-min">
            {/* Header Card */}
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

              <div className="p-5 sm:p-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 mb-2">{league.name}</h1>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  {league.description || "Competitive season play with structured matches, standings, and weekly momentum."}
                </p>
                {ownerCanToggleToParticipantView && (
                  <div className="mt-4">
                    <div className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 p-1">
                      <button
                        type="button"
                        onClick={() => setOwnerViewMode("owner")}
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
                        onClick={() => setOwnerViewMode("participant")}
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
                    <div className="text-sm font-semibold text-zinc-900">{FORMAT_LABELS[league.scoring_format]}</div>
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

            {/* Standings */}
            <div
              className={`${
                hasRecentResults ? "md:col-span-7" : "md:col-span-12"
              } bg-white rounded-2xl border border-zinc-200 p-6`}
            >
              <h2 className="text-lg font-semibold text-zinc-900 mb-4">
                {isDoubles ? "Team Standings" : "Standings"}
              </h2>

              {/* Doubles Team Standings */}
              {isDoubles && teamStandings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200">
                        <th className="text-left py-2 px-2 text-zinc-500 font-medium">#</th>
                        <th className="text-left py-2 px-2 text-zinc-500 font-medium">Team</th>
                        <th className="text-center py-2 px-2 text-zinc-500 font-medium">P</th>
                        <th className="text-center py-2 px-2 text-zinc-500 font-medium">W</th>
                        <th className="text-center py-2 px-2 text-zinc-500 font-medium">L</th>
                        <th className="text-center py-2 px-2 text-zinc-500 font-medium">Win%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamStandings.map((s) => (
                        <tr key={s.team_key} className="border-b border-zinc-100 last:border-0">
                          <td className="py-2 px-2 font-medium text-zinc-900">{s.rank}</td>
                          <td className="py-2 px-2 font-medium text-zinc-900">
                            {s.player_names.join(" & ")}
                          </td>
                          <td className="py-2 px-2 text-center text-zinc-600">{s.played}</td>
                          <td className="py-2 px-2 text-center text-zinc-600">{s.wins}</td>
                          <td className="py-2 px-2 text-center text-zinc-600">{s.losses}</td>
                          <td className="py-2 px-2 text-center font-bold text-orange-500">{s.winPct}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}

              {/* Individual Standings (singles or doubles individual view, or legacy) */}
              {(!isDoubles || teamStandings.length === 0) && standings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200">
                        <th className="text-left py-2 px-2 text-zinc-500 font-medium">#</th>
                        <th className="text-left py-2 px-2 text-zinc-500 font-medium">Player</th>
                        <th className="text-center py-2 px-2 text-zinc-500 font-medium">P</th>
                        {(isRacketLeague || league.scoring_format === "team_vs_team") && (
                          <>
                            <th className="text-center py-2 px-2 text-zinc-500 font-medium">W</th>
                            {league.scoring_format === "team_vs_team" && (
                              <th className="text-center py-2 px-2 text-zinc-500 font-medium">D</th>
                            )}
                            <th className="text-center py-2 px-2 text-zinc-500 font-medium">L</th>
                          </>
                        )}
                        {league.scoring_format === "team_vs_team" && (
                          <th className="text-center py-2 px-2 text-zinc-500 font-medium">GD</th>
                        )}
                        <th className="text-center py-2 px-2 text-zinc-500 font-medium">
                          {isRacketLeague
                            ? "Win%"
                            : league.scoring_format === "individual_points"
                            ? "Total"
                            : isRunningProgressMode
                            ? "Progress"
                            : "Pts"}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.map((s) => (
                        <tr
                          key={s.user_id}
                          className="border-b border-zinc-100 last:border-0"
                        >
                          <td className="py-2 px-2 font-medium text-zinc-900">{s.rank}</td>
                          <td className="py-2 px-2">
                            <Link
                              href={`/users/${s.user_id}`}
                              className="flex items-center gap-2 hover:text-orange-500"
                            >
                              {s.avatar_url ? (
                                <Image
                                  src={s.avatar_url}
                                  alt={s.name || "Player"}
                                  width={24}
                                  height={24}
                                  className="w-6 h-6 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-zinc-300 text-white text-xs flex items-center justify-center font-medium">
                                  {getInitials(s.name)}
                                </div>
                              )}
                              <span className="font-medium text-zinc-900">
                                {s.name || "Anonymous"}
                              </span>
                            </Link>
                          </td>
                          <td className="py-2 px-2 text-center text-zinc-600">{s.played}</td>
                          {(isRacketLeague || league.scoring_format === "team_vs_team") && (
                            <>
                              <td className="py-2 px-2 text-center text-zinc-600">{s.wins}</td>
                              {league.scoring_format === "team_vs_team" && (
                                <td className="py-2 px-2 text-center text-zinc-600">{s.draws}</td>
                              )}
                              <td className="py-2 px-2 text-center text-zinc-600">{s.losses}</td>
                            </>
                          )}
                          {league.scoring_format === "team_vs_team" && (
                            <td className="py-2 px-2 text-center text-zinc-600">
                              {s.goalDifference > 0 ? `+${s.goalDifference}` : s.goalDifference}
                            </td>
                          )}
                          <td className="py-2 px-2 text-center font-bold text-orange-500">
                            {isRacketLeague
                              ? s.played > 0 ? `${Math.round((s.wins / s.played) * 100)}%` : "0%"
                              : league.scoring_format === "individual_points"
                              ? s.totalPoints
                              : isRunningProgressMode
                              ? `${s.points > 0 ? "+" : ""}${s.points.toFixed(1)}%`
                              : s.points}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}

              {standings.length === 0 && teamStandings.length === 0 && (
                <p className="text-zinc-500 text-center py-4">
                  No results yet. Record matches to see standings.
                </p>
              )}

              {/* Individual standings below team standings for doubles */}
              {isDoubles && teamStandings.length > 0 && standings.length > 0 && (
                <div className="mt-6 pt-6 border-t border-zinc-200">
                  <h3 className="text-sm font-medium text-zinc-500 mb-3">Individual Records</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-200">
                          <th className="text-left py-2 px-2 text-zinc-500 font-medium">#</th>
                          <th className="text-left py-2 px-2 text-zinc-500 font-medium">Player</th>
                          <th className="text-center py-2 px-2 text-zinc-500 font-medium">P</th>
                          <th className="text-center py-2 px-2 text-zinc-500 font-medium">W</th>
                          <th className="text-center py-2 px-2 text-zinc-500 font-medium">L</th>
                          <th className="text-center py-2 px-2 text-zinc-500 font-medium">Win%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {standings.map((s) => (
                          <tr key={s.user_id} className="border-b border-zinc-100 last:border-0">
                            <td className="py-2 px-2 font-medium text-zinc-900">{s.rank}</td>
                            <td className="py-2 px-2">
                              <Link href={`/users/${s.user_id}`} className="flex items-center gap-2 hover:text-orange-500">
                                {s.avatar_url ? (
                                  <Image src={s.avatar_url} alt={s.name || "Player"} width={24} height={24} className="w-6 h-6 rounded-full object-cover" />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-zinc-300 text-white text-xs flex items-center justify-center font-medium">{getInitials(s.name)}</div>
                                )}
                                <span className="font-medium text-zinc-900">{s.name || "Anonymous"}</span>
                              </Link>
                            </td>
                            <td className="py-2 px-2 text-center text-zinc-600">{s.played}</td>
                            <td className="py-2 px-2 text-center text-zinc-600">{s.wins}</td>
                            <td className="py-2 px-2 text-center text-zinc-600">{s.losses}</td>
                            <td className="py-2 px-2 text-center font-bold text-orange-500">
                              {s.played > 0 ? `${Math.round((s.wins / s.played) * 100)}%` : "0%"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Results */}
            {hasRecentResults && (
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
                          {formatMatchResult(match)}
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
            )}

            {isRunningLeague && (
              <div
                className={`${
                  isParticipantView ? "order-2" : ""
                } md:col-span-12 bg-white rounded-2xl border border-zinc-200 p-6`}
              >
                <div className="flex items-center justify-between gap-2 mb-4">
                  <h2 className="text-lg font-semibold text-zinc-900">
                    Running Sessions
                  </h2>
                  {isOwnerOrAdmin && (
                    <button
                      type="button"
                      onClick={openCreateRunningSessionModal}
                      disabled={creatingSession}
                      className="px-3 py-1.5 border border-zinc-200 text-zinc-700 rounded-full text-xs font-medium hover:bg-zinc-50 transition-colors disabled:opacity-50"
                    >
                      {creatingSession ? "Saving..." : "Create Session"}
                    </button>
                  )}
                </div>

                {sessionsError && (
                  <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
                    {sessionsError}
                  </div>
                )}

                {sortedRunningSessions.length === 0 ? (
                  <p className="text-sm text-zinc-500">No sessions yet.</p>
                ) : (
                  <div className="space-y-3">
                    {sortedRunningSessions.map((session) => {
                      const visibleRuns = session.runs
                        .filter((run) => run.status !== "rejected")
                        .sort((a, b) => a.elapsed_seconds - b.elapsed_seconds);
                      const pendingRuns = session.runs.filter((run) => run.status === "submitted");
                      const isSubmitting = submittingRunSessionId === session.id;
                      const isFinalizing = finalizingSessionId === session.id;

                      return (
                        <div key={session.id} className="p-4 bg-zinc-50 rounded-xl">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-sm font-medium text-zinc-900">
                              {session.week_number ? `Week ${session.week_number}` : "Session"}
                            </span>
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700 capitalize">
                              {session.status}
                            </span>
                          </div>
                          <div className="text-xs text-zinc-500 mb-2">
                            {session.distance_meters ? formatDistance(session.distance_meters) : "Distance TBD"} ·{" "}
                            {session.session_type.replace("_", " ")}
                            {session.submission_deadline && (
                              <> · Deadline {new Date(session.submission_deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</>
                            )}
                          </div>

                          <div className="text-xs text-zinc-600 mb-2">
                            {session.my_run ? (
                              <>
                                Your run: {formatDuration(session.my_run.elapsed_seconds)} ({formatDistance(session.my_run.distance_meters)})
                              </>
                            ) : (
                              "No run submitted yet."
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2 mb-2">
                            <button
                              type="button"
                              onClick={() => openRunEntryModal(session)}
                              disabled={isSubmitting || session.status === "finalized" || session.status === "closed"}
                              className="px-3 py-1.5 bg-zinc-900 text-white rounded-full text-xs font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
                            >
                              {isSubmitting ? "Saving..." : session.my_run ? "Update My Run" : "Submit My Run"}
                            </button>

                            {isOwnerOrAdmin && session.status !== "finalized" && (
                              <button
                                type="button"
                                onClick={() => handleFinalizeRunningSession(session.id)}
                                disabled={isFinalizing}
                                className="px-3 py-1.5 border border-zinc-300 text-zinc-700 rounded-full text-xs font-medium hover:bg-zinc-100 transition-colors disabled:opacity-50"
                              >
                                {isFinalizing ? "Finalizing..." : "Finalize Session"}
                              </button>
                            )}
                          </div>

                          {visibleRuns.length > 0 && (
                            <div className="space-y-1">
                              {visibleRuns.slice(0, 5).map((run, index) => (
                                <div key={run.id} className="flex items-center justify-between text-xs text-zinc-600">
                                  <span>
                                    {index + 1}. {run.name || "Anonymous"}
                                  </span>
                                  <span>{formatDuration(run.elapsed_seconds)}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {isOwnerOrAdmin && pendingRuns.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-zinc-200 space-y-2">
                              <div className="text-xs font-medium text-zinc-500">Pending reviews</div>
                              {pendingRuns.map((run) => (
                                <div key={run.id} className="flex items-center justify-between gap-2 text-xs">
                                  <span className="text-zinc-700">
                                    {run.name || "Anonymous"} · {formatDuration(run.elapsed_seconds)}
                                  </span>
                                  <div className="flex gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleReviewRun(session.id, run.id, "approve")}
                                      disabled={reviewingRunId === run.id}
                                      className="px-2 py-1 bg-emerald-600 text-white rounded-full font-medium disabled:opacity-50"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => openRejectRunModal(session.id, run.id, run.name || "Anonymous")}
                                      disabled={reviewingRunId === run.id}
                                      className="px-2 py-1 border border-red-300 text-red-600 rounded-full font-medium disabled:opacity-50"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Pending Result Reviews */}
            {hasPendingResultReviews && (
              <div
                className={`${
                  hasUpcomingMatches ? "md:col-span-4" : "md:col-span-12"
                } ${
                  isParticipantView ? "order-3" : ""
                } bg-white rounded-2xl border border-zinc-200 p-6`}
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
                          <div className="text-sm text-zinc-500">
                            {sideANames} vs {sideBNames}
                          </div>
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
                            <div className="text-xs text-zinc-500 mb-1">
                              Submitted result:
                            </div>
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
                            onClick={() => handleReviewSubmission(match, "confirm")}
                            disabled={isReviewing}
                            className="px-3 py-1.5 bg-green-600 text-white rounded-full text-xs font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            {isReviewing ? "Processing..." : "Confirm"}
                          </button>
                          <button
                            type="button"
                            onClick={() => openRejectSubmissionModal(match)}
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
            )}

            {/* Upcoming Matches */}
            {hasUpcomingMatches && (
              <div
                className={`${
                  isParticipantView ? "order-1" : ""
                } ${upcomingMatchesSpanClass} bg-white rounded-2xl border border-zinc-200 p-6`}
              >
                <div className="flex items-center justify-between mb-4 gap-2">
                  <h2 className="text-lg font-semibold text-zinc-900">
                    {isParticipantView ? "Current & Next Matches" : "Upcoming Matches"}
                  </h2>
                </div>
                <div className="space-y-3">
                  {displayedUpcomingMatches.map((match) => {
                    const teamA = match.participants.filter((p) => p.team === "A");
                    const teamB = match.participants.filter((p) => p.team === "B");
                    const sideANames = teamA.map((p) => p.name || "?").join(" & ");
                    const sideBNames = teamB.map((p) => p.name || "?").join(" & ");
                    const statusKey =
                      match.source === "workflow" && match.workflow_status
                        ? match.workflow_status
                        : "scheduled";
                    const statusLabel = statusKey.replace(/_/g, " ");
                    const isDisputed = statusKey === "disputed";
                    const userIsParticipant = !!user?.id
                      && match.participants.some((participant) => participant.user_id === user.id);
                    const isWorkflow = match.source === "workflow";
                    const todayLocal = new Date();
                    todayLocal.setHours(0, 0, 0, 0);
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
                      match.latest_submission?.status === "pending" &&
                      match.latest_submission.submitted_by !== user?.id;
                    const isReviewing = reviewingSubmissionId === match.latest_submission?.id;
                    return (
                      <div
                        key={match.id}
                        className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-4 shadow-sm"
                      >
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500/70 via-amber-400/70 to-zinc-300/70" />
                        <div className="pt-1.5">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-zinc-900">
                              {match.week_number
                                ? `Week ${match.week_number}`
                                : "Scheduled Match"}
                            </span>
                            <StatusBadge status={statusKey} label={statusLabel} />
                          </div>
                          {teamA.length > 0 && teamB.length > 0 && (
                            <div className="text-sm text-zinc-500">
                              {sideANames} vs {sideBNames}
                            </div>
                          )}
                          {match.match_date && (
                            <span className="text-xs text-zinc-400">
                              {new Date(match.match_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          )}
                          <div className="mt-2 flex flex-wrap gap-2">
                            {canSubmit && (
                              <button
                                type="button"
                                onClick={() => setSubmitResultMatch(match)}
                                className="inline-flex items-center justify-center px-4 py-2 bg-orange-500 text-white rounded-full text-sm font-semibold hover:bg-orange-600 transition-colors"
                              >
                                Submit Result
                              </button>
                            )}
                            {isOpponentWithPendingSubmission && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleReviewSubmission(match, "confirm")}
                                  disabled={isReviewing}
                                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-full text-xs font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                                >
                                  {isReviewing ? "Processing..." : "Confirm"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openRejectSubmissionModal(match)}
                                  disabled={isReviewing}
                                  className="px-3 py-1.5 border border-red-300 text-red-600 rounded-full text-xs font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {isOwnerOrAdmin && isDisputed && (
                              <button
                                type="button"
                                onClick={() => openResolveDisputeModal(match)}
                                disabled={resolvingFixtureId === match.id}
                                className="px-3 py-1.5 border border-red-300 text-red-600 rounded-full text-xs font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                              >
                                {resolvingFixtureId === match.id ? "Resolving..." : "Resolve Dispute"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="xl:col-span-4 flex flex-col gap-5 xl:sticky xl:top-6 h-fit">
            <div className="bg-white rounded-3xl border border-zinc-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-zinc-900">
                  Players ({members.length}/{league.max_members})
                </h2>
                {isOwnerOrAdmin && (
                  <button
                    type="button"
                    onClick={openInviteModal}
                    className="w-8 h-8 rounded-full bg-orange-500 text-white text-lg leading-none hover:bg-orange-600 transition-colors"
                    aria-label="Invite players"
                  >
                    +
                  </button>
                )}
              </div>

              <div className="flex items-center flex-wrap gap-2">
                {members.slice(0, 6).map((member) => (
                  <Link
                    key={member.id}
                    href={`/users/${member.user_id}`}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-full overflow-hidden bg-zinc-200 ring-2 ring-white"
                    title={member.name || "Anonymous"}
                  >
                    {member.avatar_url ? (
                      <Image
                        src={member.avatar_url}
                        alt={member.name || "Member"}
                        width={36}
                        height={36}
                        className="w-9 h-9 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-semibold text-zinc-700">{getInitials(member.name)}</span>
                    )}
                  </Link>
                ))}
                {members.length > 6 && (
                  <span className="inline-flex items-center justify-center h-9 px-2 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-medium text-zinc-600">
                    +{members.length - 6}
                  </span>
                )}
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {!isMember && !isFull && (
                  <button
                    onClick={handleJoin}
                    disabled={joining}
                    className="sm:col-span-2 inline-flex items-center justify-center px-4 py-2.5 bg-zinc-900 text-white rounded-full text-sm font-semibold hover:bg-zinc-800 transition-all disabled:opacity-50"
                  >
                    {joining ? "Joining..." : "Join League"}
                  </button>
                )}

                {isMember && currentMember?.role !== "owner" && (
                  <button
                    onClick={handleLeave}
                    disabled={leaving}
                    className="sm:col-span-2 inline-flex items-center justify-center px-4 py-2.5 border border-zinc-300 text-zinc-700 rounded-full text-sm font-medium hover:bg-zinc-50 transition-colors disabled:opacity-50"
                  >
                    {leaving ? "Leaving..." : "Leave League"}
                  </button>
                )}

                {isOwnerOrAdmin && (
                  <button
                    type="button"
                    onClick={handleCopyInviteLink}
                    disabled={!inviteCode}
                    className="inline-flex items-center justify-center px-3 py-2 border border-zinc-200 text-zinc-700 rounded-full text-sm font-medium hover:bg-zinc-50 transition-colors disabled:opacity-50"
                  >
                    Share Invite Link
                  </button>
                )}
                {isOwnerOrAdmin && (
                  <button
                    type="button"
                    onClick={openInviteModal}
                    className="inline-flex items-center justify-center px-3 py-2 border border-zinc-200 text-zinc-700 rounded-full text-sm font-medium hover:bg-zinc-50 transition-colors"
                  >
                    Invite by Email
                  </button>
                )}
              </div>

              {!isMember && isFull && (
                <p className="text-sm text-zinc-500 mt-3">This league is full.</p>
              )}

              {!user && (
                <p className="text-sm text-zinc-500 mt-3">
                  <Link href="/login" className="text-orange-500 hover:underline">
                    Log in
                  </Link>{" "}
                  to join this league.
                </p>
              )}
            </div>

            {hasLeagueActions && (
              <div className="bg-white rounded-3xl border border-zinc-200 p-5">
                <h2 className="text-sm font-semibold text-zinc-900 mb-3">League Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {showRecordResultsAction && (
                  <Link
                    href={`/leagues/${league.id}/record`}
                    className="sm:col-span-2 inline-flex items-center justify-center px-3 py-2.5 bg-orange-500 text-white rounded-full text-sm font-medium hover:bg-orange-600 transition-colors"
                  >
                    Record Results
                  </Link>
                  )}

                {canGenerateSchedule && (
                  <button
                    onClick={handleGenerateSchedule}
                    disabled={generating}
                    className="sm:col-span-2 inline-flex items-center justify-center px-3 py-2.5 border border-orange-500 text-orange-500 rounded-full text-sm font-medium hover:bg-orange-50 transition-colors disabled:opacity-50"
                  >
                    {generating
                      ? "Generating..."
                      : isRunningLeague
                      ? "Generate Sessions"
                      : "Generate Schedule"}
                  </button>
                )}

                {showManageTeamsAction && (
                  <button
                    onClick={openAssignedTeamsModal}
                    className={`${
                      hasSecondaryLeagueActionPair ? "" : "sm:col-span-2"
                    } inline-flex items-center justify-center px-3 py-2 border border-zinc-200 text-zinc-700 rounded-full text-sm font-medium hover:bg-zinc-50 transition-colors`}
                  >
                    Manage Teams
                  </button>
                )}

                {showEmailMembersAction && (
                  <button
                    onClick={openEmailModal}
                    className={`${
                      hasSecondaryLeagueActionPair ? "" : "sm:col-span-2"
                    } inline-flex items-center justify-center px-3 py-2 border border-zinc-200 text-zinc-700 rounded-full text-sm font-medium hover:bg-zinc-50 transition-colors`}
                  >
                    Email Members
                  </button>
                )}

                  {showDeleteLeagueAction && (
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="sm:col-span-2 inline-flex items-center justify-center px-3 py-2 border border-red-300 text-red-500 rounded-full text-sm font-medium hover:bg-red-50 transition-colors"
                  >
                    Delete League
                  </button>
                  )}
                </div>
              </div>
            )}

            {ownerMember && (
              <div className="bg-zinc-50 rounded-3xl border border-zinc-200 p-5">
                <h2 className="text-xs font-semibold tracking-wide uppercase text-zinc-500 mb-3">Hosted by</h2>
                <Link href={`/users/${ownerMember.user_id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  {ownerMember.avatar_url ? (
                    <Image
                      src={ownerMember.avatar_url}
                      alt={ownerMember.name || "Host"}
                      width={44}
                      height={44}
                      className="w-11 h-11 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-zinc-300 text-white flex items-center justify-center font-semibold text-sm">
                      {getInitials(ownerMember.name)}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-zinc-900">{ownerMember.name || "League Owner"}</p>
                    <p className="text-xs text-zinc-500 capitalize">{ownerMember.role}</p>
                  </div>
                </Link>
                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  <div className="bg-white border border-zinc-200 rounded-2xl px-2 py-2">
                    <div className="text-xs text-zinc-500">Results</div>
                    <div className="text-sm font-semibold text-zinc-900">{completedMatches.length}</div>
                  </div>
                  <div className="bg-white border border-zinc-200 rounded-2xl px-2 py-2">
                    <div className="text-xs text-zinc-500">Pending</div>
                    <div className="text-sm font-semibold text-zinc-900">{pendingReviewMatches.length}</div>
                  </div>
                  <div className="bg-white border border-zinc-200 rounded-2xl px-2 py-2">
                    <div className="text-xs text-zinc-500">Capacity</div>
                    <div className="text-sm font-semibold text-zinc-900">{members.length}/{league.max_members}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-3xl border border-zinc-200 p-5">
              <h2 className="text-sm font-semibold text-zinc-900 mb-3">
                Members Directory
              </h2>
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {members.map((member) => (
                  <Link
                    key={member.id}
                    href={`/users/${member.user_id}`}
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                  >
                    {member.avatar_url ? (
                      <Image
                        src={member.avatar_url}
                        alt={member.name || "Member"}
                        width={36}
                        height={36}
                        className="w-9 h-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-zinc-300 text-white flex items-center justify-center font-medium text-sm">
                        {getInitials(member.name)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-zinc-900 text-sm truncate">
                        {member.name || "Anonymous"}
                        {member.user_id === user?.id && (
                          <span className="ml-1 text-xs text-orange-500">
                            (You)
                          </span>
                        )}
                      </p>
                    </div>
                    {member.role !== "member" && (
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${
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
            </div>

            {isOwnerOrAdmin && (
              <div className="bg-white rounded-3xl border border-zinc-200 p-5 space-y-4">
                <h2 className="text-sm font-semibold text-zinc-900">Invite Console</h2>

                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-900 tracking-wide">
                    {inviteCode ? (
                      inviteCode
                    ) : (
                      <span className="block h-5 w-24 bg-zinc-200 rounded animate-pulse" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyInviteCode}
                    disabled={!inviteCode}
                    className="px-3 py-2 border border-zinc-200 text-zinc-700 rounded-xl text-sm font-medium hover:bg-zinc-50 transition-colors disabled:opacity-50"
                  >
                    Copy Code
                  </button>
                </div>

                {inviteError && (
                  <p className="text-xs text-red-500">{inviteError}</p>
                )}
                {inviteSuccess && (
                  <p className="text-xs text-emerald-600">{inviteSuccess}</p>
                )}

                {leagueInvites.length > 0 && (
                  <div className="border-t border-zinc-100 pt-3">
                    <h3 className="text-xs font-medium text-zinc-500 mb-2">Recent invites</h3>
                    <div className="space-y-2">
                      {leagueInvites.slice(0, 5).map((invite) => (
                        <div key={invite.id} className="flex items-center justify-between gap-2 text-xs">
                          <span className="text-zinc-700 truncate">{invite.email}</span>
                          <StatusBadge status={invite.status} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {isAssignedDoubles && (
              <div className="bg-white rounded-3xl border border-zinc-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-medium text-zinc-500">Assigned Teams</h2>
                  {isOwnerOrAdmin && (
                    <button
                      type="button"
                      onClick={openAssignedTeamsModal}
                      className="text-xs font-medium text-orange-500 hover:underline"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {assignedTeams.length === 0 ? (
                  <p className="text-sm text-zinc-500">
                    No fixed teams saved yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {assignedTeams.map((team, index) => (
                      <div
                        key={`${team.playerAId}-${team.playerBId}-${index}`}
                        className="p-2.5 rounded-xl bg-zinc-50 text-sm text-zinc-700"
                      >
                        <span className="font-medium">{team.playerAName || getMemberNameById(team.playerAId)}</span>
                        <span className="mx-1.5 text-zinc-400">&</span>
                        <span className="font-medium">{team.playerBName || getMemberNameById(team.playerBId)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {unpairedAssignedMemberIds.length > 0 && (
                  <div className="mt-3 text-xs text-zinc-500">
                    Unpaired:{" "}
                    {unpairedAssignedMemberIds
                      .map((memberId) => getMemberNameById(memberId))
                      .join(", ")}
                  </div>
                )}

                {assignedTeams.length < 2 && (
                  <p className="mt-3 text-xs text-amber-600">
                    Add at least 2 teams before generating the schedule.
                  </p>
                )}
              </div>
            )}

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

            {/* League Info */}
            <div className="bg-white rounded-3xl border border-zinc-200 p-6">
              <h2 className="text-sm font-medium text-zinc-500 mb-4">
                League Info
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Match Type</span>
                  <span className="font-medium text-zinc-900">
                    {FORMAT_LABELS[league.scoring_format]}
                  </span>
                </div>
                {isDoubles && league.rotation_type && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Rotation</span>
                    <span className="font-medium text-zinc-900">
                      {ROTATION_LABELS[league.rotation_type]}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-zinc-500">Type</span>
                  <span className="font-medium text-zinc-900 capitalize">
                    {league.league_type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Max Members</span>
                  <span className="font-medium text-zinc-900">
                    {league.max_members}
                  </span>
                </div>
                {league.start_date && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Start Date</span>
                    <span className="font-medium text-zinc-900">
                      {new Date(league.start_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {league.season_weeks && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Season Length</span>
                    <span className="font-medium text-zinc-900">
                      {league.season_weeks} weeks
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-zinc-500">Status</span>
                  <span className="font-medium text-zinc-900 capitalize">
                    {league.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {submitResultMatch && (
        <SubmitResultModal
          isOpen={true}
          onClose={() => setSubmitResultMatch(null)}
          fixtureId={submitResultMatch.id}
          weekNumber={submitResultMatch.week_number}
          sportType={league.sport_type}
          sideA={submitResultMatch.participants
            .filter((participant) => participant.team === "A")
            .map((participant) => ({ userId: participant.user_id, name: participant.name }))}
          sideB={submitResultMatch.participants
            .filter((participant) => participant.team === "B")
            .map((participant) => ({ userId: participant.user_id, name: participant.name }))}
          onSuccess={handleSubmitResultSuccess}
        />
      )}

      <CreateSessionModal
        isOpen={showCreateSessionModal}
        week={createSessionWeek}
        distance={createSessionDistance}
        start={createSessionStart}
        deadline={createSessionDeadline}
        creating={creatingSession}
        onWeekChange={setCreateSessionWeek}
        onDistanceChange={setCreateSessionDistance}
        onStartChange={setCreateSessionStart}
        onDeadlineChange={setCreateSessionDeadline}
        onCreate={handleCreateRunningSession}
        onClose={() => setShowCreateSessionModal(false)}
      />

      <RunEntryModal
        isOpen={!!runEntrySession}
        weekLabel={runEntrySession?.week_number ? `Week ${runEntrySession.week_number}` : "Session"}
        minutes={runEntryMinutes}
        seconds={runEntrySeconds}
        distance={runEntryDistanceMeters}
        submitting={submittingRunSessionId === runEntrySession?.id}
        onMinutesChange={setRunEntryMinutes}
        onSecondsChange={setRunEntrySeconds}
        onDistanceChange={setRunEntryDistanceMeters}
        onSubmit={handleSubmitRun}
        onClose={() => setRunEntrySession(null)}
      />

      <RejectModal
        isOpen={!!rejectSubmissionMatch}
        title="Reject Submission"
        reason={rejectSubmissionReason}
        submitting={reviewingSubmissionId === rejectSubmissionMatch?.latest_submission?.id}
        onReasonChange={setRejectSubmissionReason}
        onClose={() => setRejectSubmissionMatch(null)}
        onConfirm={handleSubmitSubmissionRejection}
      />

      <RejectModal
        isOpen={!!rejectRunTarget}
        title="Reject Run"
        subtitle={rejectRunTarget?.runnerName}
        reason={rejectRunReason}
        submitting={reviewingRunId === rejectRunTarget?.runId}
        onReasonChange={setRejectRunReason}
        onClose={() => setRejectRunTarget(null)}
        onConfirm={handleSubmitRunRejection}
      />

      <ResolveDisputeModal
        isOpen={!!resolveMatchTarget}
        sideALabel={resolveMatchTarget ? formatSideNames(resolveMatchTarget, "A") : "Side A"}
        sideBLabel={resolveMatchTarget ? formatSideNames(resolveMatchTarget, "B") : "Side B"}
        winner={resolveWinner}
        reason={resolveReason}
        resolving={resolvingFixtureId === resolveMatchTarget?.id}
        onWinnerChange={setResolveWinner}
        onReasonChange={setResolveReason}
        onResolve={handleResolveDisputedFixture}
        onClose={() => setResolveMatchTarget(null)}
      />

      <ManageTeamsModal
        isOpen={showAssignedTeamsModal}
        saving={savingAssignedTeams}
        members={members}
        drafts={assignedTeamDrafts}
        error={assignedTeamsError}
        onClose={() => setShowAssignedTeamsModal(false)}
        onSave={handleSaveAssignedTeams}
        onAddDraft={addAssignedTeamDraft}
        onRemoveDraft={removeAssignedTeamDraft}
        onUpdateDraft={updateAssignedTeamDraft}
        isAssignedSlotTaken={isAssignedSlotTaken}
      />

      <DeleteLeagueModal
        isOpen={showDeleteModal}
        leagueName={league.name}
        memberCount={members.length}
        deleting={deleting}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
      />

      <EmailMembersModal
        isOpen={showEmailModal && !!league}
        recipientCount={emailRecipientCount}
        subject={emailSubject}
        message={emailMessage}
        sending={sendingEmail}
        error={emailError}
        success={emailSuccess}
        onSubjectChange={setEmailSubject}
        onMessageChange={setEmailMessage}
        onSend={handleSendEmail}
        onClose={closeEmailModal}
      />

      <InviteModal
        isOpen={showInviteModal && !!league}
        emailInput={inviteEmailInput}
        emails={inviteEmails}
        sending={sendingInvites}
        error={inviteError}
        success={inviteSuccess}
        onEmailInputChange={setInviteEmailInput}
        onAddEmail={addInviteEmailFromInput}
        onRemoveEmail={removeInviteEmail}
        onSend={handleSendInvites}
        onClose={closeInviteModal}
      />
    </div>
  );
}
