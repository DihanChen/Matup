"use client";

import Image from "next/image";
import { getInitials } from "@/lib/league-utils";
import type {
  MemberInfo,
  ScheduledMatch,
  SetScore,
} from "@/features/leagues/hooks/useRecordResultsPage";

type Props = {
  scheduledMatches: ScheduledMatch[];
  selectedMatchId: string;
  isAdHoc: boolean;
  onSelectMatch: (matchId: string) => void;
  onSelectAdHoc: () => void;
  selectedMatch: ScheduledMatch | undefined;
  members: MemberInfo[];
  teamAPlayers: string[];
  teamBPlayers: string[];
  onToggleAdHocPlayer: (userId: string, team: "A" | "B") => void;
  weekNumber: string;
  onWeekNumberChange: (value: string) => void;
  matchDate: string;
  onMatchDateChange: (value: string) => void;
  matchTeamA: string[];
  matchTeamB: string[];
  scoreMode: "simple" | "detailed";
  onScoreModeChange: (mode: "simple" | "detailed") => void;
  winner: "A" | "B" | "";
  onWinnerChange: (winner: "A" | "B") => void;
  getMemberName: (userId: string) => string;
  isPickleball: boolean;
  sets: SetScore[];
  onUpdateSet: (index: number, side: "a" | "b", value: string) => void;
  onRemoveSet: (index: number) => void;
  onAddSet: () => void;
  getWinnerFromSets: () => "A" | "B" | "";
};

export default function RecordResultsTennisSection({
  scheduledMatches,
  selectedMatchId,
  isAdHoc,
  onSelectMatch,
  onSelectAdHoc,
  selectedMatch,
  members,
  teamAPlayers,
  teamBPlayers,
  onToggleAdHocPlayer,
  weekNumber,
  onWeekNumberChange,
  matchDate,
  onMatchDateChange,
  matchTeamA,
  matchTeamB,
  scoreMode,
  onScoreModeChange,
  winner,
  onWinnerChange,
  getMemberName,
  isPickleball,
  sets,
  onUpdateSet,
  onRemoveSet,
  onAddSet,
  getWinnerFromSets,
}: Props) {
  return (
    <div className="space-y-6">
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
                  onClick={() => onSelectMatch(match.id)}
                  className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                    selectedMatchId === match.id && !isAdHoc
                      ? "border-orange-500 bg-orange-50"
                      : "border-zinc-200 hover:border-orange-300"
                  }`}
                >
                  <div className="text-sm font-medium text-zinc-900">
                    Week {match.week_number}
                  </div>
                  <div className="text-xs text-zinc-500 mt-1 break-words">
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
          onClick={onSelectAdHoc}
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

      {(selectedMatchId || isAdHoc) && (
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-3">
            {isAdHoc ? "Select Players" : "Players"}
          </label>

          {!isAdHoc && selectedMatch && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    className="flex flex-wrap sm:flex-nowrap items-center gap-3 p-3 bg-zinc-50 rounded-xl"
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
                    <span className="flex-1 min-w-[140px] font-medium text-zinc-900 text-sm">
                      {member.name || "Anonymous"}
                    </span>
                    <div className="w-full sm:w-auto flex gap-2 sm:justify-end">
                      <button
                        type="button"
                        onClick={() => onToggleAdHocPlayer(member.user_id, "A")}
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
                        onClick={() => onToggleAdHocPlayer(member.user_id, "B")}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    Week Number
                  </label>
                  <input
                    type="number"
                    value={weekNumber}
                    onChange={(e) => onWeekNumberChange(e.target.value)}
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
                    onChange={(e) => onMatchDateChange(e.target.value)}
                    className="w-full px-4 py-3 border border-zinc-300 rounded-xl bg-white text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {(selectedMatchId || isAdHoc) && (matchTeamA.length > 0 && matchTeamB.length > 0) && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-zinc-700">
              Score
            </label>
            <div className="flex bg-zinc-100 rounded-full p-0.5">
              <button
                type="button"
                onClick={() => onScoreModeChange("simple")}
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
                onClick={() => onScoreModeChange("detailed")}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => onWinnerChange("A")}
                className={`p-6 rounded-xl border-2 text-center transition-all ${
                  winner === "A"
                    ? "border-blue-500 bg-blue-50"
                    : "border-zinc-200 hover:border-blue-300"
                }`}
              >
                <div className="text-sm font-medium text-blue-700 mb-1">Side A Wins</div>
                <div className="text-xs text-zinc-500 break-words">
                  {matchTeamA.map((id) => getMemberName(id)).join(" & ")}
                </div>
              </button>
              <button
                type="button"
                onClick={() => onWinnerChange("B")}
                className={`p-6 rounded-xl border-2 text-center transition-all ${
                  winner === "B"
                    ? "border-red-500 bg-red-50"
                    : "border-zinc-200 hover:border-red-300"
                }`}
              >
                <div className="text-sm font-medium text-red-700 mb-1">Side B Wins</div>
                <div className="text-xs text-zinc-500 break-words">
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
                    onChange={(e) => onUpdateSet(i, "a", e.target.value)}
                    min="0"
                    max={isPickleball ? "30" : "7"}
                    placeholder={isPickleball ? "11" : "0"}
                    className="w-full px-3 py-2 border border-blue-200 rounded-xl bg-blue-50 text-zinc-900 text-center font-bold focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="text-zinc-400 font-bold text-sm">-</span>
                  <input
                    type="number"
                    value={set.b}
                    onChange={(e) => onUpdateSet(i, "b", e.target.value)}
                    min="0"
                    max={isPickleball ? "30" : "7"}
                    placeholder={isPickleball ? "11" : "0"}
                    className="w-full px-3 py-2 border border-red-200 rounded-xl bg-red-50 text-zinc-900 text-center font-bold focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  {sets.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => onRemoveSet(i)}
                      className="text-zinc-400 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  ) : (
                    <div className="w-4"></div>
                  )}
                </div>
              ))}
              {sets.length < 5 && (
                <button
                  type="button"
                  onClick={onAddSet}
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
  );
}
