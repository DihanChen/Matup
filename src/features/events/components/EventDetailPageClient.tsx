"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import EventDetailSidebar from "@/features/events/components/EventDetailSidebar";
import EventDetailModals from "@/features/events/components/EventDetailModals";
import {
  getCoverSrcForSport,
  useEventDetailPage,
} from "@/features/events/hooks/useEventDetailPage";

export default function EventDetailPageClient() {
  const router = useRouter();
  const {
    event,
    participants,
    host,
    user,
    loading,
    joining,
    deleting,
    showCancelModal,
    setShowCancelModal,
    showJoinModal,
    setShowJoinModal,
    error,
    showReviewModal,
    setShowReviewModal,
    reviewingUser,
    reviewRating,
    setReviewRating,
    reviewComment,
    setReviewComment,
    submittingReview,
    showEmailModal,
    emailSubject,
    setEmailSubject,
    emailMessage,
    setEmailMessage,
    sendingEmail,
    emailError,
    emailSuccess,
    emailTemplate,
    existingReviews,
    comments,
    newComment,
    setNewComment,
    submittingComment,
    showShareModal,
    isGenerating,
    isSharing,
    openShareModal,
    closeShareModal,
    shareImage,
    isJoined,
    isCreator,
    isFull,
    emailRecipientCount,
    isPastEvent,
    openReviewModal,
    openEmailModal,
    closeEmailModal,
    handleTemplateChange,
    handleSendEmail,
    handleSubmitReview,
    handleSubmitComment,
    handleJoin,
    handleLeave,
    handleDelete,
  } = useEventDetailPage();

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <main className="max-w-6xl mx-auto px-6 py-8 animate-pulse">
          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-3 space-y-6">
              <div className="rounded-2xl border border-zinc-200 overflow-hidden">
                <div className="h-[280px] md:h-[340px] bg-zinc-100" />
                <div className="p-6 space-y-4">
                  <div className="h-6 w-3/4 bg-zinc-200 rounded" />
                  <div className="h-4 w-1/2 bg-zinc-100 rounded" />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                    {[1, 2, 3, 4].map((item) => (
                      <div key={`event-detail-skeleton-stat-${item}`} className="h-12 rounded bg-zinc-100" />
                    ))}
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-zinc-200 p-6 h-40 bg-zinc-50" />
            </div>
            <div className="md:col-span-2 space-y-6">
              <div className="rounded-2xl border border-zinc-200 p-5 h-36 bg-zinc-50" />
              <div className="rounded-2xl border border-zinc-200 p-5 h-44 bg-zinc-50" />
              <div className="rounded-2xl border border-zinc-200 p-5 h-40 bg-zinc-50" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-zinc-500 mb-4">{error || "Event not found"}</p>
            <Link href="/events" className="text-orange-500 hover:underline font-medium">Back to events</Link>
          </div>
        </div>
      </div>
    );
  }

  const date = new Date(event.datetime);
  const formattedDate = date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  const formattedTime = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-5 gap-8">
          <div className="md:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
              <div className="h-[280px] md:h-[340px] relative bg-zinc-100">
                <Image
                  src={event.cover_url || getCoverSrcForSport(event.sport_type)}
                  alt={event.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 60vw"
                  quality={80}
                  priority
                  className="object-cover"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              </div>

              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  {event.skill_level && event.skill_level !== "all" && (
                    <span className="px-3 py-1 text-zinc-700 text-sm font-medium capitalize">
                      {event.skill_level}
                    </span>
                  )}
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm font-medium rounded-full capitalize">
                    {event.sport_type}
                  </span>
                </div>

                <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-1">{event.title}</h1>
                <p className="text-zinc-500 mb-6">{event.location}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-5 border-t border-zinc-100">
                  <div>
                    <div className="text-[11px] text-zinc-400 uppercase tracking-widest font-medium mb-1">Date</div>
                    <div className="flex items-center gap-1.5 font-semibold text-zinc-900 text-sm">
                      {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-zinc-400 uppercase tracking-widest font-medium mb-1">Time</div>
                    <div className="flex items-center gap-1.5 font-semibold text-zinc-900 text-sm">{formattedTime}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-zinc-400 uppercase tracking-widest font-medium mb-1">Format</div>
                    <div className="flex items-center gap-1.5 font-semibold text-zinc-900 text-sm capitalize">
                      {event.skill_level === "all" ? "All Levels" : event.skill_level}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-zinc-400 uppercase tracking-widest font-medium mb-1">Status</div>
                    <div className="flex items-center gap-1.5 font-semibold text-zinc-900 text-sm">
                      {participants.length}/{event.max_participants} Joined
                    </div>
                  </div>
                </div>

                {event.description && (
                  <div className="pt-5 border-t border-zinc-100">
                    <h2 className="text-lg font-bold text-zinc-900 mb-3">About this activity</h2>
                    <p className="text-zinc-600 leading-relaxed whitespace-pre-wrap">{event.description}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-zinc-900">Location</h2>
                {event.latitude && event.longitude && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-full text-sm font-medium hover:bg-zinc-800 transition-colors"
                  >
                    Get Directions
                  </a>
                )}
              </div>

              {event.latitude && event.longitude ? (
                <div className="relative rounded-xl overflow-hidden h-[200px] mb-4 bg-zinc-100">
                  <iframe
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${event.longitude - 0.005},${event.latitude - 0.005},${event.longitude + 0.005},${event.latitude + 0.005}&layer=mapnik&marker=${event.latitude},${event.longitude}`}
                    className="w-full h-full border-0"
                    loading="lazy"
                    title="Event location"
                  />
                  <div className="absolute inset-0" />
                </div>
              ) : (
                <div className="bg-zinc-100 rounded-xl h-[200px] flex items-center justify-center mb-4" />
              )}

              <div className="flex items-start gap-3 bg-zinc-50 rounded-xl p-4">
                <div>
                  <p className="font-semibold text-zinc-900 text-sm">
                    {event.location_name || event.location.split(",")[0]}
                  </p>
                  <p className="text-zinc-500 text-xs mt-0.5">
                    {event.address_line || event.location}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <EventDetailSidebar
            event={event}
            participants={participants}
            host={host}
            user={user}
            isPastEvent={isPastEvent}
            isCreator={isCreator}
            isJoined={isJoined}
            isFull={isFull}
            joining={joining}
            existingReviews={existingReviews}
            comments={comments}
            newComment={newComment}
            submittingComment={submittingComment}
            onNewCommentChange={setNewComment}
            onSubmitComment={handleSubmitComment}
            onOpenReviewModal={openReviewModal}
            onOpenEmailModal={openEmailModal}
            onOpenCancelModal={() => setShowCancelModal(true)}
            onLeave={handleLeave}
            onOpenShareModal={openShareModal}
            onOpenJoinModal={() => setShowJoinModal(true)}
            onLoginRedirect={() => router.push("/login")}
            getInitials={getInitials}
          />
        </div>
      </main>

      <EventDetailModals
        event={event}
        participants={participants}
        showJoinModal={showJoinModal}
        showCancelModal={showCancelModal}
        showEmailModal={showEmailModal}
        showReviewModal={showReviewModal}
        reviewingUser={reviewingUser}
        joining={joining}
        deleting={deleting}
        emailRecipientCount={emailRecipientCount}
        emailTemplate={emailTemplate}
        emailSubject={emailSubject}
        emailMessage={emailMessage}
        sendingEmail={sendingEmail}
        emailError={emailError}
        emailSuccess={emailSuccess}
        reviewRating={reviewRating}
        reviewComment={reviewComment}
        submittingReview={submittingReview}
        showShareModal={showShareModal}
        isGenerating={isGenerating}
        isSharing={isSharing}
        isPastEvent={isPastEvent}
        hostName={host?.name || "Event Host"}
        onCloseJoinModal={() => setShowJoinModal(false)}
        onConfirmJoin={handleJoin}
        onCloseCancelModal={() => setShowCancelModal(false)}
        onConfirmCancel={handleDelete}
        onCloseEmailModal={closeEmailModal}
        onSendEmail={handleSendEmail}
        onEmailTemplateChange={handleTemplateChange}
        onEmailSubjectChange={setEmailSubject}
        onEmailMessageChange={setEmailMessage}
        onCloseReviewModal={() => setShowReviewModal(false)}
        onReviewRatingChange={setReviewRating}
        onReviewCommentChange={setReviewComment}
        onSubmitReview={handleSubmitReview}
        onCloseShareModal={closeShareModal}
        onShareImage={shareImage}
        formattedDate={formattedDate}
        formattedTime={formattedTime}
      />
    </div>
  );
}
