export type ScheduledMatch = {
  week_number: number;
  team_a: string[];
  team_b: string[];
};

/**
 * Singles round-robin using the circle method.
 * Each player plays every other player across the weeks.
 */
export function generateSinglesSchedule(
  memberIds: string[],
  weeks: number
): ScheduledMatch[] {
  const ids = [...memberIds];
  // Circle method needs even number of players
  if (ids.length % 2 !== 0) {
    ids.push("BYE");
  }

  const n = ids.length;
  const rounds: ScheduledMatch[] = [];
  const totalRounds = n - 1;

  for (let week = 1; week <= weeks; week++) {
    const roundIndex = (week - 1) % totalRounds;

    // Build the rotation for this round
    const rotated = [ids[0]];
    for (let i = 1; i < n; i++) {
      const pos = ((i - 1 + roundIndex) % (n - 1)) + 1;
      rotated.push(ids[pos]);
    }

    // Pair first with last, second with second-to-last, etc.
    for (let i = 0; i < n / 2; i++) {
      const a = rotated[i];
      const b = rotated[n - 1 - i];
      if (a === "BYE" || b === "BYE") continue;
      rounds.push({
        week_number: week,
        team_a: [a],
        team_b: [b],
      });
    }
  }

  return rounds;
}

/**
 * Doubles random schedule: Fisher-Yates shuffle each week to form random pairs.
 * Players are shuffled and paired as: [0,1] vs [2,3], [4,5] vs [6,7], etc.
 */
export function generateDoublesRandomSchedule(
  memberIds: string[],
  weeks: number
): ScheduledMatch[] {
  const rounds: ScheduledMatch[] = [];

  for (let week = 1; week <= weeks; week++) {
    const shuffled = fisherYatesShuffle([...memberIds]);

    // Need at least 4 players for a doubles match
    const playable = shuffled.length - (shuffled.length % 4);
    for (let i = 0; i < playable; i += 4) {
      rounds.push({
        week_number: week,
        team_a: [shuffled[i], shuffled[i + 1]],
        team_b: [shuffled[i + 2], shuffled[i + 3]],
      });
    }
  }

  return rounds;
}

/**
 * Doubles assigned: fixed partners for the entire season.
 * Players are paired once (in order), then those fixed teams play
 * a round-robin against each other across the weeks.
 */
export function generateDoublesAssignedSchedule(
  memberIds: string[],
  weeks: number
): ScheduledMatch[] {
  const ids = [...memberIds];

  // Form fixed teams: pair adjacent players [0,1], [2,3], etc.
  const teams: [string, string][] = [];
  for (let i = 0; i + 1 < ids.length; i += 2) {
    teams.push([ids[i], ids[i + 1]]);
  }

  if (teams.length < 2) return [];

  // Round-robin across the fixed teams using circle method
  const teamList = [...teams];
  if (teamList.length % 2 !== 0) {
    teamList.push(["BYE", "BYE"]);
  }

  const n = teamList.length;
  const totalRounds = n - 1;
  const rounds: ScheduledMatch[] = [];

  for (let week = 1; week <= weeks; week++) {
    const roundIndex = (week - 1) % totalRounds;

    const rotated = [teamList[0]];
    for (let i = 1; i < n; i++) {
      const pos = ((i - 1 + roundIndex) % (n - 1)) + 1;
      rotated.push(teamList[pos]);
    }

    for (let i = 0; i < n / 2; i++) {
      const a = rotated[i];
      const b = rotated[n - 1 - i];
      if (a[0] === "BYE" || b[0] === "BYE") continue;
      rounds.push({
        week_number: week,
        team_a: [...a],
        team_b: [...b],
      });
    }
  }

  return rounds;
}

function fisherYatesShuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
