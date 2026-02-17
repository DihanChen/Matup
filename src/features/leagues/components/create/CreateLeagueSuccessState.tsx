"use client";

import Link from "next/link";
import { ActivityIcon } from "@/components/create-event/ActivityCard";
import type { LeagueCreateFormData } from "@/features/leagues/components/create/types";

type Props = {
  formData: LeagueCreateFormData;
  createdLeagueId: string | null;
  onShare: () => void;
};

function formatTimeDisplay(time: string): string {
  if (!time) return "";
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function getSportLabel(formData: LeagueCreateFormData): string {
  if (formData.sportType === "pickleball") return "Pickleball";
  if (formData.sportType === "tennis") return "Tennis";
  if (formData.sportType === "running") return "Running";
  return "League";
}

function getFormatLabel(formData: LeagueCreateFormData): string {
  if (formData.sportType === "running") {
    return formData.runningComparisonMode === "personal_progress"
      ? "Personal Progress"
      : "Absolute Performance";
  }
  if (formData.matchType === "doubles") {
    return formData.rotationType === "assigned"
      ? "Doubles (Assigned)"
      : "Doubles (Random)";
  }
  if (formData.matchType === "singles") return "Singles";
  return "Season League";
}

export default function CreateLeagueSuccessState({
  formData,
  createdLeagueId,
  onShare,
}: Props) {
  const sportLabel = getSportLabel(formData);
  const formatLabel = getFormatLabel(formData);
  const startDateLabel = formData.startDate
    ? new Date(`${formData.startDate}T00:00:00`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Not set";
  const startTimeLabel = formData.startTime ? formatTimeDisplay(formData.startTime) : "";

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-lg mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center">
        <div className="w-24 h-24 bg-lime-300 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-zinc-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-zinc-900 mb-2">
          League <span className="text-orange-500">Created!</span>
        </h1>
        <p className="text-zinc-400 mb-8">
          Your league is live and ready for invites.
          <br />
          Open it now to manage teams and schedule.
        </p>

        {createdLeagueId && (
          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden text-left mb-6">
            <div className="bg-zinc-100 p-4 border-b border-zinc-200">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-zinc-900">
                    {formData.name || `${sportLabel} League`}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    {formData.description || "No description added yet."}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-800">
                  <ActivityIcon id={formData.sportType || "tennis"} className="w-5 h-5" />
                </div>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                <span className="text-xs font-medium bg-zinc-100 text-zinc-700 px-2.5 py-1 rounded-full">
                  {sportLabel}
                </span>
                <span className="text-xs font-medium bg-zinc-100 text-zinc-700 px-2.5 py-1 rounded-full">
                  {formatLabel}
                </span>
                <span className="text-xs font-medium bg-zinc-100 text-zinc-700 px-2.5 py-1 rounded-full">
                  {formData.seasonWeeks} weeks
                </span>
              </div>
              <div className="text-xs text-zinc-500">
                Starts {startDateLabel}
                {startTimeLabel ? ` at ${startTimeLabel}` : ""}
                {" · "}
                Max {formData.maxMembers} members
              </div>
              <div className="flex items-center justify-between pt-1">
                <div className="text-xs text-zinc-500">Ready for players</div>
                <Link
                  href={`/leagues/${createdLeagueId}`}
                  className="px-5 py-2 bg-zinc-900 text-white text-sm font-medium rounded-full hover:bg-zinc-800 transition-colors"
                >
                  Open League
                </Link>
              </div>
            </div>
            <div className="border-t border-zinc-100">
              <Link
                href="/leagues"
                className="block text-center py-3 text-sm text-zinc-500 hover:text-zinc-700 font-medium transition-colors"
              >
                View Leagues
              </Link>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onShare}
          className="w-full py-3.5 bg-zinc-900 text-white rounded-full font-medium hover:bg-zinc-800 transition-colors"
        >
          Share with friends
        </button>
      </main>
    </div>
  );
}
