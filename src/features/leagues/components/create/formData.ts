"use client";

import type { League } from "@/lib/league-types";
import type { LeagueCreateFormData } from "@/features/leagues/components/create/types";

type RuleRecord = Record<string, unknown>;

const DEFAULT_FORM_DATA: LeagueCreateFormData = {
  sportType: "",
  leagueType: "",
  matchType: "",
  rotationType: "",
  scoringFormat: "",
  runningComparisonMode: "personal_progress",
  tournamentSeeding: "random",
  startDate: "",
  startTime: "",
  seasonWeeks: 10,
  name: "",
  description: "",
  maxMembers: 20,
  defaultCourtId: "",
  defaultCourtName: "",
};

function asRuleRecord(value: unknown): RuleRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as RuleRecord;
}

function asPositiveNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

export function deriveLeagueFormData(league: League): LeagueCreateFormData {
  const rules = asRuleRecord(league.rules_jsonb);
  const schedule = asRuleRecord(rules?.schedule);
  const match = asRuleRecord(rules?.match);
  const sessions = asRuleRecord(rules?.sessions);

  const sportType =
    league.sport_type === "running" ||
    league.sport_type === "tennis" ||
    league.sport_type === "pickleball"
      ? league.sport_type
      : DEFAULT_FORM_DATA.sportType;

  const matchMode = match?.mode;
  const matchType =
    sportType === "running"
      ? DEFAULT_FORM_DATA.matchType
      : matchMode === "doubles" || league.scoring_format === "doubles"
      ? "doubles"
      : "singles";

  const doublesPartnerMode = match?.doubles_partner_mode;
  const rotationType =
    sportType === "running" || matchType !== "doubles"
      ? DEFAULT_FORM_DATA.rotationType
      : doublesPartnerMode === "fixed_pairs" || league.rotation_type === "assigned"
      ? "assigned"
      : "random";

  const seasonWeeks =
    asPositiveNumber(schedule?.season_weeks) ??
    (league.season_weeks && league.season_weeks > 0 ? league.season_weeks : DEFAULT_FORM_DATA.seasonWeeks);

  const runningComparisonMode =
    sessions?.comparison_mode === "absolute_performance"
      ? "absolute_performance"
      : DEFAULT_FORM_DATA.runningComparisonMode;

  const leagueType =
    league.league_type === "tournament" ? "tournament" : "season";

  return {
    sportType,
    leagueType,
    matchType,
    rotationType,
    scoringFormat:
      sportType === "running"
        ? "individual_time"
        : matchType === "doubles"
        ? "doubles"
        : matchType === "singles"
        ? "singles"
        : DEFAULT_FORM_DATA.scoringFormat,
    runningComparisonMode,
    tournamentSeeding: DEFAULT_FORM_DATA.tournamentSeeding,
    startDate:
      typeof schedule?.starts_on === "string"
        ? schedule.starts_on
        : league.start_date || DEFAULT_FORM_DATA.startDate,
    startTime:
      typeof schedule?.starts_at_local === "string"
        ? schedule.starts_at_local
        : DEFAULT_FORM_DATA.startTime,
    seasonWeeks,
    name: league.name || DEFAULT_FORM_DATA.name,
    description: league.description || DEFAULT_FORM_DATA.description,
    maxMembers:
      Number.isFinite(league.max_members) && league.max_members > 0
        ? league.max_members
        : DEFAULT_FORM_DATA.maxMembers,
    defaultCourtId: DEFAULT_FORM_DATA.defaultCourtId,
    defaultCourtName: DEFAULT_FORM_DATA.defaultCourtName,
  };
}

export function buildCopiedLeagueName(name: string): string {
  const trimmedName = name.trim();
  if (!trimmedName) return "League Copy";
  if (/copy$/i.test(trimmedName)) return trimmedName;
  return `${trimmedName} Copy`;
}
