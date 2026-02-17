"use client";

import Image from "next/image";
import Link from "next/link";
import type { LeagueDetailContentProps } from "@/features/leagues/components/detail/types";
import { getInitials } from "@/lib/league-utils";

type Props = {
  data: LeagueDetailContentProps;
};

export default function StandingsCard({ data }: Props) {
  const {
    league,
    isDoubles,
    isRacketLeague,
    isRunningProgressMode,
    standings,
    teamStandings,
    hasRecentResults,
  } = data;

  return (
    <div
      className={`${
        hasRecentResults ? "md:col-span-7" : "md:col-span-12"
      } bg-white rounded-2xl border border-zinc-200 p-4 sm:p-6`}
    >
      <h2 className="text-lg font-semibold text-zinc-900 mb-4">
        {isDoubles ? "Team Standings" : "Standings"}
      </h2>

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
                        <div className="w-6 h-6 rounded-full bg-zinc-300 text-white text-xs flex items-center justify-center font-medium">
                          {getInitials(s.name)}
                        </div>
                      )}
                      <span className="font-medium text-zinc-900">{s.name || "Anonymous"}</span>
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
  );
}
