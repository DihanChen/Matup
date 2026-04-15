"use client";

import { useMemo } from "react";
import type { LeagueMatch } from "@/lib/league-types";

type BracketFixture = LeagueMatch & {
  round: number;
  matchNumber: number;
  roundLabel: string;
  totalRounds: number;
  isBye: boolean;
  nextFixtureId: string | null;
};

type Props = {
  matches: LeagueMatch[];
};

function extractBracketData(match: LeagueMatch): {
  round: number;
  matchNumber: number;
  roundLabel: string;
  totalRounds: number;
  isBye: boolean;
  nextFixtureId: string | null;
} | null {
  // Tournament metadata is stored when fixture_type = 'tournament_match'
  // and metadata contains { tournament: true, round, match_number, round_label, total_rounds }
  // We access this through the match object — check if it has extended metadata
  // The metadata comes through as part of the fixture data
  const m = match as LeagueMatch & { metadata?: Record<string, unknown> };
  const meta = m.metadata;
  if (!meta || meta.tournament !== true) return null;

  return {
    round: typeof meta.round === "number" ? meta.round : 0,
    matchNumber: typeof meta.match_number === "number" ? meta.match_number : 0,
    roundLabel: typeof meta.round_label === "string" ? meta.round_label : `Round ${meta.round}`,
    totalRounds: typeof meta.total_rounds === "number" ? meta.total_rounds : 0,
    isBye: meta.is_bye === true,
    nextFixtureId: typeof meta.next_fixture_id === "string" ? meta.next_fixture_id : null,
  };
}

function getPlayerNames(match: LeagueMatch, side: string): string {
  const players = match.participants.filter((p) => p.team === side);
  if (players.length === 0) return "TBD";
  return players.map((p) => p.name || "?").join(" & ");
}

function getWinnerSide(match: LeagueMatch): string | null {
  return match.winner;
}

export default function BracketView({ matches }: Props) {
  const bracketFixtures = useMemo(() => {
    const fixtures: BracketFixture[] = [];
    for (const match of matches) {
      const data = extractBracketData(match);
      if (data) {
        fixtures.push({ ...match, ...data });
      }
    }
    return fixtures.sort((a, b) => a.matchNumber - b.matchNumber);
  }, [matches]);

  const rounds = useMemo(() => {
    const roundMap = new Map<number, BracketFixture[]>();
    for (const f of bracketFixtures) {
      const list = roundMap.get(f.round) || [];
      list.push(f);
      roundMap.set(f.round, list);
    }
    return [...roundMap.entries()]
      .sort(([a], [b]) => a - b)
      .map(([roundNum, fixtures]) => ({
        roundNum,
        label: fixtures[0]?.roundLabel || `Round ${roundNum}`,
        fixtures,
      }));
  }, [bracketFixtures]);

  if (bracketFixtures.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-12 text-center">
        <p className="text-sm text-zinc-500">No tournament bracket available.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-6 min-w-max">
        {rounds.map((round) => {
          return (
            <div key={round.roundNum} className="flex flex-col" style={{ minWidth: 240 }}>
              {/* Round header */}
              <div className="mb-3 text-center">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  {round.label}
                </span>
              </div>

              {/* Matches */}
              <div
                className="flex flex-col justify-around flex-1 gap-3"
              >
                {round.fixtures.map((fixture) => {
                  const sideANames = getPlayerNames(fixture, "A");
                  const sideBNames = getPlayerNames(fixture, "B");
                  const winner = getWinnerSide(fixture);
                  const isFinalized = fixture.workflow_status === "finalized" || fixture.status === "completed";
                  const isBye = fixture.isBye;

                  if (isBye) {
                    const advancingPlayer = sideANames !== "TBD" ? sideANames : sideBNames;
                    return (
                      <div
                        key={fixture.id}
                        className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 p-3"
                      >
                        <div className="text-center">
                          <span className="text-xs text-zinc-400">BYE</span>
                          <div className="mt-1 text-sm font-medium text-zinc-600">
                            {advancingPlayer} advances
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={fixture.id}
                      className={`rounded-xl border bg-white shadow-sm overflow-hidden ${
                        isFinalized ? "border-emerald-200" : "border-zinc-200"
                      }`}
                    >
                      {/* Side A */}
                      <div
                        className={`flex items-center justify-between px-3 py-2 border-b border-zinc-100 ${
                          isFinalized && winner === "A"
                            ? "bg-emerald-50"
                            : isFinalized && winner === "B"
                              ? "bg-zinc-50 opacity-60"
                              : ""
                        }`}
                      >
                        <span
                          className={`text-sm truncate ${
                            isFinalized && winner === "A" ? "font-semibold text-emerald-700" : "text-zinc-700"
                          }`}
                        >
                          {sideANames}
                        </span>
                        {isFinalized && winner === "A" && (
                          <svg className="h-3.5 w-3.5 shrink-0 text-emerald-500 ml-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>

                      {/* Side B */}
                      <div
                        className={`flex items-center justify-between px-3 py-2 ${
                          isFinalized && winner === "B"
                            ? "bg-emerald-50"
                            : isFinalized && winner === "A"
                              ? "bg-zinc-50 opacity-60"
                              : ""
                        }`}
                      >
                        <span
                          className={`text-sm truncate ${
                            isFinalized && winner === "B" ? "font-semibold text-emerald-700" : "text-zinc-700"
                          }`}
                        >
                          {sideBNames}
                        </span>
                        {isFinalized && winner === "B" && (
                          <svg className="h-3.5 w-3.5 shrink-0 text-emerald-500 ml-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>

                      {/* Status bar */}
                      {!isFinalized && sideANames !== "TBD" && sideBNames !== "TBD" && (
                        <div className="border-t border-zinc-100 px-3 py-1 bg-zinc-50">
                          <span className="text-[10px] font-medium text-zinc-400 uppercase">
                            {fixture.workflow_status?.replace(/_/g, " ") || "Scheduled"}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
