"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import {
  calculateStandings,
  calculateTeamStandings,
  type ScoringFormat,
  type Match,
  type Participant,
  type Member,
  type Standing,
  type TeamStanding,
} from "@/lib/rankings";
import {
  generateSinglesSchedule,
  generateDoublesRandomSchedule,
  generateDoublesAssignedSchedule,
} from "@/lib/schedule";

type League = {
  id: string;
  name: string;
  description: string | null;
  sport_type: string;
  scoring_format: ScoringFormat;
  league_type: string;
  creator_id: string;
  max_members: number;
  start_date: string | null;
  end_date: string | null;
  season_weeks: number | null;
  rotation_type: string | null;
  status: string;
  created_at: string;
};

type LeagueMember = {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  name: string | null;
  avatar_url: string | null;
};

type LeagueMatch = {
  id: string;
  week_number: number | null;
  match_date: string | null;
  status: string;
  winner: string | null;
  notes: string | null;
  created_at: string;
  participants: {
    user_id: string;
    team: string | null;
    score: number | null;
    time_seconds: number | null;
    points: number | null;
    set_scores: { sets: number[][] } | null;
    name: string | null;
  }[];
};

const FORMAT_LABELS: Record<string, string> = {
  team_vs_team: "Team vs Team",
  individual_time: "Time Trial",
  individual_points: "Points",
  singles: "Singles",
  doubles: "Doubles",
};

