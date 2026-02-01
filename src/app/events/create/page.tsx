"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import LocationAutocomplete from "@/components/LocationAutocomplete";
import { notifyNearbyUsers } from "@/lib/push-notifications";
import ActivityCard, { ACTIVITIES, ActivityIcon } from "@/components/create-event/ActivityCard";
import StepIndicator, { StepLabel } from "@/components/create-event/StepIndicator";
import WizardNav from "@/components/create-event/WizardNav";

interface FormData {
  sportType: string;
  date: string;
  time: string;
  duration: number;
  location: string;
  coordinates: { lat: number; lng: number } | null;
  title: string;
  description: string;
  skillLevel: string;
  maxParticipants: number;
}

const TOTAL_STEPS = 4;

const DURATION_OPTIONS = [
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
  { value: 180, label: '3 hours' },
  { value: 240, label: '4 hours' },
];


const SKILL_LEVELS = [
  { value: 'all', label: 'All Levels Welcome' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

function generateDateOptions() {
  const dates = [];
  const today = new Date();

  for (let i = 0; i < 60; i++) {
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

const TIME_OPTIONS = [
  { value: '06:00', label: '6:00 AM' },
  { value: '06:30', label: '6:30 AM' },
  { value: '07:00', label: '7:00 AM' },
  { value: '07:30', label: '7:30 AM' },
  { value: '08:00', label: '8:00 AM' },
  { value: '08:30', label: '8:30 AM' },
  { value: '09:00', label: '9:00 AM' },
  { value: '09:30', label: '9:30 AM' },
  { value: '10:00', label: '10:00 AM' },
  { value: '10:30', label: '10:30 AM' },
  { value: '11:00', label: '11:00 AM' },
  { value: '11:30', label: '11:30 AM' },
  { value: '12:00', label: '12:00 PM' },
  { value: '12:30', label: '12:30 PM' },
  { value: '13:00', label: '1:00 PM' },
  { value: '13:30', label: '1:30 PM' },
  { value: '14:00', label: '2:00 PM' },
  { value: '14:30', label: '2:30 PM' },
  { value: '15:00', label: '3:00 PM' },
  { value: '15:30', label: '3:30 PM' },
  { value: '16:00', label: '4:00 PM' },
  { value: '16:30', label: '4:30 PM' },
  { value: '17:00', label: '5:00 PM' },
  { value: '17:30', label: '5:30 PM' },
  { value: '18:00', label: '6:00 PM' },
  { value: '18:30', label: '6:30 PM' },
  { value: '19:00', label: '7:00 PM' },
  { value: '19:30', label: '7:30 PM' },
  { value: '20:00', label: '8:00 PM' },
  { value: '20:30', label: '8:30 PM' },
  { value: '21:00', label: '9:00 PM' },
  { value: '21:30', label: '9:30 PM' },
];


export default function CreateEventPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    sportType: '',
    date: '',
    time: '',
    duration: 60,
    location: '',
    coordinates: null,
    title: '',
    description: '',
    skillLevel: 'all',
    maxParticipants: 10,
  });

  useEffect(() => {
    const supabase = createClient();

    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);
    }

    getUser();
  }, [router]);

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        return !!formData.sportType;
      case 2:
        return !!formData.date && !!formData.time;
      case 3:
        return !!formData.location.trim();
      case 4:
        return !!formData.title.trim();
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS && canProceed()) {
      setStep(step + 1);
      setError(null);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError(null);
    }
  };

  const handleStepClick = (targetStep: number) => {
    if (targetStep < step) {
      setStep(targetStep);
      setError(null);
    }
  };

  async function handleSubmit() {
    if (!canProceed()) return;

    setLoading(true);
    setError(null);

    const datetime = new Date(`${formData.date}T${formData.time}`).toISOString();
    const supabase = createClient();

    const { data: eventData, error } = await supabase.from("events").insert({
      title: formData.title,
      description: formData.description,
      sport_type: formData.sportType,
      location: formData.location,
      datetime,
      duration: formData.duration,
      skill_level: formData.skillLevel,
      max_participants: formData.maxParticipants,
      creator_id: user?.id,
      latitude: formData.coordinates?.lat || null,
      longitude: formData.coordinates?.lng || null,
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
            session.access_token,
            eventData.id,
            formData.title,
            formData.location,
            formData.coordinates.lat,
            formData.coordinates.lng
          );
        }
      } catch (notifyError) {
        console.error("Failed to send notifications:", notifyError);
      }
    }

    router.push("/events");
  }

  const getSelectedActivity = () => ACTIVITIES.find(a => a.id === formData.sportType);

  const formatTimeDisplay = (time: string) => {
    if (!time) return '';
    const found = TIME_OPTIONS.find(t => t.value === time);
    if (found) return found.label;
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-zinc-500">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />

      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-zinc-900">Create Event</h1>
          <Link
            href="/events"
            className="text-zinc-500 hover:text-zinc-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Link>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm">
          <StepIndicator
            currentStep={step}
            totalSteps={TOTAL_STEPS}
            onStepClick={handleStepClick}
          />

          {error && (
            <div className="mb-6 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Pick Activity */}
          {step === 1 && (
            <div className="animate-fadeIn">
              <StepLabel step={1} />
              <p className="text-zinc-500 text-center mb-6">What activity are you planning?</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
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

          {/* Step 2: When */}
          {step === 2 && (
            <div className="animate-fadeIn">
              <StepLabel step={2} />
              <p className="text-zinc-500 text-center mb-6">When is it happening?</p>

              <div className="space-y-6">
                {/* Date - Horizontal scroll */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-3">
                    Date
                  </label>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {DATE_OPTIONS.map((date) => (
                      <button
                        key={date.value}
                        type="button"
                        onClick={() => updateFormData({ date: date.value })}
                        className={`
                          flex-shrink-0 w-16 py-3 rounded-xl text-center transition-all
                          ${formData.date === date.value
                            ? 'bg-emerald-500 text-white shadow-lg'
                            : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                          }
                        `}
                      >
                        <div className={`text-xs font-medium ${formData.date === date.value ? 'text-emerald-100' : 'text-zinc-500'}`}>
                          {date.isToday ? 'Today' : date.isTomorrow ? 'Tmrw' : date.dayName}
                        </div>
                        <div className="text-lg font-bold">{date.dayNum}</div>
                        <div className={`text-xs ${formData.date === date.value ? 'text-emerald-100' : 'text-zinc-400'}`}>
                          {date.month}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time - Horizontal scroll */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-3">
                    Time
                  </label>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {TIME_OPTIONS.map((time) => (
                      <button
                        key={time.value}
                        type="button"
                        onClick={() => updateFormData({ time: time.value })}
                        className={`
                          flex-shrink-0 px-4 py-3 rounded-xl text-sm font-medium transition-all
                          ${formData.time === time.value
                            ? 'bg-emerald-500 text-white shadow-lg'
                            : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                          }
                        `}
                      >
                        {time.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration - Horizontal scroll */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-3">
                    Duration
                  </label>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {DURATION_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateFormData({ duration: option.value })}
                        className={`
                          flex-shrink-0 px-4 py-3 rounded-xl text-sm font-medium transition-all
                          ${formData.duration === option.value
                            ? 'bg-emerald-500 text-white shadow-lg'
                            : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                          }
                        `}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Where */}
          {step === 3 && (
            <div className="animate-fadeIn">
              <StepLabel step={3} />
              <p className="text-zinc-500 text-center mb-6">Where will you meet?</p>

              <div className="max-w-md mx-auto">
                <LocationAutocomplete
                  value={formData.location}
                  onChange={(value) => updateFormData({ location: value })}
                  onLocationSelect={(loc) => {
                    updateFormData({
                      location: loc.address,
                      coordinates: { lat: loc.lat, lng: loc.lng }
                    });
                  }}
                  placeholder="Search for a location..."
                />
              </div>
            </div>
          )}

          {/* Step 4: Details + Summary */}
          {step === 4 && (
            <div className="animate-fadeIn">
              <StepLabel step={4} />

              <div className="space-y-6">
                {/* Summary Card */}
                <div className="bg-zinc-50 rounded-xl p-4 mb-6">
                  <h3 className="text-sm font-medium text-zinc-500 mb-3">Event Summary</h3>
                  <div className="flex flex-wrap gap-2">
                    {getSelectedActivity() && (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${getSelectedActivity()!.gradient} text-white`}>
                        <ActivityIcon id={getSelectedActivity()!.id} className="w-4 h-4" />
                        {getSelectedActivity()!.name}
                      </span>
                    )}
                    {formData.date && formData.time && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                        {new Date(`${formData.date}T${formData.time}`).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })} at {formatTimeDisplay(formData.time)}
                      </span>
                    )}
                    {formData.duration && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
                        {DURATION_OPTIONS.find(d => d.value === formData.duration)?.label}
                      </span>
                    )}
                    {formData.location && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-700 max-w-[200px] truncate">
                        {formData.location}
                      </span>
                    )}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => updateFormData({ title: e.target.value })}
                    placeholder={`${getSelectedActivity()?.name || 'Activity'} at ${formData.location.split(',')[0] || 'Location'}`}
                    className="w-full px-4 py-3 border border-zinc-300 rounded-xl bg-white text-zinc-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Skill Level */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    Skill Level
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {SKILL_LEVELS.map(level => (
                      <button
                        key={level.value}
                        type="button"
                        onClick={() => updateFormData({ skillLevel: level.value })}
                        className={`
                          py-2 px-3 rounded-lg text-sm font-medium transition-all
                          ${formData.skillLevel === level.value
                            ? 'bg-emerald-500 text-white'
                            : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                          }
                        `}
                      >
                        {level.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Max Participants */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    Max Participants: {formData.maxParticipants}
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="50"
                    value={formData.maxParticipants}
                    onChange={(e) => updateFormData({ maxParticipants: parseInt(e.target.value) })}
                    className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-xs text-zinc-400 mt-1">
                    <span>2</span>
                    <span>50</span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateFormData({ description: e.target.value })}
                    rows={3}
                    placeholder="Tell people what to expect..."
                    className="w-full px-4 py-3 border border-zinc-300 rounded-xl bg-white text-zinc-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          <WizardNav
            currentStep={step}
            totalSteps={TOTAL_STEPS}
            canProceed={canProceed()}
            loading={loading}
            onBack={handleBack}
            onNext={handleNext}
            onSubmit={handleSubmit}
          />
        </div>
      </main>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
