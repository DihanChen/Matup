"use client";

import LocationAutocomplete from "@/components/LocationAutocomplete";
import { ACTIVITIES } from "@/components/create-event/ActivityCard";
import { StepLabel } from "@/components/create-event/StepIndicator";
import {
  DATE_OPTIONS,
  QUICK_TIMES,
  formatTimeDisplay,
} from "@/features/events/components/create/constants";
import type { EventCreateFormData } from "@/features/events/components/create/types";

type Props = {
  formData: EventCreateFormData;
  onUpdateFormData: (updates: Partial<EventCreateFormData>) => void;
  canProceed: boolean;
  onNext: () => void;
  onBack: () => void;
};

export default function EventCreateStepWhenWhere({
  formData,
  onUpdateFormData,
  canProceed,
  onNext,
  onBack,
}: Props) {
  const selectedActivity = ACTIVITIES.find((activity) => activity.id === formData.sportType);

  return (
    <div className="animate-fadeIn overflow-x-hidden">
      <StepLabel step={2} />

      <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
        <div className="space-y-6 sm:space-y-8 min-w-0">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25" />
              </svg>
              <span className="text-sm font-bold text-zinc-900">01. Select Date & Time</span>
            </div>

            <div className="overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin mb-4">
              <div className="flex gap-2 w-max">
                {DATE_OPTIONS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => onUpdateFormData({ date: d.value })}
                    className={`flex-shrink-0 py-2 sm:py-2.5 px-4 sm:px-5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                      formData.date === d.value
                        ? "bg-zinc-900 text-white"
                        : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                    }`}
                  >
                    <div className="text-[10px] uppercase tracking-wide opacity-60">
                      {d.isToday ? "ASAP" : d.isTomorrow ? "NEXT" : d.dayName}
                    </div>
                    <div className="font-bold">
                      {d.isToday ? "Today" : d.isTomorrow ? "Tomorrow" : `${d.month} ${d.dayNum}`}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
              <div className="flex gap-2 w-max">
                {QUICK_TIMES.map((time) => (
                  <button
                    key={time.value}
                    type="button"
                    onClick={() => onUpdateFormData({ time: time.value })}
                    className={`flex-shrink-0 py-2 sm:py-2.5 px-4 sm:px-5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                      formData.time === time.value
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
              <span className="text-sm font-bold text-zinc-900">02. Find Venue</span>
            </div>
            <LocationAutocomplete
              value={formData.location}
              onChange={(value) => onUpdateFormData({ location: value })}
              onLocationSelect={(loc) => {
                onUpdateFormData({
                  location: loc.address,
                  coordinates: { lat: loc.lat, lng: loc.lng },
                  locationName: loc.locationName,
                  addressLine: loc.addressLine,
                });
              }}
              placeholder="Search for a park, gym or court..."
            />
            <div className="mt-3 rounded-xl h-[140px] sm:h-[160px] overflow-hidden bg-zinc-100">
              {formData.coordinates ? (
                <div className="relative w-full h-full">
                  <iframe
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${formData.coordinates.lng - 0.005},${formData.coordinates.lat - 0.005},${formData.coordinates.lng + 0.005},${formData.coordinates.lat + 0.005}&layer=mapnik&marker=${formData.coordinates.lat},${formData.coordinates.lng}`}
                    className="w-full h-full border-0"
                    loading="lazy"
                    title="Selected location"
                  />
                  <div className="absolute inset-0" />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center text-zinc-400">
                    <svg className="w-8 h-8 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
                    </svg>
                    <p className="text-xs">Map preview</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col min-w-0">
          <div className="bg-zinc-100 rounded-2xl p-5 sm:p-6 md:p-8 flex flex-col justify-between flex-1 max-w-xl mx-auto w-full lg:max-w-none">
            <div className="mb-6"><span className="text-xs sm:text-sm font-semibold text-white bg-zinc-900 rounded-full px-3 sm:px-4 py-1 sm:py-1.5">Event</span></div>
            <p className="text-xl sm:text-2xl md:text-3xl font-extrabold leading-snug">
              I&apos;m hosting a <span className="text-orange-500">{selectedActivity?.name || "..."}</span> session at <span className="text-orange-500">{formData.location ? formData.location.split(",")[0] : "..."}</span> on <span className="text-zinc-900">{formData.date ? new Date(`${formData.date}T00:00:00`).toLocaleDateString("en-US", { weekday: "long" }) : "..."}</span> <span className="text-orange-500">{formData.date ? new Date(`${formData.date}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric" }) : ""}{formData.time ? `, at ${formatTimeDisplay(formData.time).toLowerCase()}` : ""}</span>.
            </p>

            <div className="flex flex-col gap-3 mt-8">
              <button
                type="button"
                onClick={onNext}
                disabled={!canProceed}
                className={`w-full py-3 sm:py-3.5 rounded-full font-medium transition-all ${
                  canProceed
                    ? "bg-zinc-900 text-white hover:bg-zinc-800"
                    : "bg-zinc-300 text-zinc-500 cursor-not-allowed"
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  Almost there
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </span>
              </button>
              <button
                type="button"
                onClick={onBack}
                className="w-full py-3 sm:py-3.5 rounded-full font-medium border border-zinc-300 text-zinc-700 hover:bg-white/60 transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