const ROTATION_LABELS: Record<string, string> = {
  random: "Random",
  assigned: "Assigned Partner",
};

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const currentMember = members.find((m) => m.user_id === user?.id);
  const isOwnerOrAdmin =
    currentMember?.role === "owner" || currentMember?.role === "admin";
  const isMember = !!currentMember;
  const isFull = members.length >= (league?.max_members || 0);
  const isTennis = league?.scoring_format === "singles" || league?.scoring_format === "doubles";
  const isDoubles = league?.scoring_format === "doubles";

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

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

      // Get members
      const { data: membersData } = await supabase
        .from("league_members")
        .select("id, user_id, role, joined_at")
        .eq("league_id", leagueId);

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

      // Get matches
      const { data: matchesData } = await supabase
        .from("league_matches")
        .select("*")
        .eq("league_id", leagueId)
        .order("created_at", { ascending: false });

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

        const matchesWithParticipants = matchesData.map((match) => ({
          ...match,
          participants: (participantsData || [])
            .filter((p) => p.match_id === match.id)
            .map((p) => ({
              ...p,
              name: pProfiles?.find((pr) => pr.id === p.user_id)?.name ?? null,
            })),
        }));

        setMatches(matchesWithParticipants);

        // Calculate standings
        const rankingMatches: Match[] = matchesData.map((m) => ({
          id: m.id,
          status: m.status,
          week_number: m.week_number,
          winner: m.winner,
        }));

        const rankingParticipants: Participant[] = (
          participantsData || []
        ).map((p) => ({
          match_id: p.match_id,
          user_id: p.user_id,
          team: p.team,
          score: p.score,
          time_seconds: p.time_seconds,
          points: p.points,
          set_scores: p.set_scores,
        }));

        const rankingMembers: Member[] =
          membersData?.map((m) => {
            const prof = memberProfiles.find((p) => p.id === m.user_id);
            return {
              user_id: m.user_id,
              name: prof?.name ?? null,
              avatar_url: prof?.avatar_url ?? null,
            };
          }) || [];

        setStandings(
          calculateStandings(
            leagueData.scoring_format,
            rankingMatches,
            rankingParticipants,
            rankingMembers
          )
        );

        // Calculate team standings for doubles
        if (leagueData.scoring_format === "doubles") {
          setTeamStandings(
            calculateTeamStandings(rankingMatches, rankingParticipants, rankingMembers)
          );
        }
      }

      setLoading(false);
    }

    fetchData();
  }, [leagueId]);

  async function handleGenerateSchedule() {
    if (!league || !user) return;

    setGenerating(true);
    setError(null);

    const memberIds = members.map((m) => m.user_id);
    const weeks = league.season_weeks || 10;

    let schedule;
    if (league.scoring_format === "singles") {
      schedule = generateSinglesSchedule(memberIds, weeks);
    } else if (league.rotation_type === "assigned") {
      schedule = generateDoublesAssignedSchedule(memberIds, weeks);
    } else {
      schedule = generateDoublesRandomSchedule(memberIds, weeks);
    }

    const supabase = createClient();

    for (const match of schedule) {
      const { data: matchData, error: matchError } = await supabase
        .from("league_matches")
        .insert({
          league_id: leagueId,
          week_number: match.week_number,
          status: "scheduled",
        })
        .select("id")
        .single();

      if (matchError || !matchData) {
        setError(matchError?.message || "Failed to create match");
        setGenerating(false);
        return;
      }

      const participantRows = [
        ...match.team_a.map((userId) => ({
          match_id: matchData.id,
          user_id: userId,
          team: "A",
          score: null,
          time_seconds: null,
          points: null,
        })),
        ...match.team_b.map((userId) => ({
          match_id: matchData.id,
          user_id: userId,
          team: "B",
          score: null,
          time_seconds: null,
          points: null,
        })),
      ];

      const { error: pError } = await supabase
        .from("match_participants")
        .insert(participantRows);

      if (pError) {
        setError(pError.message);
        setGenerating(false);
        return;
      }
    }

    // Reload page to show new schedule
    window.location.reload();
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

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const completedMatches = matches.filter((m) => m.status === "completed");
  const scheduledMatches = matches.filter((m) => m.status === "scheduled");

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center py-20">
          <div className="text-zinc-500">Loading...</div>
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

  return (
    <div className="min-h-screen bg-white">

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Link
          href="/leagues"
          className="inline-flex items-center text-zinc-600 hover:text-orange-500 mb-4 sm:mb-6 font-medium"
        >
          ← Back to leagues
        </Link>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Header Card */}
            <div className="relative overflow-hidden rounded-2xl bg-orange-500 p-5 sm:p-6 text-white">
              <div className="relative">
                <div className="flex flex-wrap gap-2 mb-4">
                  {isTennis ? (
                    <>
                      <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm font-medium">
                        Tennis
                      </span>
                      <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm font-medium">
                        {FORMAT_LABELS[league.scoring_format]} League
                      </span>
                      {isDoubles && league.rotation_type && (
                        <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm font-medium">
                          {ROTATION_LABELS[league.rotation_type]}
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm font-medium capitalize">
                        {league.sport_type}
                      </span>
                      <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm font-medium">
                        {FORMAT_LABELS[league.scoring_format]}
                      </span>
                      <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm font-medium capitalize">
                        {league.league_type}
                      </span>
                    </>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">{league.name}</h1>
                {league.description && (
                  <p className="text-white/80">{league.description}</p>
                )}
              </div>
            </div>

            {/* Standings */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-6">
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
                        {(isTennis || league.scoring_format === "team_vs_team") && (
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
                          {isTennis
                            ? "Win%"
                            : league.scoring_format === "individual_points"
                            ? "Total"
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
                          {(isTennis || league.scoring_format === "team_vs_team") && (
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
                            {isTennis
                              ? s.played > 0 ? `${Math.round((s.wins / s.played) * 100)}%` : "0%"
                              : league.scoring_format === "individual_points"
                              ? s.totalPoints
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
            {completedMatches.length > 0 && (
              <div className="bg-white rounded-2xl border border-zinc-200 p-6">
                <h2 className="text-lg font-semibold text-zinc-900 mb-4">
                  Recent Results
                </h2>
                <div className="space-y-4">
                  {completedMatches.slice(0, 5).map((match) => (
                    <div
                      key={match.id}
                      className="p-4 bg-zinc-50 rounded-xl"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-zinc-500">
                          {match.week_number
                            ? `Week ${match.week_number}`
                            : "Match"}
                          {match.match_date &&
                            ` - ${new Date(match.match_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                        </span>
                        <span className="px-2 py-0.5 bg-orange-50 text-orange-600 text-xs font-medium rounded-full">
                          Completed
                        </span>
                      </div>
                      {formatMatchResult(match)}
                      {match.notes && (
                        <p className="text-xs text-zinc-400 mt-2">
                          {match.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Matches */}
            {scheduledMatches.length > 0 && (
              <div className="bg-white rounded-2xl border border-zinc-200 p-6">
                <h2 className="text-lg font-semibold text-zinc-900 mb-4">
                  Upcoming Matches
                </h2>
                <div className="space-y-3">
                  {scheduledMatches.map((match) => {
                    const teamA = match.participants.filter((p) => p.team === "A");
                    const teamB = match.participants.filter((p) => p.team === "B");
                    return (
                      <div
                        key={match.id}
                        className="p-4 bg-zinc-50 rounded-xl"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-zinc-900">
                            {match.week_number
                              ? `Week ${match.week_number}`
                              : "Scheduled Match"}
                          </span>
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                            Scheduled
                          </span>
                        </div>
                        {teamA.length > 0 && teamB.length > 0 && (
                          <div className="text-sm text-zinc-500">
                            {teamA.map((p) => p.name || "?").join(" & ")} vs{" "}
                            {teamB.map((p) => p.name || "?").join(" & ")}
                          </div>
                        )}
                        {match.match_date && (
                          <span className="text-xs text-zinc-400">
                            {new Date(match.match_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Members */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-6">
              <h2 className="text-sm font-medium text-zinc-500 mb-4">
                Members ({members.length}/{league.max_members})
              </h2>
              <div className="space-y-3">
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

            {/* Actions */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-3">
              {isOwnerOrAdmin && (
                <Link
                  href={`/leagues/${league.id}/record`}
                  className="block w-full py-3 bg-orange-500 text-white text-center rounded-full font-medium hover:bg-orange-600 transition-colors"
                >
                  Record Results
                </Link>
              )}

              {isOwnerOrAdmin && isTennis && scheduledMatches.length === 0 && members.length >= (isDoubles ? 4 : 2) && (
                <button
                  onClick={handleGenerateSchedule}
                  disabled={generating}
                  className="w-full py-3 border border-orange-500 text-orange-500 rounded-full font-medium hover:bg-orange-50 transition-colors disabled:opacity-50"
                >
                  {generating ? "Generating..." : "Generate Schedule"}
                </button>
              )}

              {isMember && currentMember?.role !== "owner" && (
                <button
                  onClick={handleLeave}
                  disabled={leaving}
                  className="w-full py-3 border border-zinc-300 text-zinc-700 rounded-full font-medium hover:bg-zinc-50 transition-colors disabled:opacity-50"
                >
                  {leaving ? "Leaving..." : "Leave League"}
                </button>
              )}

              {!isMember && !isFull && (
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="w-full py-4 bg-orange-500 text-white rounded-full font-bold text-lg hover:bg-orange-600 transition-all disabled:opacity-50 shadow-lg shadow-orange-500/25"
                >
                  {joining ? "Joining..." : "Join League"}
                </button>
              )}

              {!isMember && isFull && (
                <div className="text-center py-4">
                  <p className="text-zinc-500 font-medium">
                    This league is full
                  </p>
                </div>
              )}

              {currentMember?.role === "owner" && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full py-3 border border-red-300 text-red-500 rounded-full font-medium hover:bg-red-50 transition-colors"
                >
                  Delete League
                </button>
              )}

              {!user && (
                <p className="text-center text-sm text-zinc-500">
                  <Link
                    href="/login"
                    className="text-orange-500 hover:underline"
                  >
                    Log in
                  </Link>{" "}
                  to join this league
                </p>
              )}
            </div>

            {/* League Info */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-6">
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

      {/* Delete League Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-2">Delete League?</h3>
            <p className="text-zinc-500 mb-6">
              This will permanently delete <strong>{league.name}</strong>, all matches, and remove all {members.length} members. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-3 bg-red-500 text-white rounded-full font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Yes, Delete League"}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 py-3 border border-zinc-200 text-zinc-700 rounded-full font-medium hover:bg-zinc-50 transition-colors"
              >
                Keep League
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
