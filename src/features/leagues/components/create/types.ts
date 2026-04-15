export interface LeagueCreateFormData {
  sportType: "tennis" | "pickleball" | "running" | "";
  leagueType: "season" | "tournament" | "";
  matchType: "singles" | "doubles" | "";
  rotationType: "random" | "assigned" | "";
  scoringFormat: "singles" | "doubles" | "individual_time" | "";
  runningComparisonMode: "personal_progress" | "absolute_performance";
  tournamentSeeding: "random" | "manual";
  startDate: string;
  startTime: string;
  seasonWeeks: number;
  name: string;
  description: string;
  maxMembers: number;
  defaultCourtId: string;
  defaultCourtName: string;
}

export type FriendProfile = {
  id: string;
  name: string | null;
  avatar_url: string | null;
};
