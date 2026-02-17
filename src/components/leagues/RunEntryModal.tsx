"use client";

type RunEntryModalProps = {
  isOpen: boolean;
  weekLabel: string;
  minutes: string;
  seconds: string;
  distance: string;
  submitting: boolean;
  onMinutesChange: (value: string) => void;
  onSecondsChange: (value: string) => void;
  onDistanceChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
};

export default function RunEntryModal({
  isOpen,
  weekLabel,
  minutes,
  seconds,
  distance,
  submitting,
  onMinutesChange,
  onSecondsChange,
  onDistanceChange,
  onSubmit,
  onClose,
}: RunEntryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[85vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-zinc-900 mb-2">Submit Run</h3>
        <p className="text-sm text-zinc-500 mb-4">{weekLabel}</p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Time (MM:SS)</label>
            <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
              <input
                type="number"
                min={0}
                value={minutes}
                onChange={(event) => onMinutesChange(event.target.value)}
                placeholder="MM"
                className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900 text-center"
              />
              <span className="text-zinc-400 font-semibold">:</span>
              <input
                type="number"
                min={0}
                max={59}
                value={seconds}
                onChange={(event) => onSecondsChange(event.target.value)}
                placeholder="SS"
                className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900 text-center"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Distance (meters)</label>
            <input
              type="number"
              min={1}
              value={distance}
              onChange={(event) => onDistanceChange(event.target.value)}
              className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900"
            />
          </div>
        </div>
        <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6">
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="flex-1 py-3 bg-zinc-900 text-white rounded-full font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Submit"}
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
