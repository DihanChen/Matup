"use client";

type InviteModalProps = {
  isOpen: boolean;
  emailInput: string;
  emails: string[];
  sending: boolean;
  error: string | null;
  success: string | null;
  onEmailInputChange: (value: string) => void;
  onAddEmail: () => void;
  onRemoveEmail: (email: string) => void;
  onSend: () => void;
  onClose: () => void;
};

export default function InviteModal({
  isOpen,
  emailInput,
  emails,
  sending,
  error,
  success,
  onEmailInputChange,
  onAddEmail,
  onRemoveEmail,
  onSend,
  onClose,
}: InviteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="text-xl font-bold text-zinc-900">Invite Members</h3>
            <p className="text-sm text-zinc-500">Add one email at a time, then send.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"
            aria-label="Close invite modal"
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

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            value={emailInput}
            onChange={(event) => onEmailInputChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onAddEmail();
              }
            }}
            placeholder="friend@email.com"
            className="flex-1 px-4 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={onAddEmail}
            className="px-4 py-2 border border-zinc-200 text-zinc-700 rounded-xl font-medium hover:bg-zinc-50 transition-colors"
          >
            Add
          </button>
        </div>

        {emails.length > 0 ? (
          <div className="mt-4 max-h-44 overflow-y-auto border border-zinc-100 rounded-xl p-2 space-y-2">
            {emails.map((email) => (
              <div
                key={email}
                className="flex items-center justify-between px-2.5 py-2 bg-zinc-50 rounded-lg text-sm"
              >
                <span className="text-zinc-700 truncate">{email}</span>
                <button
                  type="button"
                  onClick={() => onRemoveEmail(email)}
                  className="text-zinc-400 hover:text-red-500"
                  aria-label={`Remove ${email}`}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500 mt-4">No emails added yet.</p>
        )}

        {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
        {success && <p className="text-sm text-emerald-600 mt-3">{success}</p>}

        <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6">
          <button
            onClick={onSend}
            disabled={sending}
            className="flex-1 py-3 bg-zinc-900 text-white rounded-full font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {sending ? "Sending..." : "Send Invites"}
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
