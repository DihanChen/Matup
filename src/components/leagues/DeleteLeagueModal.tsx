"use client";

type DeleteLeagueModalProps = {
  isOpen: boolean;
  leagueName: string;
  memberCount: number;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function DeleteLeagueModal({
  isOpen,
  leagueName,
  memberCount,
  deleting,
  onClose,
  onConfirm,
}: DeleteLeagueModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-zinc-900 mb-2">Delete League?</h3>
        <p className="text-zinc-500 mb-6">
          This will permanently delete <strong>{leagueName}</strong>, all matches, and remove all {memberCount} members. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 py-3 bg-red-500 text-white rounded-full font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Yes, Delete League"}
          </button>
          <button
            onClick={onClose}
            disabled={deleting}
            className="flex-1 py-3 border border-zinc-200 text-zinc-700 rounded-full font-medium hover:bg-zinc-50 transition-colors"
          >
            Keep League
          </button>
        </div>
      </div>
    </div>
  );
}
