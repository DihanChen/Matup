"use client";

import Image from "next/image";
import Link from "next/link";
import { ACTIVITIES } from "@/components/create-event/ActivityCard";
import {
  VIBE_OPTIONS,
  formatTimeDisplay,
  getCoverSrcForSport,
} from "@/features/events/components/create/constants";
import type { EventCreateFormData } from "@/features/events/components/create/types";

type Props = {
  formData: EventCreateFormData;
  createdEventId: string | null;
  onShare: () => void;
};

export default function CreateEventSuccessState({ formData, createdEventId, onShare }: Props) {
  const activity = ACTIVITIES.find((a) => a.id === formData.sportType);
  const vibeLabel = VIBE_OPTIONS.find((v) => v.value === formData.skillLevel)?.label || "Casual";

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-lg mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center">
        <div className="w-24 h-24 bg-lime-300 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-zinc-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-zinc-900 mb-2">
          Game <span className="text-orange-500">On!</span>
        </h1>
        <p className="text-zinc-400 mb-8">
          Your session is live! Invite your squad or
          <br />
          wait for the community to join.
        </p>

        {createdEventId && (
          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden text-left mb-6">
            <div className="bg-zinc-100 h-36 relative overflow-hidden">
              <Image
                src={getCoverSrcForSport(formData.sportType)}
                alt={`${formData.sportType} cover`}
                fill
                sizes="(max-width: 768px) 100vw, 400px"
                quality={75}
                className="object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <div className="absolute top-3 left-3 flex gap-1.5">
                <span className="text-xs font-medium bg-white/90 text-zinc-700 px-2.5 py-1 rounded-full">{vibeLabel}</span>
                <span className="text-xs font-medium bg-white/90 text-zinc-700 px-2.5 py-1 rounded-full capitalize">{activity?.name}</span>
              </div>
              <div className="absolute top-3 right-3">
                <span className="text-xs font-medium bg-white/90 text-zinc-700 px-2.5 py-1 rounded-full">
                  0/{formData.maxParticipants}
                </span>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
                <span>{formData.location.split(",")[0]}</span>
              </div>
              <h3 className="font-semibold text-zinc-900 mb-1">{formData.title || `${activity?.name} at ${formData.location.split(",")[0]}`}</h3>
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-3">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25" />
                </svg>
                <span>
                  {formData.date &&
                    new Date(`${formData.date}T00:00:00`).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })}
                  {formData.time && ` · ${formatTimeDisplay(formData.time)}`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-zinc-200 border-2 border-white" />
                  <div className="w-8 h-8 rounded-full bg-zinc-900 border-2 border-white" />
                </div>
                <Link
                  href={`/events/${createdEventId}`}
                  className="px-5 py-2 bg-zinc-900 text-white text-sm font-medium rounded-full hover:bg-zinc-800 transition-colors"
                >
                  Join
                </Link>
              </div>
            </div>
            <div className="border-t border-zinc-100">
              <Link
                href="/events"
                className="block text-center py-3 text-sm text-zinc-500 hover:text-zinc-700 font-medium transition-colors"
              >
                View Events
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
