"use client";

import { useState } from "react";

type RescheduleModalProps = {
  isOpen: boolean;
  matchLabel: string;
  submitting: boolean;
  onClose: () => void;
  onConfirm: (startsAt: string, endsAt: string | null) => void;
};

export default function RescheduleModal({
  isOpen,
  matchLabel,
  submitting,
  onClose,
  onConfirm,
}: RescheduleModalProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!date) return;
    const startsAt = time ? `${date}T${time}:00` : `${date}T12:00:00`;
    const endsAtDate = new Date(startsAt);
    endsAtDate.setHours(endsAtDate.getHours() + 2);
    onConfirm(startsAt, endsAtDate.toISOString());
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-zinc-900 mb-2">Reschedule Match</h3>
        <p className="text-sm text-zinc-500 mb-4">{matchLabel}</p>

        <label className="block text-sm font-medium text-zinc-700 mb-1">New Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-4 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900 mb-3"
        />

        <label className="block text-sm font-medium text-zinc-700 mb-1">
          Time <span className="text-zinc-400">(optional)</span>
        </label>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="w-full px-4 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900 mb-3"
        />

        <div className="flex flex-col-reverse sm:flex-row gap-3 mt-4">
          <button
            onClick={handleConfirm}
            disabled={submitting || !date}
            className="flex-1 py-3 bg-orange-500 text-white rounded-full font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {submitting ? "Rescheduling..." : "Reschedule"}
          </button>
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 py-3 border border-zinc-200 text-zinc-700 rounded-full font-medium hover:bg-zinc-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
