"use client";

type EmailMembersModalProps = {
  isOpen: boolean;
  recipientCount: number;
  subject: string;
  message: string;
  sending: boolean;
  error: string | null;
  success: string | null;
  onSubjectChange: (subject: string) => void;
  onMessageChange: (message: string) => void;
  onSend: () => void;
  onClose: () => void;
};

export default function EmailMembersModal({
  isOpen,
  recipientCount,
  subject,
  message,
  sending,
  error,
  success,
  onSubjectChange,
  onMessageChange,
  onSend,
  onClose,
}: EmailMembersModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="text-xl font-bold text-zinc-900">Email members</h3>
            <p className="text-sm text-zinc-500">
              Send a message to {recipientCount} member{recipientCount === 1 ? "" : "s"}.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"
            aria-label="Close email modal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Subject</label>
            <input
              value={subject}
              onChange={(event) => onSubjectChange(event.target.value)}
              placeholder="League update subject"
              className="w-full px-4 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Message</label>
            <textarea
              value={message}
              onChange={(event) => onMessageChange(event.target.value)}
              rows={5}
              placeholder="Share announcements or scheduling details..."
              className="w-full px-4 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
        {success && <p className="text-sm text-emerald-600 mt-3">{success}</p>}

        <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6">
          <button
            onClick={onSend}
            disabled={sending}
            className="flex-1 py-3 bg-zinc-900 text-white rounded-full font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {sending ? "Sending..." : "Send Email"}
          </button>
          <button
            onClick={onClose}
            disabled={sending}
            className="flex-1 py-3 border border-zinc-200 text-zinc-700 rounded-full font-medium hover:bg-zinc-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
