"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { getApiBaseUrl } from "@/lib/api";
import type { User } from "@supabase/supabase-js";
import type {
  ApiFixture as WorkflowFixture,
  League as LeagueDetails,
  LeagueMatch,
  LeagueMember,
} from "@/lib/league-types";

export type League = Pick<
  LeagueDetails,
  "id" | "name" | "sport_type" | "scoring_format" | "league_type" | "season_weeks" | "rotation_type"
>;

export type MemberInfo = Pick<LeagueMember, "user_id" | "role" | "name" | "avatar_url">;

export type ScheduledMatch = Pick<
  LeagueMatch,
  "id" | "week_number" | "match_date" | "status" | "source"
> & {
  participants: Array<{
    user_id: string;
    team: string | null;
    name: string | null;
  }>;
};

type ApiFixture = Pick<
  WorkflowFixture,
  "id" | "week_number" | "starts_at" | "status" | "participants"
>;

export type SetScore = {
  a: string;
  b: string;
};

function mapFixtureToScheduledMatch(fixture: ApiFixture): ScheduledMatch {
  return {
    id: fixture.id,
    week_number: fixture.week_number,
    match_date: fixture.starts_at ? fixture.starts_at.split("T")[0] : null,
    status: fixture.status,
    source: "workflow",
    participants: (fixture.participants || []).map((participant) => ({
      user_id: participant.user_id,
      team: participant.side,
      name: participant.name,
    })),
  };
}

