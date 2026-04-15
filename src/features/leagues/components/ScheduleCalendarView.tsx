"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import StatusBadge from "@/components/leagues/StatusBadge";
import { getInitials } from "@/lib/league-utils";
import type { LeagueMatch } from "@/lib/league-types";
import type { ScheduleMember } from "@/features/leagues/hooks/useSchedulePage";

type Props = {
  matches: LeagueMatch[];
  members: ScheduleMember[];
};

function getStatusKey(match: LeagueMatch): string {
  return match.workflow_status || match.status;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  // 0 = Sunday
  return new Date(year, month, 1).getDay();
}

export default function ScheduleCalendarView({ matches, members }: Props) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Group matches by date
  const matchesByDate = useMemo(() => {
    const map = new Map<string, LeagueMatch[]>();
    for (const match of matches) {
      if (match.match_date) {
        const existing = map.get(match.match_date) || [];
        existing.push(match);
        map.set(match.match_date, existing);
      }
    }
    return map;
  }, [matches]);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDayOfWeek = getFirstDayOfWeek(viewYear, viewMonth);

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  function goToPrevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
    setSelectedDate(null);
  }

  function goToNextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
    setSelectedDate(null);
  }

  function goToToday() {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDate(null);
  }

  // Build calendar grid cells
  const cells: Array<{ day: number; dateStr: string } | null> = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({ day, dateStr });
  }

  const selectedMatches = selectedDate ? matchesByDate.get(selectedDate) || [] : [];

  return (
    <div>
      {/* Month navigation */}
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={goToPrevMonth}
          className="rounded-lg border border-zinc-200 p-2 text-zinc-600 transition-colors hover:bg-zinc-50"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
          </svg>
        </button>
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-zinc-900">{monthLabel}</h3>
          <button
            type="button"
            onClick={goToToday}
            className="rounded-full border border-zinc-200 px-2.5 py-0.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-50"
          >
            Today
          </button>
        </div>
        <button
          type="button"
          onClick={goToNextMonth}
          className="rounded-lg border border-zinc-200 p-2 text-zinc-600 transition-colors hover:bg-zinc-50"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 1 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="mb-1 grid grid-cols-7 text-center">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="py-1.5 text-xs font-medium text-zinc-400">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px rounded-xl border border-zinc-200 bg-zinc-200 overflow-hidden">
        {cells.map((cell, i) => {
          if (!cell) {
            return <div key={`empty-${i}`} className="bg-zinc-50 p-2 min-h-[3.5rem]" />;
          }

          const dayMatches = matchesByDate.get(cell.dateStr) || [];
          const hasMatches = dayMatches.length > 0;
          const isToday = cell.dateStr === todayStr;
          const isSelected = cell.dateStr === selectedDate;

          return (
            <button
              key={cell.dateStr}
              type="button"
              onClick={() => setSelectedDate(isSelected ? null : cell.dateStr)}
              className={`relative bg-white p-2 min-h-[3.5rem] text-left transition-colors hover:bg-orange-50/50 ${
                isSelected ? "bg-orange-50 ring-2 ring-inset ring-orange-500" : ""
              }`}
            >
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                  isToday
                    ? "bg-orange-500 text-white"
                    : isSelected
                      ? "text-orange-600 font-semibold"
                      : "text-zinc-700"
                }`}
              >
                {cell.day}
              </span>
              {hasMatches && (
                <div className="mt-0.5 flex gap-0.5">
                  {dayMatches.slice(0, 3).map((m) => {
                    const status = getStatusKey(m);
                    const dotColor =
                      status === "finalized"
                        ? "bg-emerald-500"
                        : status === "disputed"
                          ? "bg-red-500"
                          : status === "pending_confirmation"
                            ? "bg-amber-500"
                            : "bg-orange-400";
                    return (
                      <span
                        key={m.id}
                        className={`h-1.5 w-1.5 rounded-full ${dotColor}`}
                      />
                    );
                  })}
                  {dayMatches.length > 3 && (
                    <span className="text-[9px] leading-none text-zinc-400 ml-0.5">
                      +{dayMatches.length - 3}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected date popover */}
      {selectedDate && (
        <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-zinc-900">
              {new Date(`${selectedDate}T12:00:00`).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </h4>
            <span className="text-xs text-zinc-400">
              {selectedMatches.length} {selectedMatches.length === 1 ? "match" : "matches"}
            </span>
          </div>

          {selectedMatches.length === 0 ? (
            <p className="text-sm text-zinc-500">No matches on this day.</p>
          ) : (
            <div className="space-y-2">
              {selectedMatches.map((match) => {
                const teamA = match.participants.filter((p) => p.team === "A");
                const teamB = match.participants.filter((p) => p.team === "B");
                const sideANames = teamA.map((p) => p.name || "?").join(" & ");
                const sideBNames = teamB.map((p) => p.name || "?").join(" & ");
                const statusKey = getStatusKey(match);
                const statusLabel = statusKey.replace(/_/g, " ");
                const weekLabel = match.week_number ? `Week ${match.week_number}` : "";

                const memberA =
                  teamA.length === 1
                    ? members.find((m) => m.user_id === teamA[0].user_id)
                    : null;
                const memberB =
                  teamB.length === 1
                    ? members.find((m) => m.user_id === teamB[0].user_id)
                    : null;

                const sideAInitials = teamA.map((p) => getInitials(p.name)).join("");
                const sideBInitials = teamB.map((p) => getInitials(p.name)).join("");

                return (
                  <div
                    key={match.id}
                    className="relative overflow-hidden rounded-xl border border-zinc-100 bg-gradient-to-br from-white to-zinc-50 p-3"
                  >
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-orange-500/70 via-amber-400/70 to-zinc-300/70" />
                    <div className="flex items-center justify-between mb-2 pt-0.5">
                      <span className="text-xs font-medium text-zinc-500">{weekLabel}</span>
                      <StatusBadge status={statusKey} label={statusLabel} />
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Side A */}
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        {memberA?.avatar_url ? (
                          <Image
                            src={memberA.avatar_url}
                            alt={sideANames}
                            width={28}
                            height={28}
                            className="h-7 w-7 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[9px] font-bold text-white">
                            {sideAInitials || "?"}
                          </div>
                        )}
                        <span className="truncate text-sm font-medium text-zinc-900">
                          {sideANames}
                        </span>
                      </div>

                      <span className="shrink-0 text-xs font-medium text-zinc-400">vs</span>

                      {/* Side B */}
                      <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
                        <span className="truncate text-sm font-medium text-zinc-900">
                          {sideBNames}
                        </span>
                        {memberB?.avatar_url ? (
                          <Image
                            src={memberB.avatar_url}
                            alt={sideBNames}
                            width={28}
                            height={28}
                            className="h-7 w-7 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white">
                            {sideBInitials || "?"}
                          </div>
                        )}
                      </div>
                    </div>

                    {match.court && (
                      <div className="mt-1.5 flex items-center gap-1 text-xs text-zinc-400">
                        <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="m9.69 18.933.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 0 0 .281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 1 0 3 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 0 0 2.274 1.765 11.842 11.842 0 0 0 .976.544l.062.029.018.008.006.003ZM10 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" clipRule="evenodd" />
                        </svg>
                        {match.court.name}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
