"use client";

type RejectModalProps = {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  reason: string;
  submitting: boolean;
  onReasonChange: (reason: string) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export default function RejectModal({
  isOpen,
  title,
  subtitle,
  reason,
  submitting,
  onReasonChange,
  onClose,
  onConfirm,
}: RejectModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[85vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-zinc-900 mb-2">{title}</h3>
        {subtitle && <p className="text-sm text-zinc-500 mb-3">{subtitle}</p>}
        <textarea
          value={reason}
          onChange={(event) => onReasonChange(event.target.value)}
          rows={4}
          placeholder="Reason (optional)"
          className="w-full px-4 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900 resize-none"
        />
        <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6">
          <button
            onClick={onConfirm}
            disabled={submitting}
            className="flex-1 py-3 bg-red-600 text-white rounded-full font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Reject"}
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
