"use client";

import Image from "next/image";
import Link from "next/link";
import type { Standing } from "@/lib/league-types";
import type { LeagueDetailContentProps } from "@/features/leagues/components/detail/types";
import { getInitials } from "@/lib/league-utils";

type Props = {
  data: LeagueDetailContentProps;
};

function MovementIndicator({ current, previous }: { current: number; previous: number | null | undefined }) {
  if (previous == null) return null;
  const diff = previous - current;
  if (diff === 0) return <span className="text-zinc-400 text-xs">&#8211;</span>;
  if (diff > 0) {
    return (
      <span className="inline-flex items-center text-emerald-600 text-xs font-medium">
        <svg className="w-3 h-3 mr-0.5" viewBox="0 0 12 12" fill="currentColor"><path d="M6 2l4 5H2z" /></svg>
        {diff}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-red-500 text-xs font-medium">
      <svg className="w-3 h-3 mr-0.5" viewBox="0 0 12 12" fill="currentColor"><path d="M6 10l4-5H2z" /></svg>
      {Math.abs(diff)}
    </span>
  );
}

function StreakBadge({ streak }: { streak: number | undefined }) {
  if (!streak || streak === 0) return null;
  const isWin = streak > 0;
  const count = Math.abs(streak);
  if (count < 2) return null;
  return (
    <span
      className={`ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold leading-none ${
        isWin
          ? "bg-emerald-100 text-emerald-700"
          : "bg-red-100 text-red-600"
      }`}
    >
      {isWin ? "W" : "L"}{count}
    </span>
  );
}

function FormDots({ form }: { form: Array<"W" | "L" | "D"> | undefined }) {
  if (!form || form.length === 0) return null;
  return (
    <div className="flex items-center gap-0.5">
      {form.map((result, i) => (
        <span
          key={i}
          className={`w-2 h-2 rounded-full ${
            result === "W"
              ? "bg-emerald-500"
              : result === "L"
              ? "bg-red-400"
              : "bg-zinc-300"
          }`}
          title={result === "W" ? "Win" : result === "L" ? "Loss" : "Draw"}
        />
      ))}
    </div>
  );
}

function getTiebreakerText(scoringFormat: string, isRacketLeague: boolean): string | null {
  if (scoringFormat === "team_vs_team") {
    return "Sorted by points, then goal difference, then wins";
  }
  if (isRacketLeague || scoringFormat === "singles" || scoringFormat === "doubles") {
    return "Sorted by wins, then fewest losses";
  }
  if (scoringFormat === "individual_time") {
    return "Sorted by total time (fastest first)";
  }
  if (scoringFormat === "individual_points") {
    return "Sorted by total points, then matches played";
  }
  return null;
}

function hasStreakOrForm(standings: Standing[]): boolean {
  return standings.some(
    (s) => (s.streak && Math.abs(s.streak) >= 2) || (s.form && s.form.length > 0)
  );
}

export default function StandingsCard({ data }: Props) {
  const {
    league,
    isDoubles,
    isRacketLeague,
    isRunningProgressMode,
    standings,
    teamStandings,
    hasRecentResults,
    currentUserId,
  } = data;

  const showFormColumn = hasStreakOrForm(standings);
  const tiebreakerText = getTiebreakerText(league.scoring_format, isRacketLeague);

  return (
    <div
      className={`${
        hasRecentResults ? "md:col-span-7" : "md:col-span-12"
      } bg-white rounded-2xl border border-zinc-200 p-4 sm:p-6`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-zinc-900">
          {isDoubles ? "Team Standings" : "Standings"}
        </h2>
      </div>

      {isDoubles && teamStandings.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
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
                  <td className="py-2 px-2 font-medium text-zinc-900">{s.player_names.join(" & ")}</td>
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

      {(!isDoubles || teamStandings.length === 0) && standings.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-zinc-200">
                <th className="text-left py-2 px-2 text-zinc-500 font-medium">#</th>
                <th className="text-left py-2 px-2 text-zinc-500 font-medium">Player</th>
                <th className="text-center py-2 px-2 text-zinc-500 font-medium">P</th>
                {(isRacketLeague || league.scoring_format === "team_vs_team") && (
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
                  {isRacketLeague
                    ? "Win%"
                    : league.scoring_format === "individual_points"
                    ? "Total"
                    : isRunningProgressMode
                    ? "Progress"
                    : "Pts"}
                </th>
                {showFormColumn && (
                  <th className="text-center py-2 px-2 text-zinc-500 font-medium">Form</th>
                )}
              </tr>
            </thead>
            <tbody>
              {standings.map((s) => {
                const isCurrentUser = s.user_id === currentUserId;
                return (
                <tr
                  key={s.user_id}
                  className={`border-b border-zinc-100 last:border-0 ${
                    isCurrentUser
                      ? "bg-orange-50 ring-1 ring-inset ring-orange-200"
                      : s.rank <= 3 && s.played > 0
                      ? "bg-orange-50/40"
                      : ""
                  }`}
                >
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-zinc-900 w-4">{s.rank}</span>
                      <MovementIndicator current={s.rank} previous={s.previousRank} />
                    </div>
                  </td>
                  <td className="py-2 px-2">
                    <Link href={`/users/${s.user_id}`} className="flex items-center gap-2 hover:text-orange-500">
                      {s.avatar_url ? (
                        <Image src={s.avatar_url} alt={s.name || "Player"} width={24} height={24} className="w-6 h-6 rounded-full object-cover" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-zinc-300 text-white text-xs flex items-center justify-center font-medium">
                          {getInitials(s.name)}
                        </div>
                      )}
                      <span className="font-medium text-zinc-900">{s.name || "Anonymous"}</span>
                      <StreakBadge streak={s.streak} />
                    </Link>
                  </td>
                  <td className="py-2 px-2 text-center text-zinc-600">{s.played}</td>
                  {(isRacketLeague || league.scoring_format === "team_vs_team") && (
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
                    {isRacketLeague
                      ? s.played > 0 ? `${Math.round((s.wins / s.played) * 100)}%` : "0%"
                      : league.scoring_format === "individual_points"
                      ? s.totalPoints
                      : isRunningProgressMode
                      ? `${s.points > 0 ? "+" : ""}${s.points.toFixed(1)}%`
                      : s.points}
                  </td>
                  {showFormColumn && (
                    <td className="py-2 px-2">
                      <div className="flex justify-center">
                        <FormDots form={s.form} />
                      </div>
                    </td>
                  )}
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {standings.length === 0 && teamStandings.length === 0 && (
        <p className="text-zinc-500 text-center py-4">
          No results yet. Record matches to see standings.
        </p>
      )}

      {tiebreakerText && standings.length > 0 && (
        <p className="text-xs text-zinc-400 mt-3 text-center">{tiebreakerText}</p>
      )}

      {isDoubles && teamStandings.length > 0 && standings.length > 0 && (
        <div className="mt-6 pt-6 border-t border-zinc-200">
          <h3 className="text-sm font-medium text-zinc-500 mb-3">Individual Records</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="text-left py-2 px-2 text-zinc-500 font-medium">#</th>
                  <th className="text-left py-2 px-2 text-zinc-500 font-medium">Player</th>
                  <th className="text-center py-2 px-2 text-zinc-500 font-medium">P</th>
                  <th className="text-center py-2 px-2 text-zinc-500 font-medium">W</th>
                  <th className="text-center py-2 px-2 text-zinc-500 font-medium">L</th>
                  <th className="text-center py-2 px-2 text-zinc-500 font-medium">Win%</th>
                  {showFormColumn && (
                    <th className="text-center py-2 px-2 text-zinc-500 font-medium">Form</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {standings.map((s) => (
                  <tr key={s.user_id} className="border-b border-zinc-100 last:border-0">
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-zinc-900 w-4">{s.rank}</span>
                        <MovementIndicator current={s.rank} previous={s.previousRank} />
                      </div>
                    </td>
                    <td className="py-2 px-2">
                      <Link href={`/users/${s.user_id}`} className="flex items-center gap-2 hover:text-orange-500">
                        {s.avatar_url ? (
                          <Image src={s.avatar_url} alt={s.name || "Player"} width={24} height={24} className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-zinc-300 text-white text-xs flex items-center justify-center font-medium">{getInitials(s.name)}</div>
                        )}
                        <span className="font-medium text-zinc-900">{s.name || "Anonymous"}</span>
                        <StreakBadge streak={s.streak} />
                      </Link>
                    </td>
                    <td className="py-2 px-2 text-center text-zinc-600">{s.played}</td>
                    <td className="py-2 px-2 text-center text-zinc-600">{s.wins}</td>
                    <td className="py-2 px-2 text-center text-zinc-600">{s.losses}</td>
                    <td className="py-2 px-2 text-center font-bold text-orange-500">
                      {s.played > 0 ? `${Math.round((s.wins / s.played) * 100)}%` : "0%"}
                    </td>
                    {showFormColumn && (
                      <td className="py-2 px-2">
                        <div className="flex justify-center">
                          <FormDots form={s.form} />
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
