"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { getApiBaseUrl } from "@/lib/api";
import type { User } from "@supabase/supabase-js";
import {
  EMAIL_REGEX,
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

function toIsoFromLocalDateTime(localDateTime: string): string | undefined {
  const value = localDateTime.trim();
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

export function formatSideNames(match: LeagueMatch, side: "A" | "B"): string {
  const names = match.participants
    .filter((participant) => participant.team === side)
    .map((participant) => participant.name || "Anonymous")
    .join(" & ");
  return names || `Side ${side}`;
}

export function useLeagueDetailPage() {
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
    if (!inviteCode) return;
    const link = `${window.location.origin}/leagues/join?code=${inviteCode}`;
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
  const needsTeamSetup = isAssignedDoubles && assignedTeams.length < 2 && isOwnerOrAdmin;
  const hasConfiguredAssignedTeams = !isAssignedDoubles || assignedTeams.length >= 2;
  const showGenerateSchedule =
    isOwnerOrAdmin &&
    ((isRacketLeague && scheduledMatches.length === 0) ||
      (isRunningLeague && sortedRunningSessions.length === 0));
  const canGenerateSchedule =
    showGenerateSchedule &&
    ((isRacketLeague &&
      (isDoubles ? members.length >= 4 && hasConfiguredAssignedTeams : members.length >= 2)) ||
      (isRunningLeague && members.length >= 1));
  const generateScheduleMessage =
    showGenerateSchedule && !canGenerateSchedule
      ? isRunningLeague
        ? "You need at least 1 member to generate sessions."
        : isDoubles
          ? isAssignedDoubles && assignedTeams.length < 2
            ? "Set up your doubles teams before generating the schedule."
            : members.length < 4
              ? "You need at least 4 members to generate a schedule."
              : null
          : members.length < 2
            ? "You need at least 2 members to generate a schedule."
            : null
      : null;
  const hasLeagueActions =
    showRecordResultsAction ||
    showGenerateSchedule ||
    showManageTeamsAction ||
    showEmailMembersAction ||
    showDeleteLeagueAction;

  return {
    leagueId,
    user,
    league,
    members,
    matches,
    standings,
    teamStandings,
    runningMode,
    loading,
    error,
    joining,
    leaving,
    generating,
    deleting,
    showDeleteModal,
    setShowDeleteModal,
    showEmailModal,
    setShowEmailModal,
    emailSubject,
    setEmailSubject,
    emailMessage,
    setEmailMessage,
    sendingEmail,
    emailError,
    emailSuccess,
    reviewingSubmissionId,
    setReviewingSubmissionId,
    inviteCode,
    leagueInvites,
    showInviteModal,
    setShowInviteModal,
    inviteEmailInput,
    setInviteEmailInput,
    inviteEmails,
    sendingInvites,
    inviteError,
    inviteSuccess,
    runningSessions,
    sessionsError,
    submittingRunSessionId,
    reviewingRunId,
    finalizingSessionId,
    creatingSession,
    resolvingFixtureId,
    showCreateSessionModal,
    setShowCreateSessionModal,
    createSessionWeek,
    setCreateSessionWeek,
    createSessionDistance,
    setCreateSessionDistance,
    createSessionStart,
    setCreateSessionStart,
    createSessionDeadline,
    setCreateSessionDeadline,
    runEntrySession,
    setRunEntrySession,
    runEntryMinutes,
    setRunEntryMinutes,
    runEntrySeconds,
    setRunEntrySeconds,
    runEntryDistanceMeters,
    setRunEntryDistanceMeters,
    rejectSubmissionMatch,
    setRejectSubmissionMatch,
    rejectSubmissionReason,
    setRejectSubmissionReason,
    rejectRunTarget,
    setRejectRunTarget,
    rejectRunReason,
    setRejectRunReason,
    resolveMatchTarget,
    setResolveMatchTarget,
    resolveWinner,
    setResolveWinner,
    resolveReason,
    setResolveReason,
    assignedTeams,
    unpairedAssignedMemberIds,
    showAssignedTeamsModal,
    setShowAssignedTeamsModal,
    assignedTeamDrafts,
    assignedTeamsError,
    savingAssignedTeams,
    submitResultMatch,
    setSubmitResultMatch,
    successMessage,
    ownerViewMode,
    setOwnerViewMode,
    currentMember,
    isOwnerOrAdmin,
    isMember,
    isFull,
    isRacketLeague,
    isPickleballLeague,
    isDoubles,
    isAssignedDoubles,
    isRunningLeague,
    emailRecipientCount,
    completedMatches,
    scheduledMatches,
    pendingReviewMatches,
    sortedRunningSessions,
    ownerMember,
    isParticipantView,
    showRecordResultsAction,
    showManageTeamsAction,
    showEmailMembersAction,
    showDeleteLeagueAction,
    hasSecondaryLeagueActionPair,
    displayedRecentResults,
    displayedPendingReviewMatches,
    displayedUpcomingMatches,
    hasRecentResults,
    hasPendingResultReviews,
    hasUpcomingMatches,
    recentResultsSpanClass,
    upcomingMatchesSpanClass,
    isRunningProgressMode,
    needsTeamSetup,
    ownerCanToggleToParticipantView,
    showGenerateSchedule,
    canGenerateSchedule,
    generateScheduleMessage,
    hasLeagueActions,
    handleGenerateSchedule,
    handleReviewSubmission,
    openRejectSubmissionModal,
    handleSubmitSubmissionRejection,
    handleCopyInviteCode,
    handleCopyInviteLink,
    openInviteModal,
    closeInviteModal,
    addInviteEmailFromInput,
    removeInviteEmail,
    handleSendInvites,
    handleSubmitResultSuccess,
    getMemberNameById,
    openAssignedTeamsModal,
    updateAssignedTeamDraft,
    addAssignedTeamDraft,
    removeAssignedTeamDraft,
    isAssignedSlotTaken,
    handleSaveAssignedTeams,
    openCreateRunningSessionModal,
    handleCreateRunningSession,
    openRunEntryModal,
    handleSubmitRun,
    handleReviewRun,
    openRejectRunModal,
    handleSubmitRunRejection,
    handleFinalizeRunningSession,
    openResolveDisputeModal,
    handleResolveDisputedFixture,
    handleJoin,
    handleLeave,
    handleDelete,
    openEmailModal,
    closeEmailModal,
    handleSendEmail,
  };
}

export type UseLeagueDetailPageData = ReturnType<typeof useLeagueDetailPage>;
