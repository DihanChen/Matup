export type ScoringFormat = "team_vs_team" | "individual_time" | "individual_points" | "singles" | "doubles";

export type Match = {
  id: string;
  status: string;
  week_number: number | null;
  winner?: string | null;
};

export type Participant = {
  match_id: string;
  user_id: string;
  team: string | null;
  score: number | null;
  time_seconds: number | null;
  points: number | null;
  set_scores?: { sets: number[][] } | null;
};

export type Member = {
  user_id: string;
  name: string | null;
  avatar_url: string | null;
};

export type Standing = {
  user_id: string;
  name: string | null;
  avatar_url: string | null;
  rank: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  goalDifference: number;
  totalTime: number;
  totalPoints: number;
};

export type TeamStanding = {
  team_key: string;
  player_ids: string[];
  player_names: string[];
  rank: number;
  played: number;
  wins: number;
  losses: number;
  winPct: number;
};

export function calculateStandings(
  scoringFormat: ScoringFormat,
  matches: Match[],
  participants: Participant[],
  members: Member[]
): Standing[] {
  const completedMatches = matches.filter((m) => m.status === "completed");
  const completedMatchIds = new Set(completedMatches.map((m) => m.id));
  const relevantParticipants = participants.filter((p) =>
    completedMatchIds.has(p.match_id)
  );

  switch (scoringFormat) {
    case "team_vs_team":
      return calcTeamVsTeam(completedMatches, relevantParticipants, members);
    case "individual_time":
      return calcIndividualTime(completedMatches, relevantParticipants, members);
    case "individual_points":
      return calcIndividualPoints(completedMatches, relevantParticipants, members);
    case "singles":
      return calcTennisSingles(completedMatches, relevantParticipants, members);
    case "doubles":
      return calcTennisSinglesFromDoubles(completedMatches, relevantParticipants, members);
    default:
      return [];
  }
}

export function calculateTeamStandings(
  matches: Match[],
  participants: Participant[],
  members: Member[]
): TeamStanding[] {
  return calcTennisDoubles(matches, participants, members);
}

function calcTennisSingles(
  matches: Match[],
  participants: Participant[],
  members: Member[]
): Standing[] {
  const stats: Record<string, { played: number; wins: number; losses: number }> = {};

  for (const m of members) {
    stats[m.user_id] = { played: 0, wins: 0, losses: 0 };
  }

  for (const match of matches) {
    if (!match.winner) continue;
    const matchPs = participants.filter((p) => p.match_id === match.id);
    const teamA = matchPs.filter((p) => p.team === "A");
    const teamB = matchPs.filter((p) => p.team === "B");

    const winners = match.winner === "A" ? teamA : teamB;
    const losers = match.winner === "A" ? teamB : teamA;

    for (const p of winners) {
      if (!stats[p.user_id]) stats[p.user_id] = { played: 0, wins: 0, losses: 0 };
      stats[p.user_id].played++;
      stats[p.user_id].wins++;
    }
    for (const p of losers) {
      if (!stats[p.user_id]) stats[p.user_id] = { played: 0, wins: 0, losses: 0 };
      stats[p.user_id].played++;
      stats[p.user_id].losses++;
    }
  }

  const standings = Object.entries(stats).map(([userId, s]) => {
    const member = members.find((m) => m.user_id === userId);
    return {
      user_id: userId,
      name: member?.name ?? null,
      avatar_url: member?.avatar_url ?? null,
      rank: 0,
      played: s.played,
      wins: s.wins,
      draws: 0,
      losses: s.losses,
      points: s.wins,
      goalDifference: 0,
      totalTime: 0,
      totalPoints: 0,
    };
  });

  standings.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (a.losses !== b.losses) return a.losses - b.losses;
    return b.played - a.played;
  });

  standings.forEach((s, i) => (s.rank = i + 1));
  return standings;
}

/** For doubles leagues, produce individual standings from match winner */
function calcTennisSinglesFromDoubles(
  matches: Match[],
  participants: Participant[],
  members: Member[]
): Standing[] {
  // Same logic as singles — each individual gets W/L from their team
  return calcTennisSingles(matches, participants, members);
}

