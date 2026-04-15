"use client";

const MAX_NOTIFICATION_CHARS = 300;

type ZeroTokenWarning = {
  membersWithTokens: number;
  total: number;
};

type EmailMembersModalProps = {
  isOpen: boolean;
  recipientCount: number;
  // Email channel
  subject: string;
  message: string;
  sending: boolean;
  error: string | null;
  success: string | null;
  onSubjectChange: (subject: string) => void;
  onMessageChange: (message: string) => void;
  onSend: () => void;
  onClose: () => void;
  // In-app notification channel
  channel: "email" | "notification";
  onChannelChange: (channel: "email" | "notification") => void;
  notifyMessage: string;
  onNotifyMessageChange: (message: string) => void;
  sendingNotification: boolean;
  notifyError: string | null;
  notifySuccess: string | null;
  zeroTokenWarning: ZeroTokenWarning | null;
  onDismissZeroTokenWarning: () => void;
  onNotifySend: (opts?: { skipZeroCheck?: boolean }) => void;
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
  channel,
  onChannelChange,
  notifyMessage,
  onNotifyMessageChange,
  sendingNotification,
  notifyError,
  notifySuccess,
  zeroTokenWarning,
  onDismissZeroTokenWarning,
  onNotifySend,
}: EmailMembersModalProps) {
  if (!isOpen) return null;

  const isEmail = channel === "email";
  const notifyCharCount = notifyMessage.length;
  const notifyOverLimit = notifyCharCount > MAX_NOTIFICATION_CHARS;
  const isSending = isEmail ? sending : sendingNotification;
  const activeError = isEmail ? error : notifyError;
  const activeSuccess = isEmail ? success : notifySuccess;

  // Zero-token warning dialog shown before send
  if (zeroTokenWarning && !isEmail) {
    const { membersWithTokens, total } = zeroTokenWarning;
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6">
          <h3 className="text-lg font-bold text-zinc-900 mb-3">Low notification reach</h3>
          <p className="text-sm text-zinc-600 mb-6">
            Only {membersWithTokens} of {total} members will receive this notification. The rest
            have notifications turned off or haven&apos;t installed the app.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => onNotifySend({ skipZeroCheck: true })}
              className="flex-1 py-3 bg-zinc-900 text-white rounded-full font-medium hover:bg-zinc-800 transition-colors"
            >
              Send anyway
            </button>
            <button
              onClick={onDismissZeroTokenWarning}
              className="flex-1 py-3 border border-zinc-200 text-zinc-700 rounded-full font-medium hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="text-xl font-bold text-zinc-900">Message members</h3>
            <p className="text-sm text-zinc-500">
              Send a message to {recipientCount} member{recipientCount === 1 ? "" : "s"}.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"
            aria-label="Close message members modal"
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

        {/* Channel selector */}
        <div className="mb-4">
          <p className="text-sm font-medium text-zinc-700 mb-2">Send via</p>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="message-channel"
                value="email"
                checked={channel === "email"}
                onChange={() => onChannelChange("email")}
                className="accent-zinc-900"
              />
              <span className="text-sm text-zinc-700">Email</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="message-channel"
                value="notification"
                checked={channel === "notification"}
                onChange={() => onChannelChange("notification")}
                className="accent-zinc-900"
              />
              <span className="text-sm text-zinc-700">In-app notification</span>
            </label>
          </div>
        </div>

        {isEmail ? (
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
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">Message</label>
              <textarea
                value={notifyMessage}
                onChange={(event) => onNotifyMessageChange(event.target.value)}
                rows={4}
                placeholder="Share a quick update with your members..."
                className="w-full px-4 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                maxLength={MAX_NOTIFICATION_CHARS + 50}
              />
              <div className={`text-right text-xs mt-1 ${notifyOverLimit ? "text-red-500 font-medium" : "text-zinc-400"}`}>
                {notifyCharCount} / {MAX_NOTIFICATION_CHARS}
              </div>
            </div>
            <p className="text-xs text-zinc-500">
              Delivered to members&apos; devices within ~30 seconds. Members with notifications turned
              off won&apos;t receive this.
            </p>
          </div>
        )}

        {activeError && <p className="text-sm text-red-500 mt-3">{activeError}</p>}
        {activeSuccess && <p className="text-sm text-emerald-600 mt-3">{activeSuccess}</p>}

        <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6">
          <button
            onClick={isEmail ? onSend : () => onNotifySend()}
            disabled={isSending || (!isEmail && notifyOverLimit)}
            className="flex-1 py-3 bg-zinc-900 text-white rounded-full font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {isSending
              ? "Sending..."
              : isEmail
              ? "Send email"
              : "Send notification"}
          </button>
          <button
            onClick={onClose}
            disabled={isSending}
            className="flex-1 py-3 border border-zinc-200 text-zinc-700 rounded-full font-medium hover:bg-zinc-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
