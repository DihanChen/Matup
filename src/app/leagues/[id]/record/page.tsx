"use client";

import Link from "next/link";
import Image from "next/image";
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
import { getInitials } from "@/lib/league-utils";

type League = Pick<
  LeagueDetails,
  "id" | "name" | "scoring_format" | "league_type" | "season_weeks" | "rotation_type"
>;

type MemberInfo = Pick<LeagueMember, "user_id" | "role" | "name" | "avatar_url">;

type ScheduledMatch = Pick<
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

type SetScore = {
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

export default function RecordResultsPage() {
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
        .select("id, name, scoring_format, league_type, season_weeks, rotation_type")
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

  if (loading || !authorized) {
    return (
      <div className="min-h-screen bg-white">
        <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div className="h-9 w-52 bg-zinc-200 rounded-xl" />
            <div className="h-8 w-8 rounded-full bg-zinc-100" />
          </div>
          <div className="rounded-2xl border border-zinc-200 p-5 sm:p-8 space-y-5">
            <div className="h-4 w-56 bg-zinc-100 rounded mx-auto" />
            <div className="h-4 w-28 bg-zinc-200 rounded" />
            <div className="h-12 w-full bg-zinc-100 rounded-xl" />
            <div className="h-4 w-28 bg-zinc-200 rounded" />
            <div className="h-12 w-full bg-zinc-100 rounded-xl" />
            <div className="h-36 w-full bg-zinc-50 rounded-xl border border-zinc-200" />
            <div className="h-12 w-full bg-zinc-200 rounded-full" />
          </div>
        </main>
      </div>
    );
  }

  if (!league) return null;

  return (
    <div className="min-h-screen bg-white">

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">Record <span className="text-orange-500">Results</span></h1>
          <Link
            href={`/leagues/${leagueId}`}
            className="text-zinc-500 hover:text-zinc-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Link>
        </div>

        <div className="bg-white p-5 sm:p-8 rounded-2xl border border-zinc-200 shadow-sm space-y-6">
          <p className="text-sm text-zinc-500 text-center">
            Recording results for{" "}
            <span className="font-medium text-zinc-900">{league.name}</span>
          </p>

          {error && (
            <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {isTennis && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700 mb-4">
              You can also submit results directly from match cards on the league page.
            </div>
          )}

          {/* Tennis Flow */}
          {isTennis && (
            <div className="space-y-6">
              {/* Step 1: Select Match */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-3">
                  Select Match
                </label>
                {scheduledMatches.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {scheduledMatches.map((match) => {
                      const teamA = match.participants.filter((p) => p.team === "A");
                      const teamB = match.participants.filter((p) => p.team === "B");
                      return (
                        <button
                          key={match.id}
                          type="button"
                          onClick={() => {
                            setSelectedMatchId(match.id);
                            setIsAdHoc(false);
                          }}
                          className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                            selectedMatchId === match.id && !isAdHoc
                              ? "border-orange-500 bg-orange-50"
                              : "border-zinc-200 hover:border-orange-300"
                          }`}
                        >
                          <div className="text-sm font-medium text-zinc-900">
                            Week {match.week_number}
                          </div>
                          <div className="text-xs text-zinc-500 mt-1">
                            {teamA.map((p) => p.name || "?").join(" & ")} vs{" "}
                            {teamB.map((p) => p.name || "?").join(" & ")}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsAdHoc(true);
                    setSelectedMatchId("");
                  }}
                  className={`w-full p-3 rounded-xl border-2 text-center transition-all ${
                    isAdHoc
                      ? "border-orange-500 bg-orange-50"
                      : "border-zinc-200 hover:border-orange-300"
                  }`}
                >
                  <div className="text-sm font-medium text-zinc-900">Ad-hoc Match</div>
                  <div className="text-xs text-zinc-500 mt-1">
                    Record an unscheduled match
                  </div>
                </button>
              </div>

              {/* Step 2: Confirm/Select Players */}
              {(selectedMatchId || isAdHoc) && (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-3">
                    {isAdHoc ? "Select Players" : "Players"}
                  </label>

                  {!isAdHoc && selectedMatch && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 rounded-xl">
                        <div className="text-xs font-medium text-blue-700 mb-2">Side A</div>
                        {selectedMatch.participants
                          .filter((p) => p.team === "A")
                          .map((p) => (
                            <div key={p.user_id} className="text-sm font-medium text-zinc-900">
                              {p.name || "?"}
                            </div>
                          ))}
                      </div>
                      <div className="p-4 bg-red-50 rounded-xl">
                        <div className="text-xs font-medium text-red-700 mb-2">Side B</div>
                        {selectedMatch.participants
                          .filter((p) => p.team === "B")
                          .map((p) => (
                            <div key={p.user_id} className="text-sm font-medium text-zinc-900">
                              {p.name || "?"}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {isAdHoc && (
                    <div className="space-y-2">
                      {members.map((member) => {
                        const inA = teamAPlayers.includes(member.user_id);
                        const inB = teamBPlayers.includes(member.user_id);
                        return (
                          <div
                            key={member.user_id}
                            className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl"
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
                              <div className="w-9 h-9 rounded-full bg-orange-500 text-white flex items-center justify-center font-medium text-sm">
                                {getInitials(member.name)}
                              </div>
                            )}
                            <span className="flex-1 font-medium text-zinc-900 text-sm">
                              {member.name || "Anonymous"}
                            </span>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => toggleAdHocPlayer(member.user_id, "A")}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                                  inA
                                    ? "bg-blue-500 text-white"
                                    : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300"
                                }`}
                              >
                                Side A
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleAdHocPlayer(member.user_id, "B")}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                                  inB
                                    ? "bg-red-500 text-white"
                                    : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300"
                                }`}
                              >
                                Side B
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {isAdHoc && (
                        <div className="grid grid-cols-2 gap-4 mt-3">
                          <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-2">
                              Week Number
                            </label>
                            <input
                              type="number"
                              value={weekNumber}
                              onChange={(e) => setWeekNumber(e.target.value)}
                              placeholder="Optional"
                              min="1"
                              className="w-full px-4 py-3 border border-zinc-300 rounded-xl bg-white text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-2">
                              Match Date
                            </label>
                            <input
                              type="date"
                              value={matchDate}
                              onChange={(e) => setMatchDate(e.target.value)}
                              className="w-full px-4 py-3 border border-zinc-300 rounded-xl bg-white text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Score */}
              {(selectedMatchId || isAdHoc) && (matchTeamA.length > 0 && matchTeamB.length > 0) && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-zinc-700">
                      Score
                    </label>
                    <div className="flex bg-zinc-100 rounded-full p-0.5">
                      <button
                        type="button"
                        onClick={() => setScoreMode("simple")}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                          scoreMode === "simple"
                            ? "bg-white text-zinc-900 shadow-sm"
                            : "text-zinc-500"
                        }`}
                      >
                        Simple
                      </button>
                      <button
                        type="button"
                        onClick={() => setScoreMode("detailed")}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                          scoreMode === "detailed"
                            ? "bg-white text-zinc-900 shadow-sm"
                            : "text-zinc-500"
                        }`}
                      >
                        {isPickleball ? "Game Scores" : "Set Scores"}
                      </button>
                    </div>
                  </div>

                  {scoreMode === "simple" ? (
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setWinner("A")}
                        className={`p-6 rounded-xl border-2 text-center transition-all ${
                          winner === "A"
                            ? "border-blue-500 bg-blue-50"
                            : "border-zinc-200 hover:border-blue-300"
                        }`}
                      >
                        <div className="text-sm font-medium text-blue-700 mb-1">Side A Wins</div>
                        <div className="text-xs text-zinc-500">
                          {matchTeamA.map((id) => getMemberName(id)).join(" & ")}
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setWinner("B")}
                        className={`p-6 rounded-xl border-2 text-center transition-all ${
                          winner === "B"
                            ? "border-red-500 bg-red-50"
                            : "border-zinc-200 hover:border-red-300"
                        }`}
                      >
                        <div className="text-sm font-medium text-red-700 mb-1">Side B Wins</div>
                        <div className="text-xs text-zinc-500">
                          {matchTeamB.map((id) => getMemberName(id)).join(" & ")}
                        </div>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-center">
                        <div className="text-xs font-medium text-blue-700 text-center">Side A</div>
                        <div></div>
                        <div className="text-xs font-medium text-red-700 text-center">Side B</div>
                        <div></div>
                      </div>
                      {sets.map((set, i) => (
                        <div key={i} className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-center">
                          <input
                            type="number"
                            value={set.a}
                            onChange={(e) => updateSet(i, "a", e.target.value)}
                            min="0"
                            max={isPickleball ? "30" : "7"}
                            placeholder={isPickleball ? "11" : "0"}
                            className="w-full px-3 py-2 border border-blue-200 rounded-xl bg-blue-50 text-zinc-900 text-center font-bold focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <span className="text-zinc-400 font-bold text-sm">-</span>
                          <input
                            type="number"
                            value={set.b}
                            onChange={(e) => updateSet(i, "b", e.target.value)}
                            min="0"
                            max={isPickleball ? "30" : "7"}
                            placeholder={isPickleball ? "11" : "0"}
                            className="w-full px-3 py-2 border border-red-200 rounded-xl bg-red-50 text-zinc-900 text-center font-bold focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          />
                          {sets.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSet(i)}
                              className="text-zinc-400 hover:text-red-500 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                          {sets.length === 1 && <div className="w-4"></div>}
                        </div>
                      ))}
                      {sets.length < 5 && (
                        <button
                          type="button"
                          onClick={addSet}
                          className="w-full py-2 border border-dashed border-zinc-300 rounded-xl text-sm text-zinc-500 hover:border-orange-300 hover:text-orange-500 transition-all"
                        >
                          {isPickleball ? "+ Add Game" : "+ Add Set"}
                        </button>
                      )}
                      {getWinnerFromSets() && (
                        <div className="text-center text-sm font-medium text-orange-500">
                          Winner: Side {getWinnerFromSets()}
                          <span className="text-zinc-500 ml-1">
                            ({(getWinnerFromSets() === "A" ? matchTeamA : matchTeamB)
                              .map((id) => getMemberName(id))
                              .join(" & ")})
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Legacy: Team vs Team */}
          {league.scoring_format === "team_vs_team" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Week Number</label>
                  <input
                    type="number"
                    value={weekNumber}
                    onChange={(e) => setWeekNumber(e.target.value)}
                    placeholder="Optional"
                    min="1"
                    className="w-full px-4 py-3 border border-zinc-300 rounded-xl bg-white text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Match Date</label>
                  <input
                    type="date"
                    value={matchDate}
                    onChange={(e) => setMatchDate(e.target.value)}
                    className="w-full px-4 py-3 border border-zinc-300 rounded-xl bg-white text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-3">Assign members to teams</label>
                <div className="space-y-2">
                  {members.map((member) => {
                    const team = getTeam(member.user_id);
                    return (
                      <div key={member.user_id} className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl">
                        {member.avatar_url ? (
                          <Image src={member.avatar_url} alt={member.name || "Member"} width={36} height={36} className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-orange-500 text-white flex items-center justify-center font-medium text-sm">{getInitials(member.name)}</div>
                        )}
                        <span className="flex-1 font-medium text-zinc-900 text-sm">{member.name || "Anonymous"}</span>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => assignTeam(member.user_id, "A")} className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${team === "A" ? "bg-blue-500 text-white" : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300"}`}>Team A</button>
                          <button type="button" onClick={() => assignTeam(member.user_id, "B")} className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${team === "B" ? "bg-red-500 text-white" : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300"}`}>Team B</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">Team A Score</label>
                  <input type="number" value={scoreA} onChange={(e) => setScoreA(e.target.value)} min="0" placeholder="0" className="w-full px-4 py-3 border border-blue-300 rounded-xl bg-blue-50 text-zinc-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-center text-xl font-bold" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-red-700 mb-2">Team B Score</label>
                  <input type="number" value={scoreB} onChange={(e) => setScoreB(e.target.value)} min="0" placeholder="0" className="w-full px-4 py-3 border border-red-300 rounded-xl bg-red-50 text-zinc-900 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-center text-xl font-bold" />
                </div>
              </div>
            </div>
          )}

          {/* Legacy: Individual Time */}
          {league.scoring_format === "individual_time" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Week Number</label>
                  <input type="number" value={weekNumber} onChange={(e) => setWeekNumber(e.target.value)} placeholder="Optional" min="1" className="w-full px-4 py-3 border border-zinc-300 rounded-xl bg-white text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Match Date</label>
                  <input type="date" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} className="w-full px-4 py-3 border border-zinc-300 rounded-xl bg-white text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all" />
                </div>
              </div>
              <label className="block text-sm font-medium text-zinc-700">Select participants and enter times</label>
              <div className="space-y-2">
                {members.map((member) => {
                  const isSelected = selectedTimeMembers.has(member.user_id);
                  const entry = timeEntries.find((t) => t.user_id === member.user_id);
                  return (
                    <div key={member.user_id} className={`p-3 rounded-xl transition-all ${isSelected ? "bg-orange-50 border border-orange-200" : "bg-zinc-50"}`}>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => toggleTimeMember(member.user_id)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${isSelected ? "bg-orange-500 border-orange-500" : "border-zinc-300"}`}>
                          {isSelected && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                        </button>
                        {member.avatar_url ? (
                          <Image src={member.avatar_url} alt={member.name || "Member"} width={36} height={36} className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-orange-500 text-white flex items-center justify-center font-medium text-sm">{getInitials(member.name)}</div>
                        )}
                        <span className="flex-1 font-medium text-zinc-900 text-sm">{member.name || "Anonymous"}</span>
                        {isSelected && entry && (
                          <div className="flex items-center gap-1">
                            <input type="number" value={entry.minutes} onChange={(e) => updateTimeEntry(member.user_id, "minutes", e.target.value)} min="0" placeholder="mm" className="w-16 px-2 py-1.5 border border-zinc-300 rounded-lg text-center text-sm" />
                            <span className="text-zinc-500 font-bold">:</span>
                            <input type="number" value={entry.seconds} onChange={(e) => updateTimeEntry(member.user_id, "seconds", e.target.value)} min="0" max="59" placeholder="ss" className="w-16 px-2 py-1.5 border border-zinc-300 rounded-lg text-center text-sm" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Legacy: Individual Points */}
          {league.scoring_format === "individual_points" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Week Number</label>
                  <input type="number" value={weekNumber} onChange={(e) => setWeekNumber(e.target.value)} placeholder="Optional" min="1" className="w-full px-4 py-3 border border-zinc-300 rounded-xl bg-white text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Match Date</label>
                  <input type="date" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} className="w-full px-4 py-3 border border-zinc-300 rounded-xl bg-white text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all" />
                </div>
              </div>
              <label className="block text-sm font-medium text-zinc-700">Select participants and enter points</label>
              <div className="space-y-2">
                {members.map((member) => {
                  const isSelected = selectedPointsMembers.has(member.user_id);
                  const entry = pointsEntries.find((t) => t.user_id === member.user_id);
                  return (
                    <div key={member.user_id} className={`p-3 rounded-xl transition-all ${isSelected ? "bg-orange-50 border border-orange-200" : "bg-zinc-50"}`}>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => togglePointsMember(member.user_id)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${isSelected ? "bg-orange-500 border-orange-500" : "border-zinc-300"}`}>
                          {isSelected && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                        </button>
                        {member.avatar_url ? (
                          <Image src={member.avatar_url} alt={member.name || "Member"} width={36} height={36} className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-orange-500 text-white flex items-center justify-center font-medium text-sm">{getInitials(member.name)}</div>
                        )}
                        <span className="flex-1 font-medium text-zinc-900 text-sm">{member.name || "Anonymous"}</span>
                        {isSelected && entry && (
                          <input type="number" value={entry.points} onChange={(e) => updatePointsEntry(member.user_id, e.target.value)} min="0" placeholder="Pts" className="w-20 px-2 py-1.5 border border-zinc-300 rounded-lg text-center text-sm" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any notes about this match..."
              className="w-full px-4 py-3 border border-zinc-300 rounded-xl bg-white text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit() || submitting}
            className={`w-full py-3 rounded-full font-medium transition-all ${
              canSubmit()
                ? "bg-orange-500 text-white hover:bg-orange-600 hover:shadow-lg"
                : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </span>
            ) : (
              "Save Results"
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