function calcTennisDoubles(
  matches: Match[],
  participants: Participant[],
  members: Member[]
): TeamStanding[] {
  const completedMatches = matches.filter((m) => m.status === "completed");
  const completedMatchIds = new Set(completedMatches.map((m) => m.id));
  const relevantParticipants = participants.filter((p) =>
    completedMatchIds.has(p.match_id)
  );

  const stats: Record<string, { player_ids: string[]; played: number; wins: number; losses: number }> = {};

  for (const match of completedMatches) {
    if (!match.winner) continue;
    const matchPs = relevantParticipants.filter((p) => p.match_id === match.id);
    const teamA = matchPs.filter((p) => p.team === "A").map((p) => p.user_id).sort();
    const teamB = matchPs.filter((p) => p.team === "B").map((p) => p.user_id).sort();

    if (teamA.length < 2 || teamB.length < 2) continue;

    const keyA = teamA.join("+");
    const keyB = teamB.join("+");

    if (!stats[keyA]) stats[keyA] = { player_ids: teamA, played: 0, wins: 0, losses: 0 };
    if (!stats[keyB]) stats[keyB] = { player_ids: teamB, played: 0, wins: 0, losses: 0 };

    stats[keyA].played++;
    stats[keyB].played++;

    if (match.winner === "A") {
      stats[keyA].wins++;
      stats[keyB].losses++;
    } else {
      stats[keyB].wins++;
      stats[keyA].losses++;
    }
  }

  const teamStandings: TeamStanding[] = Object.entries(stats).map(([key, s]) => {
    const playerNames = s.player_ids.map((id) => {
      const member = members.find((m) => m.user_id === id);
      return member?.name ?? "Unknown";
    });
    return {
      team_key: key,
      player_ids: s.player_ids,
      player_names: playerNames,
      rank: 0,
      played: s.played,
      wins: s.wins,
      losses: s.losses,
      winPct: s.played > 0 ? Math.round((s.wins / s.played) * 100) : 0,
    };
  });

  teamStandings.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (a.losses !== b.losses) return a.losses - b.losses;
    return b.winPct - a.winPct;
  });

  teamStandings.forEach((s, i) => (s.rank = i + 1));
  return teamStandings;
}

function calcTeamVsTeam(
  matches: Match[],
  participants: Participant[],
  members: Member[]
): Standing[] {
  const stats: Record<
    string,
    { played: number; wins: number; draws: number; losses: number; points: number; goalsFor: number; goalsAgainst: number }
  > = {};

  for (const m of members) {
    stats[m.user_id] = { played: 0, wins: 0, draws: 0, losses: 0, points: 0, goalsFor: 0, goalsAgainst: 0 };
  }

  for (const match of matches) {
    const matchPs = participants.filter((p) => p.match_id === match.id);
    const teamA = matchPs.filter((p) => p.team === "A");
    const teamB = matchPs.filter((p) => p.team === "B");

    if (teamA.length === 0 || teamB.length === 0) continue;

    const scoreA = teamA[0]?.score ?? 0;
    const scoreB = teamB[0]?.score ?? 0;

    for (const p of teamA) {
      if (!stats[p.user_id]) {
        stats[p.user_id] = { played: 0, wins: 0, draws: 0, losses: 0, points: 0, goalsFor: 0, goalsAgainst: 0 };
      }
      stats[p.user_id].played++;
      stats[p.user_id].goalsFor += scoreA;
      stats[p.user_id].goalsAgainst += scoreB;
      if (scoreA > scoreB) {
        stats[p.user_id].wins++;
        stats[p.user_id].points += 3;
      } else if (scoreA === scoreB) {
        stats[p.user_id].draws++;
        stats[p.user_id].points += 1;
      } else {
        stats[p.user_id].losses++;
      }
    }

    for (const p of teamB) {
      if (!stats[p.user_id]) {
        stats[p.user_id] = { played: 0, wins: 0, draws: 0, losses: 0, points: 0, goalsFor: 0, goalsAgainst: 0 };
      }
      stats[p.user_id].played++;
      stats[p.user_id].goalsFor += scoreB;
      stats[p.user_id].goalsAgainst += scoreA;
      if (scoreB > scoreA) {
        stats[p.user_id].wins++;
        stats[p.user_id].points += 3;
      } else if (scoreA === scoreB) {
        stats[p.user_id].draws++;
        stats[p.user_id].points += 1;
      } else {
        stats[p.user_id].losses++;
      }
    }
  }

  const standings = Object.entries(stats).map(([userId, s]) => {
    const member = members.find((m) => m.user_id === userId);
    return {
      user_id: userId,
      name: member?.name ?? null,
      avatar_url: member?.avatar_url ?? null,
      rank: 0,
      played: s.played,
      wins: s.wins,
      draws: s.draws,
      losses: s.losses,
      points: s.points,
      goalDifference: s.goalsFor - s.goalsAgainst,
      totalTime: 0,
      totalPoints: 0,
    };
  });

  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.goalDifference - a.goalDifference;
  });

  standings.forEach((s, i) => (s.rank = i + 1));
  return standings;
}

