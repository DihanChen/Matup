"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import type {
  EventComment as Comment,
  EventDetailEvent as Event,
  HostInfo,
  ParticipantInfo,
} from "@/lib/queries/event-detail";

type Props = {
  event: Event;
  participants: ParticipantInfo[];
  host: HostInfo | null;
  user: User | null;
  isPastEvent: boolean;
  isCreator: boolean;
  isJoined: boolean;
  isFull: boolean;
  joining: boolean;
  existingReviews: string[];
  comments: Comment[];
  newComment: string;
  submittingComment: boolean;
  onNewCommentChange: (value: string) => void;
  onSubmitComment: (e: React.FormEvent) => void;
  onOpenReviewModal: (participant: ParticipantInfo) => void;
  onOpenEmailModal: () => void;
  onOpenCancelModal: () => void;
  onLeave: () => void;
  onOpenShareModal: () => void;
  onOpenJoinModal: () => void;
  onLoginRedirect: () => void;
  getInitials: (name: string | null) => string;
};

export default function EventDetailSidebar({
  event,
  participants,
  host,
  user,
  isPastEvent,
  isCreator,
  isJoined,
  isFull,
  joining,
  existingReviews,
  comments,
  newComment,
  submittingComment,
  onNewCommentChange,
  onSubmitComment,
  onOpenReviewModal,
  onOpenEmailModal,
  onOpenCancelModal,
  onLeave,
  onOpenShareModal,
  onOpenJoinModal,
  onLoginRedirect,
  getInitials,
}: Props) {
  return (
    <div className="md:col-span-2 space-y-6">
      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-4">
          Players ({participants.length}/{event.max_participants})
        </h2>

        <div className="flex -space-x-2 mb-5">
          {participants.slice(0, 4).map((p) => (
            <Link key={p.id} href={`/users/${p.user_id}`} className="block">
              {p.avatar_url ? (
                <Image src={p.avatar_url} alt={p.name || ""} width={44} height={44} className="w-11 h-11 rounded-full border-2 border-white object-cover" />
              ) : (
                <div className="w-11 h-11 rounded-full border-2 border-white bg-zinc-200 text-zinc-500 flex items-center justify-center font-medium text-sm">
                  {getInitials(p.name)}
                </div>
              )}
            </Link>
          ))}
          {participants.length > 4 && (
            <div className="w-11 h-11 rounded-full border-2 border-white bg-orange-500 text-white flex items-center justify-center font-bold text-sm">
              +{participants.length - 4}
            </div>
          )}
        </div>

        {!isPastEvent && !isCreator && !isFull && (
          <RegistrationCountdown eventDatetime={event.datetime} />
        )}

        {isCreator ? (
          <div className="space-y-3">
            {!isPastEvent && (
              <Link href={`/events/${event.id}/edit`}
                className="block w-full py-3 bg-zinc-900 text-white text-center rounded-full font-medium hover:bg-zinc-800 transition-colors">
                Edit Event
              </Link>
            )}
            <button onClick={onOpenEmailModal}
              className="w-full py-3 border border-zinc-200 text-zinc-700 rounded-full font-medium hover:bg-zinc-50 transition-colors">
              Email Participants
            </button>
            <button onClick={onOpenCancelModal}
              className="w-full py-3 border border-orange-500 text-orange-500 rounded-full font-medium hover:bg-orange-50 transition-colors">
              Cancel Event
            </button>
          </div>
        ) : isJoined ? (
          <div className="space-y-3">
            <button onClick={onLeave} disabled={joining}
              className="w-full py-3 bg-zinc-900 text-white rounded-full font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50">
              {joining ? "Leaving..." : "Can't Make It"}
            </button>
            <button onClick={onOpenShareModal}
              className="w-full py-3 border border-zinc-200 text-zinc-700 rounded-full font-medium hover:bg-zinc-50 transition-colors">
              Share with Friend
            </button>
          </div>
        ) : isFull ? (
          <div className="text-center py-4">
            <p className="text-zinc-500 font-medium">This event is full</p>
          </div>
        ) : (
          <div className="space-y-3">
            <button onClick={user ? onOpenJoinModal : onLoginRedirect} disabled={joining}
              className="w-full py-3.5 bg-zinc-900 text-white rounded-full font-bold hover:bg-zinc-800 transition-all disabled:opacity-50">
              Join Events
            </button>
            <button onClick={onOpenShareModal}
              className="w-full py-3 border border-zinc-200 text-zinc-700 rounded-full font-medium hover:bg-zinc-50 transition-colors">
              Share with Friend
            </button>
          </div>
        )}

        {!user && !isJoined && (
          <p className="text-center text-sm text-zinc-500 mt-3">
            <Link href="/login" className="text-orange-500 hover:underline">Log in</Link> to join this event
          </p>
        )}
      </div>

      <Link href={`/users/${host?.id}`} className="block bg-white rounded-2xl border border-zinc-200 p-6 hover:border-zinc-300 transition-colors">
        <h2 className="text-sm font-medium text-orange-500 mb-3">Hosted by</h2>
        <div className="flex items-center gap-3 mb-4">
          {host?.avatar_url ? (
            <Image src={host.avatar_url} alt={host.name || "Host"} width={52} height={52} className="w-13 h-13 rounded-full object-cover" />
          ) : (
            <div className="w-13 h-13 rounded-full bg-zinc-200 text-zinc-500 flex items-center justify-center font-bold text-lg" style={{ width: 52, height: 52 }}>
              {getInitials(host?.name || null)}
            </div>
          )}
          <div>
            <p className="font-bold text-zinc-900 text-lg flex items-center gap-1.5">
              {host?.name || "Event Host"}
              <svg className="w-5 h-5 text-zinc-900" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </p>
            <p className="text-xs text-zinc-500">Host since {new Date(event.created_at).getFullYear()}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-zinc-900">100%</div>
            <div className="text-xs text-zinc-500">Attendance</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-zinc-900">5.0</div>
            <div className="text-xs text-zinc-500">Rating</div>
          </div>
        </div>
      </Link>

      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <h2 className="text-lg font-bold text-zinc-900 mb-4">Discussion</h2>

        {user ? (
          <form onSubmit={onSubmitComment} className="mb-4">
            <div className="flex gap-3">
              {user.user_metadata?.avatar_url ? (
                <Image src={user.user_metadata.avatar_url} alt="You" width={36} height={36} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-zinc-200 text-zinc-500 flex items-center justify-center font-medium text-sm flex-shrink-0">
                  {getInitials(user.user_metadata?.name || null)}
                </div>
              )}
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => onNewCommentChange(e.target.value)}
                  placeholder="Ask a question or leave a comment..."
                  rows={2}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                />
                <div className="flex justify-end mt-2">
                  <button type="submit" disabled={!newComment.trim() || submittingComment}
                    className="px-4 py-1.5 bg-zinc-900 text-white rounded-full text-sm font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {submittingComment ? "..." : "Post"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <p className="text-center text-sm text-zinc-500 py-4">
            <Link href="/login" className="text-orange-500 hover:underline">Log in</Link> to join the discussion
          </p>
        )}

        {comments.length > 0 && (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Link href={`/users/${comment.user_id}`} className="flex-shrink-0">
                  {comment.user_avatar ? (
                    <Image src={comment.user_avatar} alt={comment.user_name || "User"} width={36} height={36} className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-zinc-200 text-zinc-500 flex items-center justify-center font-medium text-sm">
                      {getInitials(comment.user_name)}
                    </div>
                  )}
                </Link>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Link href={`/users/${comment.user_id}`} className="font-medium text-zinc-900 text-sm hover:text-orange-500">
                      {comment.user_name || "Anonymous"}
                    </Link>
                    <span className="text-xs text-zinc-400">
                      {new Date(comment.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <p className="text-zinc-600 text-sm mt-1">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {event.description && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <h2 className="text-lg font-bold text-zinc-900 mb-4">Notes</h2>
          <div className="space-y-3">
            {event.description.split(/[.!\n]/).filter(s => s.trim()).slice(0, 4).map((note, i) => (
              <div key={i} className="flex items-start gap-3">
                <svg className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span className="text-zinc-700 text-sm">{note.trim()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-zinc-900">Feedback</h2>
          <span className="text-sm text-zinc-500">
            <span className="text-orange-500 font-bold">★ 5.0</span> ({participants.length})
          </span>
        </div>

        {participants.length > 0 ? (
          <div className="space-y-4">
            {participants.slice(0, 2).map((p) => (
              <div key={p.id}>
                <div className="flex items-center gap-3 mb-2">
                  <Link href={`/users/${p.user_id}`}>
                    {p.avatar_url ? (
                      <Image src={p.avatar_url} alt={p.name || ""} width={36} height={36} className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-zinc-200 text-zinc-500 flex items-center justify-center font-medium text-sm">
                        {getInitials(p.name)}
                      </div>
                    )}
                  </Link>
                  <div>
                    <p className="font-medium text-zinc-900 text-sm">{p.name || "Anonymous"}</p>
                    <p className="text-xs text-zinc-400">Participant</p>
                  </div>
                </div>
                {isPastEvent && user && p.user_id !== user.id && (isJoined || isCreator) && (
                  existingReviews.includes(p.user_id) ? (
                    <span className="text-xs text-zinc-400">Reviewed</span>
                  ) : (
                    <button onClick={() => onOpenReviewModal(p)}
                      className="text-xs text-orange-500 hover:text-orange-600 font-medium">
                      Leave a review
                    </button>
                  )
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-zinc-500 text-sm text-center py-4">No feedback yet</p>
        )}
      </div>
    </div>
  );
}

function RegistrationCountdown({ eventDatetime }: { eventDatetime: string }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function update() {
      const now = new Date().getTime();
      const eventTime = new Date(eventDatetime).getTime();
      const diff = eventTime - now;

      if (diff <= 0) {
        setTimeLeft("Started");
        setProgress(100);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours >= 24) {
        const days = Math.floor(hours / 24);
        setTimeLeft(`${days}d ${hours % 24}h`);
      } else {
        setTimeLeft(`${hours}h ${minutes}m`);
      }

      const totalWindow = 7 * 24 * 60 * 60 * 1000;
      const elapsed = totalWindow - Math.min(diff, totalWindow);
      setProgress(Math.min((elapsed / totalWindow) * 100, 100));
    }

    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [eventDatetime]);

  return (
    <div className="mb-4 p-4 bg-zinc-50 rounded-xl">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-zinc-700">Registration closes in:</span>
        <span className="text-sm font-bold text-orange-500">{timeLeft}</span>
      </div>
      <div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-orange-500 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
