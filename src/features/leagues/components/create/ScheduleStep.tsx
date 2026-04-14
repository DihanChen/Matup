"use client";

import { useCallback, useState } from "react";
import { QUICK_TIMES } from "@/features/events/components/create/constants";
import type { LeagueCreateFormData } from "@/features/leagues/components/create/types";
import { createClient } from "@/lib/supabase";

type CourtOption = {
  id: string;
  name: string;
  address: string;
};

type Props = {
  formData: LeagueCreateFormData;
  onUpdateFormData: (updates: Partial<LeagueCreateFormData>) => void;
};

export default function ScheduleStep({ formData, onUpdateFormData }: Props) {
  const [courts, setCourts] = useState<CourtOption[]>([]);
  const [courtsLoading, setCourtsLoading] = useState(false);
  const [courtsLoaded, setCourtsLoaded] = useState(false);

  const loadCourts = useCallback(async () => {
    if (courtsLoaded) return;
    setCourtsLoading(true);
    setCourtsLoaded(true);
    const supabase = createClient();
    const sportFilter =
      formData.sportType === "tennis"
        ? "tennis"
        : formData.sportType === "pickleball"
        ? "pickleball"
        : null;

    let query = supabase
      .from("courts")
      .select("id, name, address")
      .eq("status", "approved")
      .order("name")
      .limit(50);

    if (sportFilter) {
      query = query.contains("sport_types", [sportFilter]);
    }

    const { data } = await query;
    setCourts((data || []) as CourtOption[]);
    setCourtsLoading(false);
  }, [formData.sportType, courtsLoaded]);

  // Load courts on first render via onFocus pattern
  if (!courtsLoaded && !courtsLoading) {
    loadCourts();
  }

  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-zinc-900 text-center mb-8 sm:mb-10">
        Set the <span className="text-orange-500">schedule</span>
      </h1>

      <div className="space-y-6 max-w-md mx-auto">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25" />
            </svg>
            <span className="text-sm font-bold text-zinc-900">Start Date</span>
          </div>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => onUpdateFormData({ startDate: e.target.value })}
            className="w-full px-4 py-3 border border-zinc-200 rounded-2xl bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <span className="text-sm font-bold text-zinc-900">Start Time</span>
          </div>
          <div className="overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
            <div className="flex gap-2 w-max">
              {QUICK_TIMES.map((time) => (
                <button
                  key={time.value}
                  type="button"
                  onClick={() => onUpdateFormData({ startTime: time.value })}
                  className={`flex-shrink-0 py-2 px-4 rounded-full text-xs sm:text-sm font-medium transition-all ${
                    formData.startTime === time.value
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                  }`}
                >
                  {time.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <span className="text-sm font-bold text-zinc-900">Season Length: <span className="text-orange-500">{formData.seasonWeeks} weeks</span></span>
          </div>
          <input
            type="range"
            min="4"
            max="52"
            value={formData.seasonWeeks}
            onChange={(e) => onUpdateFormData({ seasonWeeks: parseInt(e.target.value, 10) })}
            className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
          <div className="flex justify-between text-xs text-zinc-400 mt-1">
            <span>4 weeks</span>
            <span>52 weeks</span>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
            <span className="text-sm font-bold text-zinc-900">Home Venue <span className="text-zinc-400 font-normal">(optional)</span></span>
          </div>
          {courtsLoading ? (
            <div className="w-full px-4 py-3 border border-zinc-200 rounded-2xl bg-zinc-50 text-zinc-400 text-sm">
              Loading venues...
            </div>
          ) : courts.length > 0 ? (
            <select
              value={formData.defaultCourtId}
              onChange={(e) => {
                const court = courts.find((c) => c.id === e.target.value);
                onUpdateFormData({
                  defaultCourtId: e.target.value,
                  defaultCourtName: court?.name || "",
                });
              }}
              className="w-full px-4 py-3 border border-zinc-200 rounded-2xl bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            >
              <option value="">No default venue</option>
              {courts.map((court) => (
                <option key={court.id} value={court.id}>
                  {court.name} — {court.address}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-zinc-400">No approved venues available yet.</p>
          )}
          {formData.defaultCourtName && (
            <p className="text-xs text-zinc-500 mt-1">All fixtures will default to {formData.defaultCourtName}</p>
          )}
        </div>
      </div>
    </div>
  );
}