function calcIndividualTime(
  matches: Match[],
  participants: Participant[],
  members: Member[]
): Standing[] {
  const positionPoints: Record<string, number> = {};
  const playedCount: Record<string, number> = {};

  for (const m of members) {
    positionPoints[m.user_id] = 0;
    playedCount[m.user_id] = 0;
  }

  for (const match of matches) {
    const matchPs = participants
      .filter((p) => p.match_id === match.id && p.time_seconds != null)
      .sort((a, b) => (a.time_seconds ?? 0) - (b.time_seconds ?? 0));

    const n = matchPs.length;
    matchPs.forEach((p, i) => {
      if (!positionPoints[p.user_id]) positionPoints[p.user_id] = 0;
      if (!playedCount[p.user_id]) playedCount[p.user_id] = 0;
      positionPoints[p.user_id] += n - i; // 1st gets N pts, 2nd gets N-1, etc.
      playedCount[p.user_id]++;
    });
  }

  const standings = Object.entries(positionPoints).map(([userId, pts]) => {
    const member = members.find((m) => m.user_id === userId);
    return {
      user_id: userId,
      name: member?.name ?? null,
      avatar_url: member?.avatar_url ?? null,
      rank: 0,
      played: playedCount[userId] || 0,
      wins: 0,
      draws: 0,
      losses: 0,
      points: pts,
      goalDifference: 0,
      totalTime: 0,
      totalPoints: 0,
    };
  });

  standings.sort((a, b) => b.points - a.points);
  standings.forEach((s, i) => (s.rank = i + 1));
  return standings;
}

function calcIndividualPoints(
  matches: Match[],
  participants: Participant[],
  members: Member[]
): Standing[] {
  const totalPoints: Record<string, number> = {};
  const playedCount: Record<string, number> = {};

  for (const m of members) {
    totalPoints[m.user_id] = 0;
    playedCount[m.user_id] = 0;
  }

  for (const p of participants) {
    if (!totalPoints[p.user_id]) totalPoints[p.user_id] = 0;
    if (!playedCount[p.user_id]) playedCount[p.user_id] = 0;
    totalPoints[p.user_id] += p.points ?? 0;
    playedCount[p.user_id]++;
  }

  const standings = Object.entries(totalPoints).map(([userId, pts]) => {
    const member = members.find((m) => m.user_id === userId);
    return {
      user_id: userId,
      name: member?.name ?? null,
      avatar_url: member?.avatar_url ?? null,
      rank: 0,
      played: playedCount[userId] || 0,
      wins: 0,
      draws: 0,
      losses: 0,
      points: 0,
      goalDifference: 0,
      totalTime: 0,
      totalPoints: pts,
    };
  });

  standings.sort((a, b) => b.totalPoints - a.totalPoints);
  standings.forEach((s, i) => (s.rank = i + 1));
  return standings;
}
