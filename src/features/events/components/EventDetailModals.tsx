"use client";

import EventShareModal from "@/components/share/EventShareModal";
import type {
  EventDetailEvent as Event,
  ParticipantInfo,
} from "@/lib/queries/event-detail";

type Props = {
  event: Event;
  participants: ParticipantInfo[];
  showJoinModal: boolean;
  showCancelModal: boolean;
  showEmailModal: boolean;
  showReviewModal: boolean;
  reviewingUser: ParticipantInfo | null;
  joining: boolean;
  deleting: boolean;
  emailRecipientCount: number;
  emailTemplate: string;
  emailSubject: string;
  emailMessage: string;
  sendingEmail: boolean;
  emailError: string | null;
  emailSuccess: string | null;
  reviewRating: number;
  reviewComment: string;
  submittingReview: boolean;
  showShareModal: boolean;
  isGenerating: boolean;
  isSharing: boolean;
  isPastEvent: boolean;
  hostName: string;
  onCloseJoinModal: () => void;
  onConfirmJoin: () => void;
  onCloseCancelModal: () => void;
  onConfirmCancel: () => void;
  onCloseEmailModal: () => void;
  onSendEmail: () => void;
  onEmailTemplateChange: (template: string) => void;
  onEmailSubjectChange: (value: string) => void;
  onEmailMessageChange: (value: string) => void;
  onCloseReviewModal: () => void;
  onReviewRatingChange: (value: number) => void;
  onReviewCommentChange: (value: string) => void;
  onSubmitReview: () => void;
  onCloseShareModal: () => void;
  onShareImage: (templateRef: HTMLElement | null, eventTitle: string) => Promise<boolean>;
  formattedDate: string;
  formattedTime: string;
};

const EMAIL_TEMPLATES = [
  { id: "reminder", label: "Reminder" },
  { id: "schedule-change", label: "Schedule change" },
  { id: "location-update", label: "Location update" },
  { id: "cancellation", label: "Cancellation" },
];

