"use client";

import type { LeagueCreateFormData } from "@/features/leagues/components/create/types";

type Props = {
  formData: LeagueCreateFormData;
  onUpdateFormData: (updates: Partial<LeagueCreateFormData>) => void;
};

export default function ScheduleStep({ formData, onUpdateFormData }: Props) {
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
      </div>
    </div>
  );
}
