"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { getApiBaseUrl } from "@/lib/api";

type AvailabilityStatus = "available" | "unavailable" | "maybe" | "unknown";

type WeekAvailability = {
  week_number: number;
  status: AvailabilityStatus;
};

type Props = {
  leagueId: string;
  seasonWeeks: number | null;
  currentUserId: string | null;
};

const STATUS_CONFIG: Record<AvailabilityStatus, { label: string; color: string; bg: string; dot: string }> = {
  available: { label: "Available", color: "text-emerald-700", bg: "bg-emerald-100 border-emerald-300", dot: "bg-emerald-500" },
  unavailable: { label: "Unavailable", color: "text-red-700", bg: "bg-red-100 border-red-300", dot: "bg-red-400" },
  maybe: { label: "Maybe", color: "text-amber-700", bg: "bg-amber-100 border-amber-300", dot: "bg-amber-400" },
  unknown: { label: "Not Set", color: "text-zinc-500", bg: "bg-zinc-100 border-zinc-200", dot: "bg-zinc-300" },
};

export default function AvailabilityCard({ leagueId, seasonWeeks, currentUserId }: Props) {
  const [availability, setAvailability] = useState<WeekAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  const totalWeeks = seasonWeeks || 10;

  const fetchAvailability = useCallback(async () => {
    if (!currentUserId) return;

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;

    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/leagues/${leagueId}/availability`,
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );

      if (response.ok) {
        const data = (await response.json()) as {
          availability: Array<{ week_number: number; status: string; user_id: string }>;
        };
        const myAvailability = (data.availability || [])
          .filter((a) => a.user_id === currentUserId)
          .map((a) => ({
            week_number: a.week_number,
            status: (["available", "unavailable", "maybe"].includes(a.status)
              ? a.status
              : "unknown") as AvailabilityStatus,
          }));
        setAvailability(myAvailability);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [leagueId, currentUserId]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  async function toggleAvailability(weekNumber: number, newStatus: AvailabilityStatus) {
    if (!currentUserId) return;
    setUpdating(weekNumber);

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setUpdating(null);
      return;
    }

    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/leagues/${leagueId}/availability`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ week_number: weekNumber, status: newStatus }),
        }
      );

      if (response.ok) {
        setAvailability((prev) => {
          const filtered = prev.filter((a) => a.week_number !== weekNumber);
          return [...filtered, { week_number: weekNumber, status: newStatus }];
        });
      }
    } catch {
      // silently fail
    } finally {
      setUpdating(null);
    }
  }

  if (!currentUserId) return null;

  const weeks = Array.from({ length: totalWeeks }, (_, i) => i + 1);

  function getWeekStatus(week: number): AvailabilityStatus {
    return availability.find((a) => a.week_number === week)?.status || "unknown";
  }

  function cycleStatus(current: AvailabilityStatus): AvailabilityStatus {
    const cycle: AvailabilityStatus[] = ["available", "maybe", "unavailable", "unknown"];
    const idx = cycle.indexOf(current);
    return cycle[(idx + 1) % cycle.length];
  }

  const setCount = availability.filter((a) => a.status !== "unknown").length;
  const availableCount = availability.filter((a) => a.status === "available").length;
  const notSetCount = totalWeeks - setCount;

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-base font-semibold text-zinc-900">My Availability</h3>
        {!loading && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            notSetCount === 0
              ? "bg-emerald-50 text-emerald-600"
              : notSetCount > totalWeeks / 2
              ? "bg-amber-50 text-amber-600"
              : "bg-zinc-100 text-zinc-500"
          }`}>
            {notSetCount === 0
              ? "All set"
              : `${notSetCount} week${notSetCount !== 1 ? "s" : ""} unset`}
          </span>
        )}
      </div>
      <p className="text-xs text-zinc-500 mb-3">Tap a week to cycle: Available &rarr; Maybe &rarr; Unavailable &rarr; Not Set</p>

      {/* Mini heatmap summary */}
      {!loading && (
        <div className="flex items-center gap-1 mb-4">
          {weeks.map((week) => {
            const status = getWeekStatus(week);
            return (
              <div
                key={week}
                className={`h-2 flex-1 rounded-full ${STATUS_CONFIG[status].dot}`}
                title={`Wk ${week}: ${STATUS_CONFIG[status].label}`}
              />
            );
          })}
        </div>
      )}

      {/* Legend */}
      {!loading && (
        <div className="flex items-center gap-3 mb-4 text-[10px] text-zinc-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />{availableCount} available</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" />{availability.filter((a) => a.status === "maybe").length} maybe</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" />{availability.filter((a) => a.status === "unavailable").length} unavailable</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 animate-pulse rounded-lg bg-zinc-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {weeks.map((week) => {
            const status = getWeekStatus(week);
            const config = STATUS_CONFIG[status];
            const isUpdating = updating === week;

            return (
              <button
                key={week}
                type="button"
                disabled={isUpdating}
                onClick={() => toggleAvailability(week, cycleStatus(status))}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${config.bg} ${
                  isUpdating ? "opacity-50" : "hover:opacity-80"
                }`}
              >
                <span className="text-zinc-700">Wk {week}</span>
                <span className={config.color}>{config.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