export default function EventDetailModals({
  event,
  participants,
  showJoinModal,
  showCancelModal,
  showEmailModal,
  showReviewModal,
  reviewingUser,
  joining,
  deleting,
  emailRecipientCount,
  emailTemplate,
  emailSubject,
  emailMessage,
  sendingEmail,
  emailError,
  emailSuccess,
  reviewRating,
  reviewComment,
  submittingReview,
  showShareModal,
  isGenerating,
  isSharing,
  isPastEvent,
  hostName,
  onCloseJoinModal,
  onConfirmJoin,
  onCloseCancelModal,
  onConfirmCancel,
  onCloseEmailModal,
  onSendEmail,
  onEmailTemplateChange,
  onEmailSubjectChange,
  onEmailMessageChange,
  onCloseReviewModal,
  onReviewRatingChange,
  onReviewCommentChange,
  onSubmitReview,
  onCloseShareModal,
  onShareImage,
  formattedDate,
  formattedTime,
}: Props) {
  return (
    <>
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden">
            <div className="bg-orange-500 p-8 text-center text-white">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <circle cx="12" cy="12" r="9" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-1">Ready to Play?</h3>
              <p className="text-white/80 text-sm">You&apos;re about to join this match. Please confirm your attendance.</p>
            </div>

            <div className="p-6">
              <div className="bg-zinc-50 rounded-xl p-4 mb-6 space-y-2">
                <div className="flex items-center gap-2 text-sm text-zinc-700">
                  <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                  <span className="font-medium">{event.title}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25" />
                  </svg>
                  <span>{formattedDate} at {formattedTime}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                  <span>{event.location.split(",")[0]}</span>
                </div>
              </div>

              <button onClick={onConfirmJoin} disabled={joining}
                className="w-full py-3 bg-orange-500 text-white rounded-full font-bold hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {joining ? "Joining..." : "Confirm & Join"}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </button>
              <button onClick={onCloseJoinModal}
                className="w-full py-2 text-zinc-500 hover:text-zinc-700 text-sm font-medium mt-2 transition-colors">
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-2">Cancel Event?</h3>
            <p className="text-zinc-500 mb-6">
              Are you sure you want to cancel this game? This will automatically <strong>notify all {participants.length} players</strong>.
            </p>
            <div className="flex gap-3">
              <button onClick={onConfirmCancel} disabled={deleting}
                className="flex-1 py-3 bg-red-500 text-white rounded-full font-medium hover:bg-red-600 transition-colors disabled:opacity-50">
                {deleting ? "Cancelling..." : "Yes, Cancel Event"}
              </button>
              <button onClick={onCloseCancelModal} disabled={deleting}
                className="flex-1 py-3 border border-zinc-200 text-zinc-700 rounded-full font-medium hover:bg-zinc-50 transition-colors">
                Keep Event
              </button>
            </div>
          </div>
        </div>
      )}

      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-xl font-bold text-zinc-900">Email participants</h3>
                <p className="text-sm text-zinc-500">
                  Send a message to {emailRecipientCount} participant{emailRecipientCount === 1 ? "" : "s"}.
                </p>
              </div>
              <button onClick={onCloseEmailModal} className="text-zinc-400 hover:text-zinc-600" aria-label="Close email modal">
                X
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Template</label>
                <select
                  value={emailTemplate}
                  onChange={(e) => onEmailTemplateChange(e.target.value)}
                  className="w-full px-4 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  {EMAIL_TEMPLATES.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-zinc-400 mt-2">
                  Selecting a template replaces the subject and message.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Subject</label>
                <input
                  value={emailSubject}
                  onChange={(e) => onEmailSubjectChange(e.target.value)}
                  placeholder="Event update subject"
                  className="w-full px-4 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Message</label>
                <textarea
                  value={emailMessage}
                  onChange={(e) => onEmailMessageChange(e.target.value)}
                  rows={5}
                  placeholder="Share details, reminders, or updates..."
                  className="w-full px-4 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            {emailError && <p className="text-sm text-red-500 mt-3">{emailError}</p>}
            {emailSuccess && <p className="text-sm text-emerald-600 mt-3">{emailSuccess}</p>}

            <div className="flex gap-3 mt-6">
              <button
                onClick={onSendEmail}
                disabled={sendingEmail}
                className="flex-1 py-3 bg-zinc-900 text-white rounded-full font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                {sendingEmail ? "Sending..." : "Send Email"}
              </button>
              <button
                onClick={onCloseEmailModal}
                disabled={sendingEmail}
                className="flex-1 py-3 border border-zinc-200 text-zinc-700 rounded-full font-medium hover:bg-zinc-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showReviewModal && reviewingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-zinc-900 mb-4">Rate {reviewingUser.name || "Participant"}</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-700 mb-2">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => onReviewRatingChange(star)}
                    className={`text-3xl transition-colors ${star <= reviewRating ? "text-orange-500" : "text-zinc-300"}`}>
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-700 mb-2">Comment (optional)</label>
              <textarea value={reviewComment} onChange={(e) => onReviewCommentChange(e.target.value)} rows={3}
                className="w-full px-4 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="How was your experience?" />
            </div>
            <div className="flex gap-3">
              <button onClick={onSubmitReview} disabled={submittingReview}
                className="flex-1 py-3 bg-orange-500 text-white rounded-full font-medium hover:bg-orange-600 transition-colors disabled:opacity-50">
                {submittingReview ? "Submitting..." : "Submit Review"}
              </button>
              <button onClick={onCloseReviewModal} disabled={submittingReview}
                className="px-6 py-3 border border-zinc-200 text-zinc-700 rounded-full font-medium hover:bg-zinc-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <EventShareModal
        isOpen={showShareModal}
        onClose={onCloseShareModal}
        onShare={onShareImage}
        isGenerating={isGenerating}
        isSharing={isSharing}
        eventTitle={event.title}
        sportType={event.sport_type}
        datetime={event.datetime}
        location={event.location}
        hostName={hostName}
        isPastEvent={isPastEvent}
        eventUrl={typeof window !== "undefined" ? window.location.href : ""}
      />
    </>
  );
}
