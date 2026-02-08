"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import LocationAutocomplete from "@/components/LocationAutocomplete";
import { notifyNearbyUsers } from "@/lib/push-notifications";
import ActivityCard, { ACTIVITIES, ActivityIcon } from "@/components/create-event/ActivityCard";
import StepIndicator, { StepLabel } from "@/components/create-event/StepIndicator";
interface FormData {
  sportType: string;
  date: string;
  time: string;
  duration: number;
  location: string;
  coordinates: { lat: number; lng: number } | null;
  locationName: string;
  addressLine: string;
  title: string;
  description: string;
  skillLevel: string;
  maxParticipants: number;
}

const TOTAL_STEPS = 3;

const VIBE_OPTIONS = [
  { value: 'all', label: 'Casual', description: 'Just for fun and fitness', color: 'bg-green-100 text-green-600' },
  { value: 'intermediate', label: 'Competitive', description: 'Intense match, skilled play', color: 'bg-orange-100 text-orange-600' },
  { value: 'advanced', label: 'Pro', description: 'Advanced/Club level players', color: 'bg-blue-100 text-blue-600' },
];

function generateDateOptions() {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push({
      value: date.toISOString().split('T')[0],
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      isToday: i === 0,
      isTomorrow: i === 1,
    });
  }
  return dates;
}

const DATE_OPTIONS = generateDateOptions();

const QUICK_TIMES = [
  { value: '06:00', label: '06:00 AM' },
  { value: '07:00', label: '07:00 AM' },
  { value: '08:00', label: '08:00 AM' },
  { value: '09:00', label: '09:00 AM' },
  { value: '10:00', label: '10:00 AM' },
  { value: '11:00', label: '11:00 AM' },
  { value: '12:00', label: '12:00 PM' },
  { value: '13:00', label: '01:00 PM' },
  { value: '14:00', label: '02:00 PM' },
  { value: '15:00', label: '03:00 PM' },
  { value: '16:00', label: '04:00 PM' },
  { value: '17:00', label: '05:00 PM' },
  { value: '18:00', label: '06:00 PM' },
  { value: '19:00', label: '07:00 PM' },
  { value: '20:00', label: '08:00 PM' },
  { value: '21:00', label: '09:00 PM' },
];

