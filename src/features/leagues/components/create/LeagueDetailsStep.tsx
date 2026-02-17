"use client";

import type { LeagueCreateFormData } from "@/features/leagues/components/create/types";

type Props = {
  formData: LeagueCreateFormData;
  onUpdateFormData: (updates: Partial<LeagueCreateFormData>) => void;
};

export default function LeagueDetailsStep({ formData, onUpdateFormData }: Props) {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-zinc-900 text-center mb-8 sm:mb-10">
        League <span className="text-orange-500">details</span>
      </h1>

      <div className="space-y-6 max-w-md mx-auto">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
            <span className="text-sm font-bold text-zinc-900">League Name</span>
          </div>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => onUpdateFormData({ name: e.target.value })}
            placeholder={
              formData.sportType === "running"
                ? "e.g. Sunday Morning Run Club"
                : formData.sportType === "pickleball"
                ? "e.g. Wednesday Pickleball Ladder"
                : formData.matchType === "doubles"
                ? "e.g. Saturday Doubles League"
                : "e.g. Weekend Tennis Singles"
            }
            className="w-full px-4 py-3 border border-zinc-200 rounded-2xl bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
            </svg>
            <span className="text-sm font-bold text-zinc-900">Description <span className="text-zinc-400 font-normal">(optional)</span></span>
          </div>
          <textarea
            value={formData.description}
            onChange={(e) => onUpdateFormData({ description: e.target.value })}
            rows={3}
            placeholder={
              formData.sportType === "running"
                ? "Weekly group runs for all levels with timed results"
                : formData.sportType === "pickleball"
                ? "Competitive pickleball league with weekly matchups and standings"
                : "Friendly tennis league for all levels"
            }
            className="w-full px-4 py-3 border border-zinc-200 rounded-2xl bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none"
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
            </svg>
            <span className="text-sm font-bold text-zinc-900">Max Members: <span className="text-orange-500">{formData.maxMembers}</span></span>
          </div>
          <input
            type="range"
            min="4"
            max="50"
            value={formData.maxMembers}
            onChange={(e) => onUpdateFormData({ maxMembers: parseInt(e.target.value, 10) })}
            className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
          <div className="flex justify-between text-xs text-zinc-400 mt-1">
            <span>4</span>
            <span>50</span>
          </div>
        </div>
      </div>
    </div>
  );
}
