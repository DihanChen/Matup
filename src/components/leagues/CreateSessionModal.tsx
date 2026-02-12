"use client";

type CreateSessionModalProps = {
  isOpen: boolean;
  week: string;
  distance: string;
  start: string;
  deadline: string;
  creating: boolean;
  onWeekChange: (value: string) => void;
  onDistanceChange: (value: string) => void;
  onStartChange: (value: string) => void;
  onDeadlineChange: (value: string) => void;
  onCreate: () => void;
  onClose: () => void;
};

export default function CreateSessionModal({
  isOpen,
  week,
  distance,
  start,
  deadline,
  creating,
  onWeekChange,
  onDistanceChange,
  onStartChange,
  onDeadlineChange,
  onCreate,
  onClose,
}: CreateSessionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[85vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-zinc-900 mb-4">Create Running Session</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Week Number</label>
            <input
              type="number"
              min={1}
              value={week}
              onChange={(event) => onWeekChange(event.target.value)}
              className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900"
            />
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
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Start (optional)</label>
            <input
              type="datetime-local"
              value={start}
              onChange={(event) => onStartChange(event.target.value)}
              className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Deadline (optional)</label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(event) => onDeadlineChange(event.target.value)}
              className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onCreate}
            disabled={creating}
            className="flex-1 py-3 bg-zinc-900 text-white rounded-full font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {creating ? "Saving..." : "Save Session"}
          </button>
          <button
            onClick={onClose}
            disabled={creating}
            className="flex-1 py-3 border border-zinc-200 text-zinc-700 rounded-full font-medium hover:bg-zinc-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
