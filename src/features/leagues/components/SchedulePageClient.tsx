"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import StatusBadge from "@/components/leagues/StatusBadge";
import ScheduleCalendarView from "@/features/leagues/components/ScheduleCalendarView";
import { useSchedulePage } from "@/features/leagues/hooks/useSchedulePage";
import { getInitials } from "@/lib/league-utils";
import type { LeagueMatch } from "@/lib/league-types";

const PAGE_SIZE = 100;

function getStatusKey(match: LeagueMatch): string {
  if (match.workflow_status) {
    return match.workflow_status;
  }
  return match.status;
}

function getSortableDateValue(matchDate: string | null): number {
  if (!matchDate) return Number.MAX_SAFE_INTEGER;
  const parsed = new Date(`${matchDate}T00:00:00`).getTime();
  return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
}

export default function SchedulePageClient() {
  const { leagueId, league, members, matches, loading, currentUserId } = useSchedulePage();

  const [searchValue, setSearchValue] = useState("");
  const [weekFilter, setWeekFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [myMatchesOnly, setMyMatchesOnly] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const normalizedSearch = searchValue.trim().toLowerCase();

  const matchCards = useMemo(() => {
    return [...matches]
      .sort((a, b) => {
        const dateA = getSortableDateValue(a.match_date);
        const dateB = getSortableDateValue(b.match_date);
        if (dateA !== dateB) return dateA - dateB;
        return (a.week_number ?? 10_000) - (b.week_number ?? 10_000);
      })
      .map((match) => {
        const teamA = match.participants.filter((p) => p.team === "A");
        const teamB = match.participants.filter((p) => p.team === "B");
        const sideANames = teamA.map((p) => p.name || "?").join(" & ");
        const sideBNames = teamB.map((p) => p.name || "?").join(" & ");
        const statusKey = getStatusKey(match);
        const statusLabel = statusKey.replace(/_/g, " ");
        const weekKey = match.week_number ? String(match.week_number) : "none";
        const searchBlob = `${sideANames} ${sideBNames} ${statusLabel} ${match.week_number ?? ""}`.toLowerCase();

        return {
          match,
          teamA,
          teamB,
          sideANames,
          sideBNames,
          statusKey,
          statusLabel,
          weekKey,
          searchBlob,
        };
      });
  }, [matches]);

  const weekOptions = useMemo(() => {
    return [...new Set(matchCards.map((item) => item.weekKey))];
  }, [matchCards]);

  const statusOptions = useMemo(() => {
    return [...new Set(matchCards.map((item) => item.statusKey))];
  }, [matchCards]);

  const filteredMatches = useMemo(() => {
    return matchCards.filter((item) => {
      if (weekFilter !== "all" && item.weekKey !== weekFilter) return false;
      if (statusFilter !== "all" && item.statusKey !== statusFilter) return false;
      if (normalizedSearch && !item.searchBlob.includes(normalizedSearch)) return false;
      if (myMatchesOnly && currentUserId) {
        const isParticipant = item.match.participants.some(
          (p) => p.user_id === currentUserId
        );
        if (!isParticipant) return false;
      }
      return true;
    });
  }, [matchCards, normalizedSearch, statusFilter, weekFilter, myMatchesOnly, currentUserId]);

  const visibleMatches = filteredMatches.slice(0, visibleCount);
  const hasMore = filteredMatches.length > visibleCount;

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="space-y-4">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-zinc-200" />
          <div className="h-4 w-32 animate-pulse rounded bg-zinc-100" />
          <div className="mt-8 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-zinc-100" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!league) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Back link */}
      <Link
        href={`/leagues/${leagueId}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
        </svg>
        Back to {league.name}
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">Full Schedule</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {filteredMatches.length} {filteredMatches.length === 1 ? "match" : "matches"}
          {normalizedSearch || weekFilter !== "all" || statusFilter !== "all" ? " matching filters" : " total"}
        </p>
      </div>

      {/* Controls row: My Matches toggle + View mode toggle */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          {currentUserId && (
            <button
              type="button"
              onClick={() => {
                setMyMatchesOnly((prev) => !prev);
                setVisibleCount(PAGE_SIZE);
              }}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                myMatchesOnly
                  ? "bg-orange-500 text-white"
                  : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
              </svg>
              My Matches
            </button>
          )}
        </div>

        {/* List / Calendar toggle */}
        <div className="flex rounded-lg border border-zinc-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === "list"
                ? "bg-zinc-900 text-white"
                : "bg-white text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M2 3.75A.75.75 0 0 1 2.75 3h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 3.75Zm0 4.167a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Zm0 4.166a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Zm0 4.167a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
            </svg>
            List
          </button>
          <button
            type="button"
            onClick={() => setViewMode("calendar")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === "calendar"
                ? "bg-zinc-900 text-white"
                : "bg-white text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75Z" clipRule="evenodd" />
            </svg>
            Calendar
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 grid gap-2 sm:grid-cols-4">
        <input
          type="text"
          value={searchValue}
          onChange={(e) => {
            setSearchValue(e.target.value);
            setVisibleCount(PAGE_SIZE);
          }}
          placeholder="Search by player name..."
          className="sm:col-span-2 px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-sm text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
        <select
          value={weekFilter}
          onChange={(e) => {
            setWeekFilter(e.target.value);
            setVisibleCount(PAGE_SIZE);
          }}
          className="px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-sm text-zinc-700 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        >
          <option value="all">All Weeks</option>
          {weekOptions.map((weekKey) => (
            <option key={weekKey} value={weekKey}>
              {weekKey === "none" ? "No Week" : `Week ${weekKey}`}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setVisibleCount(PAGE_SIZE);
          }}
          className="px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-sm text-zinc-700 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        >
          <option value="all">All Statuses</option>
          {statusOptions.map((statusKey) => (
            <option key={statusKey} value={statusKey}>
              {statusKey.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      {/* Clear filters */}
      {(normalizedSearch || weekFilter !== "all" || statusFilter !== "all" || myMatchesOnly) && (
        <button
          type="button"
          onClick={() => {
            setSearchValue("");
            setWeekFilter("all");
            setStatusFilter("all");
            setMyMatchesOnly(false);
            setVisibleCount(PAGE_SIZE);
          }}
          className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
          Clear Filters
        </button>
      )}

      {/* Calendar view */}
      {viewMode === "calendar" ? (
        <ScheduleCalendarView matches={filteredMatches.map((item) => item.match)} members={members} />
      ) : (
      <>
      {/* Match list */}
      {visibleMatches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-12 text-center">
          <p className="text-sm text-zinc-500">
            {matches.length === 0
              ? "No matches scheduled yet."
              : "No matches match your filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleMatches.map((item) => {
            const sideAInitials = item.teamA.map((p) => getInitials(p.name)).join("");
            const sideBInitials = item.teamB.map((p) => getInitials(p.name)).join("");
            const courtLabel = item.match.week_number
              ? `Week ${item.match.week_number}`
              : "Scheduled Match";

            const memberA = item.teamA.length === 1
              ? members.find((m) => m.user_id === item.teamA[0].user_id)
              : null;
            const memberB = item.teamB.length === 1
              ? members.find((m) => m.user_id === item.teamB[0].user_id)
              : null;

            return (
              <div
                key={item.match.id}
                className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-4 shadow-sm"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500/70 via-amber-400/70 to-zinc-300/70" />
                <div className="pt-1.5">
                  {/* Top row: label + status */}
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-zinc-900">{courtLabel}</span>
                      {item.match.match_date && (
                        <span className="text-xs text-zinc-400">
                          {new Date(`${item.match.match_date}T12:00:00`).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                    <StatusBadge status={item.statusKey} label={item.statusLabel} />
                  </div>

                  {/* Players row */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    {/* Side A */}
                    <div className="flex min-w-0 flex-1 items-center gap-2.5">
                      {memberA?.avatar_url ? (
                        <Image
                          src={memberA.avatar_url}
                          alt={item.sideANames}
                          width={32}
                          height={32}
                          className="h-8 w-8 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-white">
                          {sideAInitials || "?"}
                        </div>
                      )}
                      <span className="truncate text-sm font-medium text-zinc-900">
                        {item.sideANames}
                      </span>
                    </div>

                    {/* Center */}
                    <span className="shrink-0 text-xs font-medium text-zinc-400">vs</span>

                    {/* Side B */}
                    <div className="flex min-w-0 flex-1 items-center justify-end gap-2.5">
                      <span className="truncate text-sm font-medium text-zinc-900">
                        {item.sideBNames}
                      </span>
                      {memberB?.avatar_url ? (
                        <Image
                          src={memberB.avatar_url}
                          alt={item.sideBNames}
                          width={32}
                          height={32}
                          className="h-8 w-8 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                          {sideBInitials || "?"}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Winner display for completed matches */}
                  {item.match.status === "completed" && item.match.winner && (
                    <div className="mt-2">
                      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                        Winner: {item.match.winner === "A" ? item.sideANames : item.sideBNames}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <button
          type="button"
          onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
          className="mt-6 w-full rounded-full border border-zinc-200 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          Load More ({filteredMatches.length - visibleCount} remaining)
        </button>
      )}
      </>
      )}
    </div>
  );
}
