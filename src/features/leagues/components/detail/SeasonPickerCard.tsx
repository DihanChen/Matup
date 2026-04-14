"use client";

import { useState } from "react";
import type { LeagueDetailContentProps } from "@/features/leagues/components/detail/types";

type Props = {
  data: LeagueDetailContentProps;
};

export default function SeasonPickerCard({ data }: Props) {
  const {
    seasons,
    selectedSeasonId,
    onSeasonChange,
    onCreateNewSeason,
    creatingNewSeason,
    isOwnerOrAdmin,
    league,
  } = data;

  const [showNewSeasonInput, setShowNewSeasonInput] = useState(false);
  const [newSeasonName, setNewSeasonName] = useState("");

  if (seasons.length === 0 && !isOwnerOrAdmin) return null;
  if (league.league_type === "tournament") return null;

  const currentSeason = seasons.find((s) => s.id === selectedSeasonId);

  function handleCreateSeason() {
    onCreateNewSeason(newSeasonName.trim() || undefined);
    setNewSeasonName("");
    setShowNewSeasonInput(false);
  }

  return (
    <div className="bg-white rounded-3xl border border-zinc-200 p-6">
      <h2 className="text-sm font-medium text-zinc-500 mb-4">Season</h2>

      {seasons.length > 1 ? (
        <select
          value={selectedSeasonId || ""}
          onChange={(e) => onSeasonChange(e.target.value || null)}
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
        >
          <option value="">All seasons</option>
          {seasons.map((season) => (
            <option key={season.id} value={season.id}>
              {season.name || `Season ${season.season_number}`}
              {season.status === "active" ? " (Current)" : ""}
            </option>
          ))}
        </select>
      ) : seasons.length === 1 ? (
        <p className="text-sm font-medium text-zinc-900">
          {currentSeason?.name || `Season ${currentSeason?.season_number}`}
          {currentSeason?.status === "active" && (
            <span className="ml-2 text-xs font-normal text-emerald-600">Active</span>
          )}
        </p>
      ) : (
        <p className="text-sm text-zinc-400">No seasons yet</p>
      )}

      {isOwnerOrAdmin && (
        <div className="mt-4">
          {showNewSeasonInput ? (
            <div className="space-y-2">
              <input
                type="text"
                value={newSeasonName}
                onChange={(e) => setNewSeasonName(e.target.value)}
                placeholder="Season name (optional)"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCreateSeason}
                  disabled={creatingNewSeason}
                  className="flex-1 rounded-full bg-zinc-900 px-3 py-2 text-xs font-medium text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  {creatingNewSeason ? "Creating..." : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewSeasonInput(false);
                    setNewSeasonName("");
                  }}
                  className="rounded-full border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowNewSeasonInput(true)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
              </svg>
              New Season
            </button>
          )}
        </div>
      )}
    </div>
  );
}
