"use client";

type ResolveDisputeModalProps = {
  isOpen: boolean;
  sideALabel: string;
  sideBLabel: string;
  winner: "A" | "B";
  reason: string;
  resolving: boolean;
  onWinnerChange: (winner: "A" | "B") => void;
  onReasonChange: (reason: string) => void;
  onResolve: () => void;
  onClose: () => void;
};

export default function ResolveDisputeModal({
  isOpen,
  sideALabel,
  sideBLabel,
  winner,
  reason,
  resolving,
  onWinnerChange,
  onReasonChange,
  onResolve,
  onClose,
}: ResolveDisputeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[85vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-zinc-900 mb-3">Resolve Dispute</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Winner Side</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onWinnerChange("A")}
                className={`py-2 rounded-xl border text-sm font-medium ${
                  winner === "A"
                    ? "border-orange-500 bg-orange-50 text-orange-600"
                    : "border-zinc-200 text-zinc-700"
                }`}
              >
                {sideALabel}
              </button>
              <button
                type="button"
                onClick={() => onWinnerChange("B")}
                className={`py-2 rounded-xl border text-sm font-medium ${
                  winner === "B"
                    ? "border-orange-500 bg-orange-50 text-orange-600"
                    : "border-zinc-200 text-zinc-700"
                }`}
              >
                {sideBLabel}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Resolution Note</label>
            <textarea
              value={reason}
              onChange={(event) => onReasonChange(event.target.value)}
              rows={4}
              placeholder="Why this result is final (optional)"
              className="w-full px-4 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900 resize-none"
            />
          </div>
        </div>
        <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6">
          <button
            onClick={onResolve}
            disabled={resolving}
            className="flex-1 py-3 bg-zinc-900 text-white rounded-full font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {resolving ? "Resolving..." : "Resolve"}
          </button>
          <button
            onClick={onClose}
            disabled={resolving}
            className="flex-1 py-3 border border-zinc-200 text-zinc-700 rounded-full font-medium hover:bg-zinc-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
