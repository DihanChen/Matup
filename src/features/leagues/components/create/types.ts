export interface LeagueCreateFormData {
  sportType: "tennis" | "pickleball" | "running" | "";
  matchType: "singles" | "doubles" | "";
  rotationType: "random" | "assigned" | "";
  scoringFormat: "singles" | "doubles" | "individual_time" | "";
  runningComparisonMode: "personal_progress" | "absolute_performance";
  startDate: string;
  seasonWeeks: number;
  name: string;
  description: string;
  maxMembers: number;
}

export type FriendProfile = {
  id: string;
  name: string | null;
  avatar_url: string | null;
};
