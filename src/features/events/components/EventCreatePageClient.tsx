"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { ACTIVITIES } from "@/components/create-event/ActivityCard";
import StepIndicator from "@/components/create-event/StepIndicator";
import CreateEventLoadingState from "@/features/events/components/create/CreateEventLoadingState";
import CreateEventNavigation from "@/features/events/components/create/CreateEventNavigation";
import CreateEventSuccessState from "@/features/events/components/create/CreateEventSuccessState";
import EventCreateStepDetails from "@/features/events/components/create/EventCreateStepDetails";
import EventCreateStepSport from "@/features/events/components/create/EventCreateStepSport";
import EventCreateStepWhenWhere from "@/features/events/components/create/EventCreateStepWhenWhere";
import type { EventCreateFormData } from "@/features/events/components/create/types";
import { createClient } from "@/lib/supabase";

const TOTAL_STEPS = 3;

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
  const [formData, setFormData] = useState<EventCreateFormData>({
    sportType: "",
    date: "",
    time: "",
    duration: 60,
    location: "",
    coordinates: null,
    locationName: "",
    addressLine: "",
    title: "",
    description: "",
    skillLevel: "all",
    maxParticipants: 4,
  });

  useEffect(() => {
    const supabase = createClient();
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);
    }
    getUser();
  }, [router]);

  const updateFormData = (updates: Partial<EventCreateFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        return !!formData.sportType;
      case 2:
        return !!formData.date && !!formData.time && !!formData.location.trim();
      case 3:
        return formData.maxParticipants >= 2;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS && canProceed()) {
      if (step === 2 && !formData.title) {
        const activity = ACTIVITIES.find((a) => a.id === formData.sportType);
        const locationShort = formData.location.split(",")[0];
        updateFormData({ title: `${activity?.name || "Activity"} at ${locationShort}` });
      }
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

  async function handleSubmit() {
    if (!canProceed()) return;

    setLoading(true);
    setError(null);

    const title =
      formData.title ||
      `${ACTIVITIES.find((a) => a.id === formData.sportType)?.name || "Event"} at ${formData.location.split(",")[0]}`;
    const datetime = new Date(`${formData.date}T${formData.time}`).toISOString();
    const supabase = createClient();

    const { data: eventData, error: submitError } = await supabase
      .from("events")
      .insert({
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
      })
      .select("id")
      .single();

    if (submitError) {
      setError(submitError.message);
      setLoading(false);
      return;
    }

    setCreatedEventId(eventData?.id || null);
    setShowSuccess(true);
    setLoading(false);
  }

  const handleShare = async () => {
    if (!createdEventId) return;
    const shareUrl = `${window.location.origin}/events/${createdEventId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join my event on MatUp!",
          url: shareUrl,
        });
        return;
      } catch (shareError) {
        if (
          shareError &&
          typeof shareError === "object" &&
          "name" in shareError &&
          (shareError as { name?: string }).name === "AbortError"
        ) {
          return;
        }
      }
    }
    await navigator.clipboard.writeText(shareUrl);
  };

  if (!user) return <CreateEventLoadingState />;
  if (showSuccess) {
    return (
      <CreateEventSuccessState
        formData={formData}
        createdEventId={createdEventId}
        onShare={handleShare}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <StepIndicator currentStep={step} totalSteps={TOTAL_STEPS} />

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
            {error}
          </div>
        )}

        {step === 1 && (
          <EventCreateStepSport formData={formData} onUpdateFormData={updateFormData} />
        )}

        {step === 2 && (
          <EventCreateStepWhenWhere
            formData={formData}
            onUpdateFormData={updateFormData}
            canProceed={canProceed()}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {step === 3 && (
          <EventCreateStepDetails
            formData={formData}
            showNote={showNote}
            showVibe={showVibe}
            setShowNote={setShowNote}
            setShowVibe={setShowVibe}
            onUpdateFormData={updateFormData}
          />
        )}

        {step !== 2 && (
          <CreateEventNavigation
            canProceed={canProceed()}
            loading={loading}
            step={step}
            totalSteps={TOTAL_STEPS}
            onNextOrSubmit={step === TOTAL_STEPS ? handleSubmit : handleNext}
            onBack={handleBack}
          />
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
