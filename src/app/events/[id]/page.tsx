"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { getApiBaseUrl } from "@/lib/api";
import type { User } from "@supabase/supabase-js";
import EventShareModal from "@/components/share/EventShareModal";
import { useEventShare } from "@/components/share/useEventShare";

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
  cover_url?: string | null;
  location_name?: string | null;
  address_line?: string | null;
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

type EmailTemplate = {
  id: string;
  label: string;
  subject: (event: Event, dateLabel: string, timeLabel: string) => string;
  message: (
    event: Event,
    dateLabel: string,
    timeLabel: string,
    locationLabel: string
  ) => string;
};

const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "reminder",
    label: "Reminder",
    subject: (event) => `Reminder: ${event.title}`,
    message: (event, dateLabel, timeLabel, locationLabel) =>
      `Hi everyone,\nJust a reminder that ${event.title} is on ${dateLabel} at ${timeLabel}.\nLocation: ${locationLabel}\nPlease arrive a few minutes early. See you there!`,
  },
  {
    id: "schedule-change",
    label: "Schedule change",
    subject: (event) => `Schedule change: ${event.title}`,
    message: (event, dateLabel, timeLabel, locationLabel) =>
      `Hi everyone,\nThe schedule for ${event.title} has changed.\nNew time: ${dateLabel} at ${timeLabel}\nLocation: ${locationLabel}\nThanks for your flexibility.`,
  },
  {
    id: "location-update",
    label: "Location update",
    subject: (event) => `Location update: ${event.title}`,
    message: (event, dateLabel, timeLabel, locationLabel) =>
      `Hi everyone,\nWe have a new location for ${event.title} on ${dateLabel} at ${timeLabel}.\nNew location: ${locationLabel}\nPlease check the event details before arriving.`,
  },
  {
    id: "cancellation",
    label: "Cancellation",
    subject: (event) => `Cancellation: ${event.title}`,
    message: (event, dateLabel, timeLabel) =>
      `Hi everyone,\nUnfortunately, ${event.title} on ${dateLabel} at ${timeLabel} has been cancelled.\nSorry for the inconvenience. We will reschedule soon.`,
  },
];

