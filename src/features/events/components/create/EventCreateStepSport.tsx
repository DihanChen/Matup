"use client";

import ActivityCard, { ACTIVITIES } from "@/components/create-event/ActivityCard";
import { StepLabel } from "@/components/create-event/StepIndicator";
import type { EventCreateFormData } from "@/features/events/components/create/types";

type Props = {
  formData: EventCreateFormData;
  onUpdateFormData: (updates: Partial<EventCreateFormData>) => void;
};

export default function EventCreateStepSport({ formData, onUpdateFormData }: Props) {
  return (
    <div className="animate-fadeIn">
      <StepLabel step={1} />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {ACTIVITIES.map((activity) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            selected={formData.sportType === activity.id}
            onSelect={(id) => onUpdateFormData({ sportType: id })}
          />
        ))}
      </div>
    </div>
  );
}
