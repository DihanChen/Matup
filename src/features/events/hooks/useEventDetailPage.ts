"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { getApiBaseUrl } from "@/lib/api";
import type { User } from "@supabase/supabase-js";
import {
  fetchEventDetailData,
  type EventComment as Comment,
  type EventDetailEvent as Event,
  type HostInfo,
  type ParticipantInfo,
} from "@/lib/queries/event-detail";
import { useEventShare } from "@/components/share/useEventShare";

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

export function getCoverSrcForSport(sportType: string): string {
  if (sportType === "pickleball") return "/covers/tennis.jpg";
  return `/covers/${sportType}.jpg`;
}

export function useEventDetailPage() {
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

      const detail = await fetchEventDetailData(supabase, eventId, user);
      if (detail.error || !detail.event) {
        setError(detail.error || "Event not found");
        setLoading(false);
        return;
      }

      setEvent(detail.event);
      setHost(detail.host);
      setParticipants(detail.participants);
      setExistingReviews(detail.existingReviews);
      setComments(detail.comments);

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

  return {
    eventId,
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
    setComments,
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
  };
}

export type UseEventDetailPageData = ReturnType<typeof useEventDetailPage>;