function getCoverSrcForSport(sportType: string): string {
  if (sportType === "pickleball") return "/covers/tennis.jpg";
  return `/covers/${sportType}.jpg`;
}

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
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewingUser, setReviewingUser] = useState<ParticipantInfo | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [emailTemplate, setEmailTemplate] = useState("reminder");
  const [existingReviews, setExistingReviews] = useState<string[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const {
    isModalOpen: showShareModal,
    isGenerating,
    isSharing,
    openModal: openShareModal,
    closeModal: closeShareModal,
    shareImage,
  } = useEventShare();

  const isJoined = participants.some((p) => p.user_id === user?.id);
  const isCreator = event?.creator_id === user?.id;
  const isFull = participants.length >= (event?.max_participants || 0);
  const emailRecipientCount = participants.filter((p) => p.user_id !== user?.id).length;

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

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

      // Get host info
      if (user && eventData.creator_id === user.id) {
        setHost({
          id: user.id,
          name: user.user_metadata?.name || null,
          avatar_url: user.user_metadata?.avatar_url || null,
        });
      } else {
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
        const userIds = participantsData.map((p) => p.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, name, avatar_url")
          .in("id", userIds);

        const participantsWithInfo = participantsData.map((p) => {
          const profile = profiles?.find((prof) => prof.id === p.user_id);
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

      // Get existing reviews
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

  function getEmailTemplateValues(templateId: string, currentEvent: Event) {
    const template = EMAIL_TEMPLATES.find((item) => item.id === templateId);
    if (!template) return null;
    const date = new Date(currentEvent.datetime);
    const dateLabel = date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
    const timeLabel = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    const locationLabel = currentEvent.location_name || currentEvent.location;
    return {
      subject: template.subject(currentEvent, dateLabel, timeLabel),
      message: template.message(currentEvent, dateLabel, timeLabel, locationLabel),
    };
  }

  function openEmailModal() {
    if (!event) return;
    setEmailError(null);
    setEmailSuccess(null);
    if (!emailSubject.trim() && !emailMessage.trim()) {
      const values = getEmailTemplateValues(emailTemplate, event);
      if (values) {
        setEmailSubject(values.subject);
        setEmailMessage(values.message);
      }
    }
    setShowEmailModal(true);
  }

  function closeEmailModal() {
    setShowEmailModal(false);
    setEmailError(null);
    setEmailSuccess(null);
  }

  function handleTemplateChange(templateId: string) {
    if (!event) return;
    setEmailTemplate(templateId);
    const values = getEmailTemplateValues(templateId, event);
    if (values) {
      setEmailSubject(values.subject);
      setEmailMessage(values.message);
    }
  }

  async function handleSendEmail() {
    if (!event || !user) return;
    const trimmedSubject = emailSubject.trim();
    const trimmedMessage = emailMessage.trim();

    if (!trimmedSubject || !trimmedMessage) {
      setEmailError("Subject and message are required.");
      return;
    }

    if (emailRecipientCount === 0) {
      setEmailError("No participants to email yet.");
      return;
    }

    setSendingEmail(true);
    setEmailError(null);
    setEmailSuccess(null);

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setEmailError("You must be logged in to send emails.");
      setSendingEmail(false);
      return;
    }

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/email/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          type: "event",
          id: event.id,
          subject: trimmedSubject,
          message: trimmedMessage,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setEmailError(data?.error || "Failed to send email.");
        setSendingEmail(false);
        return;
      }

      const data = await response.json();
      const failedCount = data?.failed?.length || 0;
      const successText = failedCount
        ? `Sent to ${data.sent} participants (${failedCount} failed).`
        : `Sent to ${data.sent} participants.`;
      setEmailSuccess(successText);
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : "Failed to send email.");
    } finally {
      setSendingEmail(false);
    }
  }

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !newComment.trim()) return;
    setSubmittingComment(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("event_comments")
      .insert({ event_id: eventId, user_id: user.id, content: newComment.trim() })
      .select()
      .single();

    if (error) {
      setError(error.message);
      setSubmittingComment(false);
      return;
    }

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
    if (!user) { router.push("/login"); return; }
    setJoining(true);
    const supabase = createClient();

    await supabase.from("profiles").upsert({
      id: user.id,
      name: user.user_metadata?.name || null,
      avatar_url: user.user_metadata?.avatar_url || null,
    }, { onConflict: "id" });

    const { error } = await supabase.from("event_participants").insert({ event_id: eventId, user_id: user.id });

    if (error) { setError(error.message); setJoining(false); return; }

    setParticipants((prev) => [
      ...prev,
      { id: Date.now().toString(), user_id: user.id, name: user.user_metadata?.name || null, avatar_url: user.user_metadata?.avatar_url || null },
    ]);
    setJoining(false);
    setShowJoinModal(false);
  }

  async function handleLeave() {
    if (!user) return;
    setJoining(true);
    const supabase = createClient();
    const { error } = await supabase.from("event_participants").delete().eq("event_id", eventId).eq("user_id", user.id);
    if (error) { setError(error.message); setJoining(false); return; }
    setParticipants((prev) => prev.filter((p) => p.user_id !== user.id));
    setJoining(false);
  }

  async function handleDelete() {
    if (!user || !isCreator) return;
    setDeleting(true);
    const supabase = createClient();
    await supabase.from("event_participants").delete().eq("event_id", eventId);
    const { error } = await supabase.from("events").delete().eq("id", eventId).eq("creator_id", user.id);
    if (error) { setError(error.message); setDeleting(false); return; }
    router.push("/dashboard");
  }

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
        {/* 2-Column Grid */}
        <div className="grid md:grid-cols-5 gap-8">
          {/* Left Column (60%) */}
          <div className="md:col-span-3 space-y-6">
            {/* Main Event Card */}
            <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
              {/* Cover Photo */}
              <div className="h-[280px] md:h-[340px] relative bg-zinc-100">
                <Image
                  src={event.cover_url || getCoverSrcForSport(event.sport_type)}
                  alt={event.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 60vw"
                  quality={80}
                  priority
                  className="object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>

              <div className="p-6">
                {/* Badges */}
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

                {/* Title */}
                <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-1">{event.title}</h1>
                <p className="text-zinc-500 mb-6">{event.location}</p>

                {/* Info Row — 4 columns */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-5 border-t border-zinc-100">
                  <div>
                    <div className="text-[11px] text-zinc-400 uppercase tracking-widest font-medium mb-1">Date</div>
                    <div className="flex items-center gap-1.5 font-semibold text-zinc-900 text-sm">
                      <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25" />
                      </svg>
                      {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-zinc-400 uppercase tracking-widest font-medium mb-1">Time</div>
                    <div className="flex items-center gap-1.5 font-semibold text-zinc-900 text-sm">
                      <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                      {formattedTime}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-zinc-400 uppercase tracking-widest font-medium mb-1">Format</div>
                    <div className="flex items-center gap-1.5 font-semibold text-zinc-900 text-sm capitalize">
                      <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <circle cx="12" cy="12" r="9" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7l3 2.5v4L12 16l-3-2.5v-4L12 7z" />
                      </svg>
                      {event.skill_level === "all" ? "All Levels" : event.skill_level}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-zinc-400 uppercase tracking-widest font-medium mb-1">Status</div>
                    <div className="flex items-center gap-1.5 font-semibold text-zinc-900 text-sm">
                      <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Z" />
                      </svg>
                      {participants.length}/{event.max_participants} Joined
                    </div>
                  </div>
                </div>

                {/* About */}
                {event.description && (
                  <div className="pt-5 border-t border-zinc-100">
                    <h2 className="text-lg font-bold text-zinc-900 mb-3">About this activity</h2>
                    <p className="text-zinc-600 leading-relaxed whitespace-pre-wrap">{event.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Location Card */}
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

              {/* Static map preview */}
              {event.latitude && event.longitude ? (
                <div className="relative rounded-xl overflow-hidden h-[200px] mb-4 bg-zinc-100">
                  <iframe
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${event.longitude - 0.005},${event.latitude - 0.005},${event.longitude + 0.005},${event.latitude + 0.005}&layer=mapnik&marker=${event.latitude},${event.longitude}`}
                    className="w-full h-full border-0"
                    loading="lazy"
                    title="Event location"
                  />
                  {/* Overlay to prevent map interaction */}
                  <div className="absolute inset-0" />
                </div>
              ) : (
                <div className="bg-zinc-100 rounded-xl h-[200px] flex items-center justify-center mb-4">
                  <div className="text-center text-zinc-400">
                    <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-2">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {/* Location info */}
              <div className="flex items-start gap-3 bg-zinc-50 rounded-xl p-4">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                </div>
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

          {/* Right Column (40%) */}
          <div className="md:col-span-2 space-y-6">
            {/* Players Card */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-6">
              <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-4">
                Players ({participants.length}/{event.max_participants})
              </h2>

              {/* Avatar row */}
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

              {/* Registration countdown */}
              {!isPastEvent && !isCreator && !isFull && (
                <RegistrationCountdown eventDatetime={event.datetime} />
              )}

              {/* Actions */}
              {isCreator ? (
                <div className="space-y-3">
                  {!isPastEvent && (
                    <Link href={`/events/${event.id}/edit`}
                      className="block w-full py-3 bg-zinc-900 text-white text-center rounded-full font-medium hover:bg-zinc-800 transition-colors">
                      Edit Event
                    </Link>
                  )}
                  <button onClick={openEmailModal}
                    className="w-full py-3 border border-zinc-200 text-zinc-700 rounded-full font-medium hover:bg-zinc-50 transition-colors">
                    Email Participants
                  </button>
                  <button onClick={() => setShowCancelModal(true)}
                    className="w-full py-3 border border-orange-500 text-orange-500 rounded-full font-medium hover:bg-orange-50 transition-colors">
                    Cancel Event
                  </button>
                </div>
              ) : isJoined ? (
                <div className="space-y-3">
                  <button onClick={handleLeave} disabled={joining}
                    className="w-full py-3 bg-zinc-900 text-white rounded-full font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50">
                    {joining ? "Leaving..." : "Can't Make It"}
                  </button>
                  <button onClick={openShareModal}
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
                  <button onClick={() => user ? setShowJoinModal(true) : router.push("/login")} disabled={joining}
                    className="w-full py-3.5 bg-zinc-900 text-white rounded-full font-bold hover:bg-zinc-800 transition-all disabled:opacity-50">
                    Join Events
                  </button>
                  <button onClick={openShareModal}
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

            {/* Hosted by Card */}
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

            {/* Discussion Card */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-6">
              <h2 className="text-lg font-bold text-zinc-900 mb-4">Discussion</h2>

              {user ? (
                <form onSubmit={handleSubmitComment} className="mb-4">
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
                        onChange={(e) => setNewComment(e.target.value)}
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

            {/* Notes Card */}
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

            {/* Feedback Card */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-zinc-900">Feedback</h2>
                <span className="text-sm text-zinc-500">
                  <span className="text-orange-500 font-bold">★ 5.0</span> ({participants.length})
                </span>
              </div>

              {/* Participants for review */}
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
                          <button onClick={() => openReviewModal(p)}
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
        </div>
      </main>

      {/* Join Confirmation Modal */}
      {showJoinModal && event && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden">
            {/* Orange header */}
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
              {/* Event summary */}
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

              <button onClick={handleJoin} disabled={joining}
                className="w-full py-3 bg-orange-500 text-white rounded-full font-bold hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {joining ? "Joining..." : "Confirm & Join"}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </button>
              <button onClick={() => setShowJoinModal(false)}
                className="w-full py-2 text-zinc-500 hover:text-zinc-700 text-sm font-medium mt-2 transition-colors">
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Event Modal */}
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
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-3 bg-red-500 text-white rounded-full font-medium hover:bg-red-600 transition-colors disabled:opacity-50">
                {deleting ? "Cancelling..." : "Yes, Cancel Event"}
              </button>
              <button onClick={() => setShowCancelModal(false)} disabled={deleting}
                className="flex-1 py-3 border border-zinc-200 text-zinc-700 rounded-full font-medium hover:bg-zinc-50 transition-colors">
                Keep Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Participants Modal */}
      {showEmailModal && event && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-xl font-bold text-zinc-900">Email participants</h3>
                <p className="text-sm text-zinc-500">
                  Send a message to {emailRecipientCount} participant{emailRecipientCount === 1 ? "" : "s"}.
                </p>
              </div>
              <button
                onClick={closeEmailModal}
                className="text-zinc-400 hover:text-zinc-600"
                aria-label="Close email modal"
              >
                X
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Template</label>
                <select
                  value={emailTemplate}
                  onChange={(e) => handleTemplateChange(e.target.value)}
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
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Event update subject"
                  className="w-full px-4 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Message</label>
                <textarea
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  rows={5}
                  placeholder="Share details, reminders, or updates..."
                  className="w-full px-4 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            {emailError && (
              <p className="text-sm text-red-500 mt-3">{emailError}</p>
            )}
            {emailSuccess && (
              <p className="text-sm text-emerald-600 mt-3">{emailSuccess}</p>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSendEmail}
                disabled={sendingEmail}
                className="flex-1 py-3 bg-zinc-900 text-white rounded-full font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                {sendingEmail ? "Sending..." : "Send Email"}
              </button>
              <button
                onClick={closeEmailModal}
                disabled={sendingEmail}
                className="flex-1 py-3 border border-zinc-200 text-zinc-700 rounded-full font-medium hover:bg-zinc-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && reviewingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-zinc-900 mb-4">Rate {reviewingUser.name || "Participant"}</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-700 mb-2">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setReviewRating(star)}
                    className={`text-3xl transition-colors ${star <= reviewRating ? "text-orange-500" : "text-zinc-300"}`}>
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-700 mb-2">Comment (optional)</label>
              <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} rows={3}
                className="w-full px-4 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="How was your experience?" />
            </div>
            <div className="flex gap-3">
              <button onClick={handleSubmitReview} disabled={submittingReview}
                className="flex-1 py-3 bg-orange-500 text-white rounded-full font-medium hover:bg-orange-600 transition-colors disabled:opacity-50">
                {submittingReview ? "Submitting..." : "Submit Review"}
              </button>
              <button onClick={() => setShowReviewModal(false)} disabled={submittingReview}
                className="px-6 py-3 border border-zinc-200 text-zinc-700 rounded-full font-medium hover:bg-zinc-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      <EventShareModal
        isOpen={showShareModal}
        onClose={closeShareModal}
        onShare={shareImage}
        isGenerating={isGenerating}
        isSharing={isSharing}
        eventTitle={event.title}
        sportType={event.sport_type}
        datetime={event.datetime}
        location={event.location}
        hostName={host?.name || "Event Host"}
        isPastEvent={isPastEvent}
        eventUrl={typeof window !== "undefined" ? window.location.href : ""}
      />
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

      // Progress: assume 7 days = 100% (countdown from creation to event)
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
