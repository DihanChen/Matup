"use client";

import Link from "next/link";
import Image from "next/image";
import { getInitials } from "@/lib/league-utils";
import RecordResultsTennisSection from "@/features/leagues/components/RecordResultsTennisSection";
import { useRecordResultsPage } from "@/features/leagues/hooks/useRecordResultsPage";

export default function RecordResultsPageClient() {
  const {
    leagueId,
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
  } = useRecordResultsPage();

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
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">
            Record <span className="text-orange-500">Results</span>
          </h1>
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

          {isTennis && (
            <RecordResultsTennisSection
              scheduledMatches={scheduledMatches}
              selectedMatchId={selectedMatchId}
              isAdHoc={isAdHoc}
              onSelectMatch={(matchId) => {
                setSelectedMatchId(matchId);
                setIsAdHoc(false);
              }}
              onSelectAdHoc={() => {
                setIsAdHoc(true);
                setSelectedMatchId("");
              }}
              selectedMatch={selectedMatch}
              members={members}
              teamAPlayers={teamAPlayers}
              teamBPlayers={teamBPlayers}
              onToggleAdHocPlayer={toggleAdHocPlayer}
              weekNumber={weekNumber}
              onWeekNumberChange={setWeekNumber}
              matchDate={matchDate}
              onMatchDateChange={setMatchDate}
              matchTeamA={matchTeamA}
              matchTeamB={matchTeamB}
              scoreMode={scoreMode}
              onScoreModeChange={setScoreMode}
              winner={winner}
              onWinnerChange={setWinner}
              getMemberName={getMemberName}
              isPickleball={isPickleball}
              sets={sets}
              onUpdateSet={updateSet}
              onRemoveSet={removeSet}
              onAddSet={addSet}
              getWinnerFromSets={getWinnerFromSets}
            />
          )}

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
