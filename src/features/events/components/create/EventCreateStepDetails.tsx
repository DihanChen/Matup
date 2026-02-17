"use client";

import Image from "next/image";
import { StepLabel } from "@/components/create-event/StepIndicator";
import {
  VIBE_OPTIONS,
  getCoverSrcForSport,
} from "@/features/events/components/create/constants";
import type { EventCreateFormData } from "@/features/events/components/create/types";

type Props = {
  formData: EventCreateFormData;
  showNote: boolean;
  showVibe: boolean;
  setShowNote: (value: boolean) => void;
  setShowVibe: (value: boolean) => void;
  onUpdateFormData: (updates: Partial<EventCreateFormData>) => void;
};

export default function EventCreateStepDetails({
  formData,
  showNote,
  showVibe,
  setShowNote,
  setShowVibe,
  onUpdateFormData,
}: Props) {
  return (
    <div className="animate-fadeIn">
      <StepLabel step={3} />

      <div className="grid md:grid-cols-2 gap-6 md:gap-8">
        <div className="space-y-6">
          <div className="border border-zinc-200 rounded-2xl p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => onUpdateFormData({ maxParticipants: Math.max(2, formData.maxParticipants - 1) })}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-zinc-200 flex items-center justify-center text-zinc-600 hover:border-zinc-400 transition-colors text-lg sm:text-xl font-bold"
              >
                −
              </button>
              <div className="text-center">
                <div className="text-4xl sm:text-5xl font-bold text-zinc-900">{formData.maxParticipants}</div>
                <div className="text-sm text-zinc-400 mt-1">Needed</div>
              </div>
              <button
                type="button"
                onClick={() => onUpdateFormData({ maxParticipants: Math.min(50, formData.maxParticipants + 1) })}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-zinc-200 flex items-center justify-center text-zinc-600 hover:border-zinc-400 transition-colors text-lg sm:text-xl font-bold"
              >
                +
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg font-bold text-zinc-900">Vibe</span>
              <button
                type="button"
                onClick={() => setShowVibe(!showVibe)}
                className={`relative w-11 h-6 rounded-full transition-colors ${showVibe ? "bg-zinc-900" : "bg-zinc-300"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${showVibe ? "translate-x-5" : ""}`} />
              </button>
            </div>
            {showVibe && (
              <div className="space-y-2">
                {VIBE_OPTIONS.map((vibe) => (
                  <button
                    key={vibe.value}
                    type="button"
                    onClick={() => onUpdateFormData({ skillLevel: vibe.value })}
                    className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                      formData.skillLevel === vibe.value
                        ? "border-zinc-900"
                        : "border-zinc-100 hover:border-zinc-200"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${vibe.color}`}>
                      {vibe.value === "all" && (
                        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75S14.418 9 14.625 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
                        </svg>
                      )}
                      {vibe.value === "intermediate" && (
                        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
                        </svg>
                      )}
                      {vibe.value === "advanced" && (
                        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0 1 16.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.003 6.003 0 0 1-2.27.94m2.27-.94a17.957 17.957 0 0 0 3.485-2.269" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-zinc-900">{vibe.label}</div>
                      <div className="text-xs text-zinc-500">{vibe.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg font-bold text-zinc-900">Add a note</span>
              <button
                type="button"
                onClick={() => setShowNote(!showNote)}
                className={`relative w-11 h-6 rounded-full transition-colors ${showNote ? "bg-zinc-900" : "bg-zinc-300"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${showNote ? "translate-x-5" : ""}`} />
              </button>
            </div>
            {showNote && (
              <textarea
                value={formData.description}
                onChange={(e) => onUpdateFormData({ description: e.target.value })}
                rows={4}
                placeholder="e.g. Bring water and light-colored shirt..."
                className="w-full px-4 py-3 border border-zinc-200 rounded-2xl bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none"
              />
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-zinc-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M2.25 18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V6A2.25 2.25 0 0 0 19.5 3.75h-15A2.25 2.25 0 0 0 2.25 6v12Z" />
              </svg>
              <span className="text-lg font-bold text-zinc-900">Cover</span>
            </div>
            <div className="relative h-[160px] sm:h-[200px] rounded-2xl overflow-hidden bg-zinc-100">
              <Image
                src={getCoverSrcForSport(formData.sportType)}
                alt={`${formData.sportType} cover`}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                quality={75}
                className="object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/30 cursor-pointer">
                <div className="text-center text-white">
                  <svg className="w-8 h-8 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                  </svg>
                  <p className="text-sm font-medium">Change cover</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 sm:p-5 border border-zinc-200 rounded-2xl">
            <div>
              <div className="font-semibold text-zinc-900">Instant Booking</div>
              <div className="text-xs text-zinc-500 mt-0.5">Players join without your manual approval</div>
            </div>
            <div className="relative w-11 h-6 rounded-full bg-zinc-900 cursor-pointer">
              <span className="absolute top-0.5 right-0.5 w-5 h-5 bg-white rounded-full" />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 sm:p-5 border border-zinc-200 rounded-2xl">
            <div>
              <div className="font-semibold text-zinc-900">Waitlist Enabled</div>
              <div className="text-xs text-zinc-500 mt-0.5">Allow users to wait for a free spot</div>
            </div>
            <div className="relative w-11 h-6 rounded-full bg-zinc-900 cursor-pointer">
              <span className="absolute top-0.5 right-0.5 w-5 h-5 bg-white rounded-full" />
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-lime-300 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-zinc-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-zinc-900 text-sm">Pro Tip</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Events with clear cover photos get 40% more interest. Your event is looking great!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