export default function CreateEventPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);
  const [showNote, setShowNote] = useState(false);
  const [showVibe, setShowVibe] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    sportType: '',
    date: '',
    time: '',
    duration: 60,
    location: '',
    coordinates: null,
    locationName: '',
    addressLine: '',
    title: '',
    description: '',
    skillLevel: 'all',
    maxParticipants: 4,
  });

  useEffect(() => {
    const supabase = createClient();
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);
    }
    getUser();
  }, [router]);

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };


  const canProceed = (): boolean => {
    switch (step) {
      case 1: return !!formData.sportType;
      case 2: return !!formData.date && !!formData.time && !!formData.location.trim();
      case 3:
        return formData.maxParticipants >= 2;
      default: return false;
    }
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS && canProceed()) {
      if (step === 2 && !formData.title) {
        const activity = ACTIVITIES.find(a => a.id === formData.sportType);
        const locationShort = formData.location.split(',')[0];
        updateFormData({ title: `${activity?.name || 'Activity'} at ${locationShort}` });
      }
      setStep(step + 1);
      setError(null);
    }
  };

  const handleBack = () => {
    if (step > 1) { setStep(step - 1); setError(null); }
  };

  async function handleSubmit() {
    if (!canProceed()) return;

    setLoading(true);
    setError(null);

    const title = formData.title || `${ACTIVITIES.find(a => a.id === formData.sportType)?.name || 'Event'} at ${formData.location.split(',')[0]}`;
    const datetime = new Date(`${formData.date}T${formData.time}`).toISOString();
    const supabase = createClient();

    const { data: eventData, error } = await supabase.from("events").insert({
      title,
      description: formData.description || null,
      sport_type: formData.sportType,
      location: formData.location,
      datetime,
      duration: formData.duration,
      skill_level: formData.skillLevel,
      max_participants: formData.maxParticipants,
      creator_id: user?.id,
      latitude: formData.coordinates?.lat || null,
      longitude: formData.coordinates?.lng || null,
      location_name: formData.locationName || formData.location.split(",")[0]?.trim() || null,
      address_line: formData.addressLine || null,
    }).select("id").single();

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (formData.coordinates && eventData?.id) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          await notifyNearbyUsers(
            session.access_token, eventData.id, title,
            formData.location, formData.coordinates.lat, formData.coordinates.lng
          );
        }
      } catch (notifyError) {
        console.error("Failed to send notifications:", notifyError);
      }
    }

    setCreatedEventId(eventData?.id || null);
    setShowSuccess(true);
    setLoading(false);
  }

  const getSelectedActivity = () => ACTIVITIES.find(a => a.id === formData.sportType);

  const formatTimeDisplay = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center py-20">
          <div className="text-zinc-500">Loading...</div>
        </div>
      </div>
    );
  }

  // Success Screen
  if (showSuccess) {
    const activity = getSelectedActivity();
    const vibeLabel = VIBE_OPTIONS.find(v => v.value === formData.skillLevel)?.label || 'Casual';
    return (
      <div className="min-h-screen bg-white">
        <main className="max-w-lg mx-auto px-6 py-16 text-center">
          <div className="w-24 h-24 bg-lime-300 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-zinc-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-zinc-900 mb-2">
            Game <span className="text-orange-500">On!</span>
          </h1>
          <p className="text-zinc-400 mb-8">
            Your session is live! Invite your squad or<br />wait for the community to join.
          </p>

          {/* Event Card Preview */}
          {createdEventId && (
            <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden text-left mb-6">
              <div className="bg-zinc-100 h-36 relative overflow-hidden">
                <Image
                  src={`/covers/${formData.sportType}.jpg`}
                  alt={`${formData.sportType} cover`}
                  fill
                  sizes="(max-width: 768px) 100vw, 400px"
                  quality={75}
                  className="object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
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
                  <span>{formData.location.split(',')[0]}</span>
                </div>
                <h3 className="font-semibold text-zinc-900 mb-1">{formData.title || `${activity?.name} at ${formData.location.split(',')[0]}`}</h3>
                <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-3">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25" />
                  </svg>
                  <span>
                    {formData.date && new Date(formData.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
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
            onClick={() => {
              if (createdEventId && navigator.share) {
                navigator.share({
                  title: 'Join my event on MatUp!',
                  url: `${window.location.origin}/events/${createdEventId}`,
                });
              } else if (createdEventId) {
                navigator.clipboard.writeText(`${window.location.origin}/events/${createdEventId}`);
              }
            }}
            className="w-full py-3.5 bg-zinc-900 text-white rounded-full font-medium hover:bg-zinc-800 transition-colors"
          >
            Share with friends
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">

      <main className="max-w-5xl mx-auto px-6 py-8">
        <StepIndicator currentStep={step} totalSteps={TOTAL_STEPS} />

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Step 1: Select Sport */}
        {step === 1 && (
          <div className="animate-fadeIn">
            <StepLabel step={1} />
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
              {ACTIVITIES.map(activity => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  selected={formData.sportType === activity.id}
                  onSelect={(id) => updateFormData({ sportType: id })}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step 2: When & Where */}
        {step === 2 && (
          <div className="animate-fadeIn">
            <StepLabel step={2} />

            <div className="grid md:grid-cols-2 gap-8 items-stretch">
              {/* Left: Inputs */}
              <div className="space-y-8">
                {/* Date & Time */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25" />
                    </svg>
                    <span className="text-sm font-bold text-zinc-900">01. Select Date & Time</span>
                  </div>

                  {/* Date - horizontal scroll */}
                  <div className="overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin mb-4">
                    <div className="flex gap-2 w-max">
                      {DATE_OPTIONS.map((d) => (
                        <button
                          key={d.value}
                          type="button"
                          onClick={() => updateFormData({ date: d.value })}
                          className={`flex-shrink-0 py-2.5 px-5 rounded-full text-sm font-medium transition-all ${
                            formData.date === d.value
                              ? 'bg-zinc-900 text-white'
                              : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                          }`}
                        >
                          <div className="text-[10px] uppercase tracking-wide opacity-60">
                            {d.isToday ? 'ASAP' : d.isTomorrow ? 'NEXT' : d.dayName}
                          </div>
                          <div className="font-bold">
                            {d.isToday ? 'Today' : d.isTomorrow ? 'Tomorrow' : `${d.month} ${d.dayNum}`}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time - horizontal scroll */}
                  <div className="overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
                    <div className="flex gap-2 w-max">
                      {QUICK_TIMES.map((time) => (
                        <button
                          key={time.value}
                          type="button"
                          onClick={() => updateFormData({ time: time.value })}
                          className={`flex-shrink-0 py-2.5 px-5 rounded-full text-sm font-medium transition-all ${
                            formData.time === time.value
                              ? 'bg-zinc-900 text-white'
                              : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                          }`}
                        >
                          {time.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Venue */}
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
                    onChange={(value) => updateFormData({ location: value })}
                    onLocationSelect={(loc) => {
                      updateFormData({
                        location: loc.address,
                        coordinates: { lat: loc.lat, lng: loc.lng },
                        locationName: loc.locationName,
                        addressLine: loc.addressLine,
                      });
                    }}
                    placeholder="Search for a park, gym or court..."
                  />
                  {/* Map preview */}
                  <div className="mt-3 rounded-xl h-[160px] overflow-hidden bg-zinc-100">
                    {formData.coordinates ? (
                      <div className="relative w-full h-full">
                        <iframe
                          src={`https://www.openstreetmap.org/export/embed.html?bbox=${formData.coordinates.lng - 0.005},${formData.coordinates.lat - 0.005},${formData.coordinates.lng + 0.005},${formData.coordinates.lat + 0.005}&layer=mapnik&marker=${formData.coordinates.lat},${formData.coordinates.lng}`}
                          className="w-full h-full border-0"
                          loading="lazy"
                          title="Selected location"
                        />
                        {/* Overlay to prevent map interaction */}
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

              {/* Right: Live Preview + Buttons */}
              <div className="flex flex-col">
                <div className="bg-zinc-100 rounded-2xl p-8 flex flex-col justify-between flex-1">
                  <div className="mb-6"><span className="text-sm font-semibold text-white bg-zinc-900 rounded-full px-4 py-1.5">Event</span></div>
                  <p className="text-2xl md:text-3xl font-extrabold leading-snug">
                    I&apos;m hosting a{' '}
                    <span className="text-orange-500">
                      {getSelectedActivity()?.name || '...'} game
                    </span>{' '}
                    at{' '}
                    <span className="text-orange-500">
                      {formData.location ? formData.location.split(',')[0] : '...'}
                    </span>{' '}
                    on{' '}
                    <span className="text-zinc-900">
                      {formData.date
                        ? new Date(formData.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' })
                        : '...'}
                    </span>{' '}
                    <span className="text-orange-500">
                      {formData.date
                        ? new Date(formData.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
                        : ''}
                      {formData.time ? `, at ${formatTimeDisplay(formData.time).toLowerCase()}` : ''}
                    </span>
                    .
                  </p>

                  {/* Buttons inside summary */}
                  <div className="flex flex-col gap-3 mt-8">
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={!canProceed()}
                      className={`w-full py-3.5 rounded-full font-medium transition-all ${
                        canProceed()
                          ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                          : 'bg-zinc-300 text-zinc-500 cursor-not-allowed'
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
                      onClick={handleBack}
                      className="w-full py-3.5 rounded-full font-medium border border-zinc-300 text-zinc-700 hover:bg-white/60 transition-colors"
                    >
                      Back
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Details */}
        {step === 3 && (
          <div className="animate-fadeIn">
            <StepLabel step={3} />

            <div className="grid md:grid-cols-2 gap-8">
              {/* Left: Participant count + Sport fields + Vibe + Note */}
              <div className="space-y-6">
                {/* Participant counter in bordered card */}
                <div className="border border-zinc-200 rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => updateFormData({ maxParticipants: Math.max(2, formData.maxParticipants - 1) })}
                      className="w-12 h-12 rounded-full border-2 border-zinc-200 flex items-center justify-center text-zinc-600 hover:border-zinc-400 transition-colors text-xl font-bold"
                    >
                      −
                    </button>
                    <div className="text-center">
                      <div className="text-5xl font-bold text-zinc-900">{formData.maxParticipants}</div>
                      <div className="text-sm text-zinc-400 mt-1">Needed</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateFormData({ maxParticipants: Math.min(50, formData.maxParticipants + 1) })}
                      className="w-12 h-12 rounded-full border-2 border-zinc-200 flex items-center justify-center text-zinc-600 hover:border-zinc-400 transition-colors text-xl font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Vibe with toggle */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-zinc-900">Vibe</span>
                    <button
                      type="button"
                      onClick={() => setShowVibe(!showVibe)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${showVibe ? 'bg-zinc-900' : 'bg-zinc-300'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${showVibe ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>
                  {showVibe && (
                    <div className="space-y-2">
                      {VIBE_OPTIONS.map(vibe => (
                        <button
                          key={vibe.value}
                          type="button"
                          onClick={() => updateFormData({ skillLevel: vibe.value })}
                          className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                            formData.skillLevel === vibe.value
                              ? 'border-zinc-900'
                              : 'border-zinc-100 hover:border-zinc-200'
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${vibe.color}`}>
                            {vibe.value === 'all' && (
                              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75S14.418 9 14.625 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
                              </svg>
                            )}
                            {vibe.value === 'intermediate' && (
                              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
                              </svg>
                            )}
                            {vibe.value === 'advanced' && (
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

                {/* Add a note with toggle */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-zinc-900">Add a note</span>
                    <button
                      type="button"
                      onClick={() => setShowNote(!showNote)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${showNote ? 'bg-zinc-900' : 'bg-zinc-300'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${showNote ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>
                  {showNote && (
                    <textarea
                      value={formData.description}
                      onChange={(e) => updateFormData({ description: e.target.value })}
                      rows={4}
                      placeholder="e.g. Bring water and light-colored shirt..."
                      className="w-full px-4 py-3 border border-zinc-200 rounded-2xl bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none"
                    />
                  )}
                </div>
              </div>

              {/* Right: Cover photo + toggles */}
              <div className="space-y-6">
                {/* Cover Preview */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-zinc-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M2.25 18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V6A2.25 2.25 0 0 0 19.5 3.75h-15A2.25 2.25 0 0 0 2.25 6v12Z" />
                    </svg>
                    <span className="text-lg font-bold text-zinc-900">Cover</span>
                  </div>
                  <div className="relative h-[200px] rounded-2xl overflow-hidden bg-zinc-100">
                    <Image
                      src={`/covers/${formData.sportType}.jpg`}
                      alt={`${formData.sportType} cover`}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      quality={75}
                      className="object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    {/* Upload overlay — for future use */}
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

                {/* Instant Booking toggle */}
                <div className="flex items-center justify-between p-5 border border-zinc-200 rounded-2xl">
                  <div>
                    <div className="font-semibold text-zinc-900">Instant Booking</div>
                    <div className="text-xs text-zinc-500 mt-0.5">Players join without your manual approval</div>
                  </div>
                  <div className="relative w-11 h-6 rounded-full bg-zinc-900 cursor-pointer">
                    <span className="absolute top-0.5 right-0.5 w-5 h-5 bg-white rounded-full" />
                  </div>
                </div>

                {/* Waitlist Enabled toggle */}
                <div className="flex items-center justify-between p-5 border border-zinc-200 rounded-2xl">
                  <div>
                    <div className="font-semibold text-zinc-900">Waitlist Enabled</div>
                    <div className="text-xs text-zinc-500 mt-0.5">Allow users to wait for a free spot</div>
                  </div>
                  <div className="relative w-11 h-6 rounded-full bg-zinc-900 cursor-pointer">
                    <span className="absolute top-0.5 right-0.5 w-5 h-5 bg-white rounded-full" />
                  </div>
                </div>

                {/* Pro Tip */}
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
        )}

        {/* Navigation — only for steps 1 and 3 (step 2 has buttons inside summary) */}
        {step !== 2 && (
          <div className="flex flex-col items-center gap-3 mt-10 max-w-xs mx-auto">
            <button
              type="button"
              onClick={step === TOTAL_STEPS ? handleSubmit : handleNext}
              disabled={!canProceed() || loading}
              className={`w-full py-3.5 rounded-full font-medium transition-all ${
                canProceed()
                  ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                  : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
              } disabled:opacity-50`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating...
                </span>
              ) : step === TOTAL_STEPS ? (
                'Ready to Play!'
              ) : (
                'Next'
              )}
            </button>
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="w-full py-3.5 rounded-full font-medium border border-zinc-300 text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                Back
              </button>
            )}
          </div>
        )}
      </main>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .scrollbar-thin::-webkit-scrollbar { height: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #d4d4d8; border-radius: 9999px; }
        .scrollbar-thin { scrollbar-width: thin; scrollbar-color: #d4d4d8 transparent; }
      `}</style>
    </div>
  );
}
