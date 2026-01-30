"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import LocationLink from "@/components/LocationLink";

type Event = {
  id: string;
  title: string;
  description: string | null;
  sport_type: string;
  location: string;
  datetime: string;
  duration: number;
  max_participants: number;
  creator_id: string;
  created_at: string;
  skill_level: string;
  latitude: number | null;
  longitude: number | null;
};

type ParticipantInfo = {
  id: string;
  user_id: string;
  name: string | null;
  avatar_url: string | null;
};

type Comment = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user_name: string | null;
  user_avatar: string | null;
};

type HostInfo = {
  id: string;
  name: string | null;
  avatar_url: string | null;
};

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);
  const [host, setHost] = useState<HostInfo | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewingUser, setReviewingUser] = useState<ParticipantInfo | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [existingReviews, setExistingReviews] = useState<string[]>([]); // user IDs already reviewed
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  async function handleShare() {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const isJoined = participants.some((p) => p.user_id === user?.id);
  const isCreator = event?.creator_id === user?.id;
  const isFull = participants.length >= (event?.max_participants || 0);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      // Get event
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (eventError || !eventData) {
        setError("Event not found");
        setLoading(false);
        return;
      }

      setEvent(eventData);

      // Get host info from profiles table (if exists) or use current user if they're the host
      if (user && eventData.creator_id === user.id) {
        setHost({
          id: user.id,
          name: user.user_metadata?.name || null,
          avatar_url: user.user_metadata?.avatar_url || null,
        });
      } else {
        // Try to get from profiles table
        const { data: hostProfile } = await supabase
          .from("profiles")
          .select("id, name, avatar_url")
          .eq("id", eventData.creator_id)
          .single();

        if (hostProfile) {
          setHost(hostProfile);
        } else {
          setHost({ id: eventData.creator_id, name: null, avatar_url: null });
        }
      }

      // Get participants
      const { data: participantsData } = await supabase
        .from("event_participants")
        .select("id, user_id")
        .eq("event_id", eventId);

      if (participantsData && participantsData.length > 0) {
        // Try to get participant profiles
        const userIds = participantsData.map((p) => p.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, name, avatar_url")
          .in("id", userIds);

        const participantsWithInfo = participantsData.map((p) => {
          const profile = profiles?.find((prof) => prof.id === p.user_id);
          // Check if this participant is the current user
          if (user && p.user_id === user.id) {
            return {
              id: p.id,
              user_id: p.user_id,
              name: user.user_metadata?.name || null,
              avatar_url: user.user_metadata?.avatar_url || null,
            };
          }
          return {
            id: p.id,
            user_id: p.user_id,
            name: profile?.name || null,
            avatar_url: profile?.avatar_url || null,
          };
        });

        setParticipants(participantsWithInfo);
      }

      // Get existing reviews by current user for this event
      if (user) {
        const { data: userReviews } = await supabase
          .from("reviews")
          .select("reviewed_id")
          .eq("event_id", eventId)
          .eq("reviewer_id", user.id);

        if (userReviews) {
          setExistingReviews(userReviews.map((r) => r.reviewed_id));
        }
      }

      // Get comments
      const { data: commentsData } = await supabase
        .from("event_comments")
        .select("id, content, created_at, user_id")
        .eq("event_id", eventId)
        .order("created_at", { ascending: true });

      if (commentsData && commentsData.length > 0) {
        const commenterIds = commentsData.map((c) => c.user_id);
        const { data: commenterProfiles } = await supabase
          .from("profiles")
          .select("id, name, avatar_url")
          .in("id", commenterIds);

        const commentsWithUser = commentsData.map((c) => {
          const profile = commenterProfiles?.find((p) => p.id === c.user_id);
          // Check if commenter is current user
          if (user && c.user_id === user.id) {
            return {
              ...c,
              user_name: user.user_metadata?.name || null,
              user_avatar: user.user_metadata?.avatar_url || null,
            };
          }
          return {
            ...c,
            user_name: profile?.name || null,
            user_avatar: profile?.avatar_url || null,
          };
        });
        setComments(commentsWithUser);
      }

      setLoading(false);
    }

    fetchData();
  }, [eventId]);

  const isPastEvent = event ? new Date(event.datetime) < new Date() : false;

  async function handleSubmitReview() {
    if (!user || !reviewingUser || !event) return;

    setSubmittingReview(true);
    const supabase = createClient();

    const { error } = await supabase.from("reviews").insert({
      event_id: event.id,
      reviewer_id: user.id,
      reviewed_id: reviewingUser.user_id,
      rating: reviewRating,
      comment: reviewComment || null,
    });

    if (error) {
      setError(error.message);
      setSubmittingReview(false);
      return;
    }

    setExistingReviews([...existingReviews, reviewingUser.user_id]);
    setShowReviewModal(false);
    setReviewingUser(null);
    setReviewRating(5);
    setReviewComment("");
    setSubmittingReview(false);
  }

  function openReviewModal(participant: ParticipantInfo) {
    setReviewingUser(participant);
    setReviewRating(5);
    setReviewComment("");
    setShowReviewModal(true);
  }

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setSubmittingComment(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("event_comments")
      .insert({
        event_id: eventId,
        user_id: user.id,
        content: newComment.trim(),
      })
      .select()
      .single();

    if (error) {
      setError(error.message);
      setSubmittingComment(false);
      return;
    }

    // Add to comments list
    setComments([
      ...comments,
      {
        id: data.id,
        content: data.content,
        created_at: data.created_at,
        user_id: user.id,
        user_name: user.user_metadata?.name || null,
        user_avatar: user.user_metadata?.avatar_url || null,
      },
    ]);
    setNewComment("");
    setSubmittingComment(false);
  }

  async function handleJoin() {
    if (!user) {
      router.push("/login");
      return;
    }

    setJoining(true);
    const supabase = createClient();

    // Ensure user profile exists in profiles table
    await supabase.from("profiles").upsert({
      id: user.id,
      name: user.user_metadata?.name || null,
      avatar_url: user.user_metadata?.avatar_url || null,
    }, { onConflict: "id" });

    const { error } = await supabase.from("event_participants").insert({
      event_id: eventId,
      user_id: user.id,
    });

    if (error) {
      setError(error.message);
      setJoining(false);
      return;
    }

    // Add current user to participants list
    setParticipants((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        user_id: user.id,
        name: user.user_metadata?.name || null,
        avatar_url: user.user_metadata?.avatar_url || null,
      },
    ]);
    setJoining(false);
  }

  async function handleLeave() {
    if (!user) return;

    setJoining(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("event_participants")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", user.id);

    if (error) {
      setError(error.message);
      setJoining(false);
      return;
    }

    setParticipants((prev) => prev.filter((p) => p.user_id !== user.id));
    setJoining(false);
  }

  async function handleDelete() {
    if (!user || !isCreator) return;

    setDeleting(true);
    const supabase = createClient();

    await supabase.from("event_participants").delete().eq("event_id", eventId);

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", eventId)
      .eq("creator_id", user.id);

    if (error) {
      setError(error.message);
      setDeleting(false);
      return;
    }

    router.push("/dashboard");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fbfbfd]">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-zinc-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-[#fbfbfd]">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="text-6xl mb-4">😕</div>
            <p className="text-zinc-500 mb-4">{error || "Event not found"}</p>
            <Link
              href="/events"
              className="text-emerald-600 hover:underline font-medium"
            >
              ← Back to events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const date = new Date(event.datetime);
  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const spotsLeft = event.max_participants - participants.length;

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-[#fbfbfd]">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Back link */}
        <Link
          href="/events"
          className="inline-flex items-center text-zinc-600 hover:text-emerald-600 mb-6 font-medium"
        >
          ← Back to events
        </Link>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Event Header Card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-6 text-white">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 right-10 text-6xl">
                  {event.sport_type === "running" && "🏃"}
                  {event.sport_type === "tennis" && "🎾"}
                  {event.sport_type === "cycling" && "🚴"}
                  {event.sport_type === "gym" && "💪"}
                  {event.sport_type === "yoga" && "🧘"}
                  {event.sport_type === "basketball" && "🏀"}
                  {event.sport_type === "soccer" && "⚽"}
                  {event.sport_type === "swimming" && "🏊"}
                  {event.sport_type === "hiking" && "🥾"}
                </div>
              </div>

              <div className="relative">
                <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm font-medium capitalize mb-4">
                  {event.sport_type}
                </span>
                <h1 className="text-3xl font-bold mb-4">{event.title}</h1>

                <div className="flex flex-wrap gap-4 text-white/90">
                  <div className="flex items-center gap-2">
                    <LocationLink
                      location={event.location}
                      latitude={event.latitude}
                      longitude={event.longitude}
                      className="text-white/90 hover:text-white"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📅</span>
                    <span>
                      {formattedDate} at {formattedTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>⏱️</span>
                    <span>
                      {event.duration >= 60
                        ? `${event.duration / 60} hour${event.duration > 60 ? "s" : ""}`
                        : `${event.duration} min`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {event.description && (
              <div className="bg-white rounded-2xl border border-zinc-200 p-6">
                <h2 className="text-lg font-semibold text-zinc-900 mb-3 flex items-center gap-2">
                  <span>📝</span> About this event
                </h2>
                <p className="text-zinc-600 whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            )}

            {/* Comments */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-6">
              <h2 className="text-lg font-semibold text-zinc-900 mb-4 flex items-center gap-2">
                <span>💬</span> Discussion ({comments.length})
              </h2>

              {/* Comment Form */}
              {user ? (
                <form onSubmit={handleSubmitComment} className="mb-4">
                  <div className="flex gap-3">
                    {user.user_metadata?.avatar_url ? (
                      <Image
                        src={user.user_metadata.avatar_url}
                        alt="You"
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-medium flex-shrink-0">
                        {getInitials(user.user_metadata?.name || null)}
                      </div>
                    )}
                    <div className="flex-1">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Ask a question or leave a comment..."
                        rows={2}
                        className="w-full px-4 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          type="submit"
                          disabled={!newComment.trim() || submittingComment}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submittingComment ? "Posting..." : "Post"}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              ) : (
                <p className="text-center text-sm text-zinc-500 mb-4 py-2 bg-zinc-50 rounded-lg">
                  <Link href="/login" className="text-emerald-600 hover:underline">
                    Log in
                  </Link>{" "}
                  to join the discussion
                </p>
              )}

              {/* Comments List */}
              {comments.length === 0 ? (
                <p className="text-zinc-500 text-center py-4">
                  No comments yet. Be the first to ask a question!
                </p>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Link href={`/users/${comment.user_id}`} className="flex-shrink-0">
                        {comment.user_avatar ? (
                          <Image
                            src={comment.user_avatar}
                            alt={comment.user_name || "User"}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-medium">
                            {getInitials(comment.user_name)}
                          </div>
                        )}
                      </Link>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/users/${comment.user_id}`}
                            className="font-medium text-zinc-900 hover:text-emerald-600"
                          >
                            {comment.user_name || "Anonymous"}
                          </Link>
                          <span className="text-xs text-zinc-400">
                            {new Date(comment.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-zinc-600 mt-1">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Participants */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
                  <span>👥</span> Participants
                </h2>
                <span
                  className={`text-sm font-medium ${
                    spotsLeft <= 0
                      ? "text-red-500"
                      : spotsLeft <= 2
                      ? "text-orange-500"
                      : "text-emerald-600"
                  }`}
                >
                  {spotsLeft <= 0
                    ? "Full"
                    : `${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} left`}
                </span>
              </div>

              {participants.length === 0 ? (
                <p className="text-zinc-500 text-center py-4">
                  No one has joined yet. Be the first!
                </p>
              ) : (
                <div className="space-y-3">
                  {participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl"
                    >
                      <Link
                        href={`/users/${participant.user_id}`}
                        className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity"
                      >
                        {participant.avatar_url ? (
                          <Image
                            src={participant.avatar_url}
                            alt={participant.name || "Participant"}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-medium">
                            {getInitials(participant.name)}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-zinc-900">
                            {participant.name || "Anonymous"}
                            {participant.user_id === user?.id && (
                              <span className="ml-2 text-xs text-emerald-600">
                                (You)
                              </span>
                            )}
                          </p>
                        </div>
                      </Link>
                      {/* Rate button - only available after event ends */}
                      {user &&
                        participant.user_id !== user.id &&
                        (isJoined || isCreator) && (
                          isPastEvent ? (
                            existingReviews.includes(participant.user_id) ? (
                              <span className="text-xs text-zinc-400 px-2 py-1 bg-zinc-200 rounded-full">
                                Rated
                              </span>
                            ) : (
                              <button
                                onClick={() => openReviewModal(participant)}
                                className="text-xs text-emerald-600 hover:text-emerald-700 px-3 py-1 border border-emerald-500 rounded-full hover:bg-emerald-50 transition-colors"
                              >
                                Rate
                              </button>
                            )
                          ) : null
                        )}
                    </div>
                  ))}
                </div>
              )}

              {/* Rating info for upcoming events */}
              {!isPastEvent && user && participants.length > 0 && (isJoined || isCreator) && (
                <p className="text-xs text-zinc-400 mt-3 text-center italic">
                  Rating will be available after the event ends
                </p>
              )}

              {/* Progress bar */}
              <div className="mt-4 pt-4 border-t border-zinc-200">
                <div className="flex justify-between text-sm text-zinc-500 mb-2">
                  <span>
                    {participants.length} / {event.max_participants} joined
                  </span>
                  <span>
                    {Math.round(
                      (participants.length / event.max_participants) * 100
                    )}
                    %
                  </span>
                </div>
                <div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      spotsLeft <= 0
                        ? "bg-red-500"
                        : spotsLeft <= 2
                        ? "bg-orange-500"
                        : "bg-emerald-500"
                    }`}
                    style={{
                      width: `${Math.min(
                        (participants.length / event.max_participants) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Host Card */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-6">
              <h2 className="text-sm font-medium text-zinc-500 mb-4">
                Hosted by
              </h2>
              <div className="flex items-center gap-3">
                <Link
                  href={`/users/${host?.id}`}
                  className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity"
                >
                  {host?.avatar_url ? (
                    <Image
                      src={host.avatar_url}
                      alt={host.name || "Host"}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white flex items-center justify-center font-bold text-lg">
                      {getInitials(host?.name || null)}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-zinc-900">
                      {host?.name || "Event Host"}
                      {isCreator && (
                        <span className="ml-2 text-xs text-emerald-600">
                          (You)
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-zinc-500">Event Organizer</p>
                  </div>
                </Link>
                {/* Rate host button - only available after event ends */}
                {user &&
                  !isCreator &&
                  isJoined &&
                  host && (
                    isPastEvent ? (
                      existingReviews.includes(host.id) ? (
                        <span className="text-xs text-zinc-400 px-2 py-1 bg-zinc-200 rounded-full">
                          Rated
                        </span>
                      ) : (
                        <button
                          onClick={() =>
                            openReviewModal({
                              id: host.id,
                              user_id: host.id,
                              name: host.name,
                              avatar_url: host.avatar_url,
                            })
                          }
                          className="text-xs text-emerald-600 hover:text-emerald-700 px-3 py-1 border border-emerald-500 rounded-full hover:bg-emerald-50 transition-colors"
                        >
                          Rate
                        </button>
                      )
                    ) : null
                  )}
              </div>
            </div>

            {/* Action Card */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-6">
              {isCreator ? (
                <div className="space-y-3">
                  {!isPastEvent && (
                    <Link
                      href={`/events/${event.id}/edit`}
                      className="block w-full py-3 bg-emerald-600 text-white text-center rounded-xl font-medium hover:bg-emerald-700 transition-colors"
                    >
                      Edit Event
                    </Link>
                  )}

                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full py-3 border border-red-300 text-red-600 rounded-xl font-medium hover:bg-red-50 transition-colors"
                    >
                      Delete Event
                    </button>
                  ) : (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="text-red-700 text-sm mb-3">
                        Delete this event? This cannot be undone.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleDelete}
                          disabled={deleting}
                          className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                        >
                          {deleting ? "..." : "Delete"}
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          disabled={deleting}
                          className="flex-1 py-2 border border-zinc-300 text-zinc-700 rounded-lg text-sm font-medium disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : isJoined ? (
                <div className="space-y-3">
                  <div className="text-center py-2 px-4 bg-emerald-50 rounded-xl">
                    <span className="text-emerald-600 font-medium">
                      ✓ You&apos;re going!
                    </span>
                  </div>
                  <button
                    onClick={handleLeave}
                    disabled={joining}
                    className="w-full py-3 border border-zinc-300 text-zinc-700 rounded-xl font-medium hover:bg-zinc-50 transition-colors disabled:opacity-50"
                  >
                    {joining ? "Leaving..." : "Leave Event"}
                  </button>
                </div>
              ) : isFull ? (
                <div className="text-center py-4">
                  <div className="text-4xl mb-2">😔</div>
                  <p className="text-zinc-500 font-medium">
                    This event is full
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold text-lg hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/25"
                >
                  {joining ? "Joining..." : "🎉 Join Event"}
                </button>
              )}

              {!user && !isJoined && (
                <p className="text-center text-sm text-zinc-500 mt-3">
                  <Link href="/login" className="text-emerald-600 hover:underline">
                    Log in
                  </Link>{" "}
                  to join this event
                </p>
              )}
            </div>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="w-full py-3 bg-zinc-100 text-zinc-700 rounded-2xl font-medium hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-emerald-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
                  </svg>
                  <span>Share Event</span>
                </>
              )}
            </button>

            {/* Event Info */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-6">
              <h2 className="text-sm font-medium text-zinc-500 mb-4">
                Event Details
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Sport</span>
                  <span className="font-medium text-zinc-900 capitalize">
                    {event.sport_type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Duration</span>
                  <span className="font-medium text-zinc-900">
                    {event.duration >= 60
                      ? `${event.duration / 60} hour${event.duration > 60 ? "s" : ""}`
                      : `${event.duration} min`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Skill Level</span>
                  <span className="font-medium text-zinc-900 capitalize">
                    {event.skill_level === "all" ? "All Levels" : event.skill_level}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Max participants</span>
                  <span className="font-medium text-zinc-900">
                    {event.max_participants}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Created</span>
                  <span className="font-medium text-zinc-900">
                    {new Date(event.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Review Modal */}
      {showReviewModal && reviewingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-zinc-900 mb-4">
              Rate {reviewingUser.name || "Participant"}
            </h3>

            {/* Star Rating */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Rating
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewRating(star)}
                    className={`text-3xl transition-colors ${
                      star <= reviewRating
                        ? "text-yellow-500"
                        : "text-zinc-300"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Comment (optional)
              </label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg bg-white text-zinc-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="How was your experience with this person?"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleSubmitReview}
                disabled={submittingReview}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {submittingReview ? "Submitting..." : "Submit Review"}
              </button>
              <button
                onClick={() => setShowReviewModal(false)}
                disabled={submittingReview}
                className="px-6 py-3 border border-zinc-300 text-zinc-700 rounded-xl font-medium hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