export function useRecordResultsPage() {
  const params = useParams();
  const router = useRouter();
  const leagueId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [league, setLeague] = useState<League | null>(null);
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [scheduledMatches, setScheduledMatches] = useState<ScheduledMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);

  // Tennis flow state
  const [selectedMatchId, setSelectedMatchId] = useState<string>("");
  const [isAdHoc, setIsAdHoc] = useState(false);
  const [scoreMode, setScoreMode] = useState<"simple" | "detailed">("simple");
  const [winner, setWinner] = useState<"A" | "B" | "">("");
  const [sets, setSets] = useState<SetScore[]>([{ a: "", b: "" }]);

  // Ad-hoc match players
  const [teamAPlayers, setTeamAPlayers] = useState<string[]>([]);
  const [teamBPlayers, setTeamBPlayers] = useState<string[]>([]);

  // Legacy format state
  const [weekNumber, setWeekNumber] = useState("");
  const [matchDate, setMatchDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  // Legacy: team_vs_team
  const [teamAssignments, setTeamAssignments] = useState<{ user_id: string; team: "A" | "B" }[]>([]);
  const [scoreA, setScoreA] = useState("");
  const [scoreB, setScoreB] = useState("");

  // Legacy: individual_time
  const [timeEntries, setTimeEntries] = useState<{ user_id: string; minutes: string; seconds: string }[]>([]);
  const [selectedTimeMembers, setSelectedTimeMembers] = useState<Set<string>>(new Set());

  // Legacy: individual_points
  const [pointsEntries, setPointsEntries] = useState<{ user_id: string; points: string }[]>([]);
  const [selectedPointsMembers, setSelectedPointsMembers] = useState<Set<string>>(new Set());

  const isTennis = league?.scoring_format === "singles" || league?.scoring_format === "doubles";
  const isPickleball = league?.sport_type === "pickleball";

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);

      const { data: leagueData } = await supabase
        .from("leagues")
        .select("id, name, sport_type, scoring_format, league_type, season_weeks, rotation_type")
        .eq("id", leagueId)
        .single();

      if (!leagueData) {
        router.push("/leagues");
        return;
      }

      setLeague(leagueData);

      // Get members and check authorization
      const { data: membersData } = await supabase
        .from("league_members")
        .select("user_id, role")
        .eq("league_id", leagueId);

      const currentMember = membersData?.find((m) => m.user_id === user.id);
      if (
        !currentMember ||
        (currentMember.role !== "owner" && currentMember.role !== "admin")
      ) {
        router.push(`/leagues/${leagueId}`);
        return;
      }

      setAuthorized(true);

      // Get member profiles
      if (membersData && membersData.length > 0) {
        const userIds = membersData.map((m) => m.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, name, avatar_url")
          .in("id", userIds);

        const membersWithInfo = membersData.map((m) => ({
          user_id: m.user_id,
          role: m.role,
          name: profiles?.find((p) => p.id === m.user_id)?.name ?? null,
          avatar_url: profiles?.find((p) => p.id === m.user_id)?.avatar_url ?? null,
        }));

        setMembers(membersWithInfo);
      }

      // Get scheduled matches for tennis formats
      const isTennisFormat = leagueData.scoring_format === "singles" || leagueData.scoring_format === "doubles";
      if (isTennisFormat) {
        let allScheduledMatches: ScheduledMatch[] = [];

        const { data: matchesData } = await supabase
          .from("league_matches")
          .select("id, week_number, match_date, status")
          .eq("league_id", leagueId)
          .eq("status", "scheduled")
          .order("week_number", { ascending: true });

        if (matchesData && matchesData.length > 0) {
          const matchIds = matchesData.map((m) => m.id);
          const { data: participantsData } = await supabase
            .from("match_participants")
            .select("match_id, user_id, team")
            .in("match_id", matchIds);

          const pUserIds = [...new Set(participantsData?.map((p) => p.user_id) || [])];
          let pProfiles: { id: string; name: string | null }[] = [];
          if (pUserIds.length > 0) {
            const { data } = await supabase.from("profiles").select("id, name").in("id", pUserIds);
            pProfiles = data || [];
          }

          const matchesWithParticipants: ScheduledMatch[] = matchesData.map((match) => ({
            ...match,
            source: "legacy",
            participants: (participantsData || [])
              .filter((p) => p.match_id === match.id)
              .map((p) => ({
                ...p,
                name: pProfiles.find((pr) => pr.id === p.user_id)?.name ?? null,
              })),
          }));

          allScheduledMatches = matchesWithParticipants;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.access_token) {
          const response = await fetch(
            `${getApiBaseUrl()}/api/leagues/${leagueId}/fixtures`,
            {
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
            }
          );

          if (response.ok) {
            const data = (await response.json()) as { fixtures?: ApiFixture[] };
            const workflowMatches = (data.fixtures || [])
              .filter((fixture) => fixture.status !== "finalized" && fixture.status !== "cancelled")
              .map(mapFixtureToScheduledMatch);

            workflowMatches.forEach((workflowMatch) => {
              if (!allScheduledMatches.find((match) => match.id === workflowMatch.id)) {
                allScheduledMatches.push(workflowMatch);
              }
            });
          }
        }

        allScheduledMatches.sort(
          (a, b) => (a.week_number ?? 10_000) - (b.week_number ?? 10_000)
        );
        setScheduledMatches(allScheduledMatches);
      }

      setLoading(false);
    }

    fetchData();
  }, [leagueId, router]);

  const getMemberName = (userId: string) =>
    members.find((m) => m.user_id === userId)?.name || "Anonymous";

  // Get selected match
  const selectedMatch = scheduledMatches.find((m) => m.id === selectedMatchId);

  // Tennis match players (from schedule or ad-hoc)
  const matchTeamA = isAdHoc
    ? teamAPlayers
    : (selectedMatch?.participants.filter((p) => p.team === "A").map((p) => p.user_id) || []);
  const matchTeamB = isAdHoc
    ? teamBPlayers
    : (selectedMatch?.participants.filter((p) => p.team === "B").map((p) => p.user_id) || []);

  // Set score helpers
  function addSet() {
    setSets((prev) => [...prev, { a: "", b: "" }]);
  }

  function removeSet(index: number) {
    setSets((prev) => prev.filter((_, i) => i !== index));
  }

  function updateSet(index: number, side: "a" | "b", value: string) {
    setSets((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [side]: value } : s))
    );
  }

  // Auto-detect winner from set scores
  function getWinnerFromSets(): "A" | "B" | "" {
    let setsA = 0;
    let setsB = 0;
    for (const s of sets) {
      const a = parseInt(s.a);
      const b = parseInt(s.b);
      if (isNaN(a) || isNaN(b)) continue;
      if (a > b) setsA++;
      else if (b > a) setsB++;
    }
    if (setsA > setsB) return "A";
    if (setsB > setsA) return "B";
    return "";
  }

  // Ad-hoc player selection
  function toggleAdHocPlayer(userId: string, team: "A" | "B") {
    if (team === "A") {
      setTeamAPlayers((prev) =>
        prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
      );
      setTeamBPlayers((prev) => prev.filter((id) => id !== userId));
    } else {
      setTeamBPlayers((prev) =>
        prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
      );
      setTeamAPlayers((prev) => prev.filter((id) => id !== userId));
    }
  }

  // Legacy helpers
  function assignTeam(userId: string, team: "A" | "B") {
    setTeamAssignments((prev) => {
      const filtered = prev.filter((t) => t.user_id !== userId);
      return [...filtered, { user_id: userId, team }];
    });
  }

  function getTeam(userId: string): "A" | "B" | null {
    return teamAssignments.find((t) => t.user_id === userId)?.team ?? null;
  }

  function toggleTimeMember(userId: string) {
    setSelectedTimeMembers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
        setTimeEntries((e) => e.filter((t) => t.user_id !== userId));
      } else {
        next.add(userId);
        setTimeEntries((e) => [...e, { user_id: userId, minutes: "", seconds: "" }]);
      }
      return next;
    });
  }

  function updateTimeEntry(userId: string, field: "minutes" | "seconds", value: string) {
    setTimeEntries((prev) =>
      prev.map((t) => (t.user_id === userId ? { ...t, [field]: value } : t))
    );
  }

  function togglePointsMember(userId: string) {
    setSelectedPointsMembers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
        setPointsEntries((e) => e.filter((t) => t.user_id !== userId));
      } else {
        next.add(userId);
        setPointsEntries((e) => [...e, { user_id: userId, points: "" }]);
      }
      return next;
    });
  }

  function updatePointsEntry(userId: string, points: string) {
    setPointsEntries((prev) =>
      prev.map((t) => (t.user_id === userId ? { ...t, points } : t))
    );
  }

  function canSubmit(): boolean {
    if (!league) return false;

    if (isTennis) {
      const hasPlayers =
        matchTeamA.length > 0 && matchTeamB.length > 0;
      if (!hasPlayers && !selectedMatchId && !isAdHoc) return false;
      if (isAdHoc && !hasPlayers) return false;

      if (scoreMode === "simple") {
        return !!winner && hasPlayers;
      } else {
        const completeSets = sets.filter((s) => s.a !== "" && s.b !== "");
        const detectedWinner = getWinnerFromSets();
        return completeSets.length >= 1 && !!detectedWinner && hasPlayers;
      }
    }

    // Legacy formats
    switch (league.scoring_format) {
      case "team_vs_team": {
        const teamAMembers = teamAssignments.filter((t) => t.team === "A");
        const teamBMembers = teamAssignments.filter((t) => t.team === "B");
        return teamAMembers.length > 0 && teamBMembers.length > 0 && scoreA !== "" && scoreB !== "";
      }
      case "individual_time":
        return selectedTimeMembers.size > 0 && timeEntries.every((t) => t.minutes !== "" || t.seconds !== "");
      case "individual_points":
        return selectedPointsMembers.size > 0 && pointsEntries.every((t) => t.points !== "");
      default:
        return false;
    }
  }

  async function handleSubmit() {
    if (!canSubmit() || !league || !user) return;

    setSubmitting(true);
    setError(null);

    const supabase = createClient();

    if (isTennis) {
      const finalWinner = scoreMode === "detailed" ? getWinnerFromSets() : winner;
      if (!finalWinner) {
        setSubmitting(false);
        return;
      }

      const parsedSetScores =
        scoreMode === "detailed"
          ? sets
              .filter((s) => s.a !== "" && s.b !== "")
              .map((s) => [parseInt(s.a, 10), parseInt(s.b, 10)])
          : null;
      const setScoresData = parsedSetScores ? { sets: parsedSetScores } : null;

      if (selectedMatchId && !isAdHoc) {
        const selected = scheduledMatches.find((match) => match.id === selectedMatchId);

        if (selected?.source === "workflow") {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (!session?.access_token) {
            setError("You must be logged in to submit workflow results.");
            setSubmitting(false);
            return;
          }

          const response = await fetch(
            `${getApiBaseUrl()}/api/fixtures/${selectedMatchId}/results/submit`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${session.access_token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                payload: {
                  winner: finalWinner,
                  sets: parsedSetScores || undefined,
                  notes: notes || undefined,
                },
              }),
            }
          );

          const data = await response.json().catch(() => null);
          if (!response.ok) {
            setError(data?.error || "Failed to submit fixture result");
            setSubmitting(false);
            return;
          }
        } else {
          // Update existing scheduled match (legacy path)
          const { error: matchError } = await supabase
            .from("league_matches")
            .update({ status: "completed", winner: finalWinner })
            .eq("id", selectedMatchId);

          if (matchError) {
            setError(matchError.message);
            setSubmitting(false);
            return;
          }

          // Update participant set_scores
          if (setScoresData) {
            for (const userId of [...matchTeamA, ...matchTeamB]) {
              await supabase
                .from("match_participants")
                .update({ set_scores: setScoresData })
                .eq("match_id", selectedMatchId)
                .eq("user_id", userId);
            }
          }
        }
      } else {
        // Create ad-hoc match
        const { data: matchData, error: matchError } = await supabase
          .from("league_matches")
          .insert({
            league_id: leagueId,
            week_number: weekNumber ? parseInt(weekNumber) : null,
            match_date: matchDate || null,
            status: "completed",
            winner: finalWinner,
            notes: notes || null,
          })
          .select("id")
          .single();

        if (matchError) {
          setError(matchError.message);
          setSubmitting(false);
          return;
        }

        // Create participants
        const participantRows = [
          ...matchTeamA.map((userId) => ({
            match_id: matchData.id,
            user_id: userId,
            team: "A",
            score: null,
            time_seconds: null,
            points: null,
            set_scores: setScoresData,
          })),
          ...matchTeamB.map((userId) => ({
            match_id: matchData.id,
            user_id: userId,
            team: "B",
            score: null,
            time_seconds: null,
            points: null,
            set_scores: setScoresData,
          })),
        ];

        const { error: participantError } = await supabase
          .from("match_participants")
          .insert(participantRows);

        if (participantError) {
          setError(participantError.message);
          setSubmitting(false);
          return;
        }
      }

      router.push(`/leagues/${leagueId}`);
      return;
    }

    // Legacy flow
    const { data: matchData, error: matchError } = await supabase
      .from("league_matches")
      .insert({
        league_id: leagueId,
        week_number: weekNumber ? parseInt(weekNumber) : null,
        match_date: matchDate || null,
        status: "completed",
        notes: notes || null,
      })
      .select("id")
      .single();

    if (matchError) {
      setError(matchError.message);
      setSubmitting(false);
      return;
    }

    let participantRows: {
      match_id: string;
      user_id: string;
      team: string | null;
      score: number | null;
      time_seconds: number | null;
      points: number | null;
    }[] = [];

    if (league.scoring_format === "team_vs_team") {
      participantRows = teamAssignments.map((ta) => ({
        match_id: matchData.id,
        user_id: ta.user_id,
        team: ta.team,
        score: ta.team === "A" ? parseFloat(scoreA) : parseFloat(scoreB),
        time_seconds: null,
        points: null,
      }));
    } else if (league.scoring_format === "individual_time") {
      participantRows = timeEntries.map((te) => ({
        match_id: matchData.id,
        user_id: te.user_id,
        team: null,
        score: null,
        time_seconds: (parseInt(te.minutes) || 0) * 60 + (parseInt(te.seconds) || 0),
        points: null,
      }));
    } else if (league.scoring_format === "individual_points") {
      participantRows = pointsEntries.map((pe) => ({
        match_id: matchData.id,
        user_id: pe.user_id,
        team: null,
        score: null,
        time_seconds: null,
        points: parseFloat(pe.points),
      }));
    }

    const { error: participantError } = await supabase
      .from("match_participants")
      .insert(participantRows);

    if (participantError) {
      setError(participantError.message);
      setSubmitting(false);
      return;
    }

    router.push(`/leagues/${leagueId}`);
  }

  return {
    leagueId,
    user,
    league,
    members,
    scheduledMatches,
    loading,
    submitting,
    error,
    authorized,
    selectedMatchId,
    setSelectedMatchId,
    isAdHoc,
    setIsAdHoc,
    scoreMode,
    setScoreMode,
    winner,
    setWinner,
    sets,
    weekNumber,
    setWeekNumber,
    matchDate,
    setMatchDate,
    notes,
    setNotes,
    teamAssignments,
    scoreA,
    setScoreA,
    scoreB,
    setScoreB,
    timeEntries,
    selectedTimeMembers,
    pointsEntries,
    selectedPointsMembers,
    teamAPlayers,
    teamBPlayers,
    isTennis,
    isPickleball,
    selectedMatch,
    matchTeamA,
    matchTeamB,
    addSet,
    removeSet,
    updateSet,
    getWinnerFromSets,
    toggleAdHocPlayer,
    assignTeam,
    getTeam,
    toggleTimeMember,
    updateTimeEntry,
    togglePointsMember,
    updatePointsEntry,
    canSubmit,
    handleSubmit,
    getMemberName,
  };
}

export type UseRecordResultsPageData = ReturnType<typeof useRecordResultsPage>;
