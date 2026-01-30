"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";

type Event = {
  id: string;
  title: string;
  description: string | null;
  sport_type: string;
  location: string;
  datetime: string;
  max_participants: number;
  creator_id: string;
  created_at: string;
};

type ParticipantInfo = {
  id: string;
  user_id: string;
  name: string | null;
  avatar_url: string | null;
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

      setLoading(false);
    }

    fetchData();
  }, [eventId]);

  async function handleJoin() {
    if (!user) {
      router.push("/login");
      return;
    }

    setJoining(true);
    const supabase = createClient();

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
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-zinc-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800">
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Back link */}
        <Link
          href="/events"
          className="inline-flex items-center text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 mb-6 font-medium"
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
                    <span>📍</span>
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📅</span>
                    <span>
                      {formattedDate} at {formattedTime}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {event.description && (
              <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-6">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
                  <span>📝</span> About this event
                </h2>
                <p className="text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            )}

            {/* Participants */}
            <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
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
                <p className="text-zinc-500 dark:text-zinc-400 text-center py-4">
                  No one has joined yet. Be the first!
                </p>
              ) : (
                <div className="space-y-3">
                  {participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-700/50 rounded-xl"
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
                        <p className="font-medium text-zinc-900 dark:text-white">
                          {participant.name || "Anonymous"}
                          {participant.user_id === user?.id && (
                            <span className="ml-2 text-xs text-emerald-600">
                              (You)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Progress bar */}
              <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
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
                <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
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
            <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-6">
              <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4">
                Hosted by
              </h2>
              <div className="flex items-center gap-3">
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
                  <p className="font-semibold text-zinc-900 dark:text-white">
                    {host?.name || "Event Host"}
                    {isCreator && (
                      <span className="ml-2 text-xs text-emerald-600">
                        (You)
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-zinc-500">Event Organizer</p>
                </div>
              </div>
            </div>

            {/* Action Card */}
            <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-6">
              {isCreator ? (
                <div className="space-y-3">
                  <Link
                    href={`/events/${event.id}/edit`}
                    className="block w-full py-3 bg-emerald-600 text-white text-center rounded-xl font-medium hover:bg-emerald-700 transition-colors"
                  >
                    ✏️ Edit Event
                  </Link>

                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full py-3 border border-red-300 dark:border-red-800 text-red-600 rounded-xl font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      🗑️ Delete Event
                    </button>
                  ) : (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                      <p className="text-red-700 dark:text-red-300 text-sm mb-3">
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
                          className="flex-1 py-2 border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-medium disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : isJoined ? (
                <div className="space-y-3">
                  <div className="text-center py-2 px-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      ✓ You&apos;re going!
                    </span>
                  </div>
                  <button
                    onClick={handleLeave}
                    disabled={joining}
                    className="w-full py-3 border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 rounded-xl font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
                  >
                    {joining ? "Leaving..." : "Leave Event"}
                  </button>
                </div>
              ) : isFull ? (
                <div className="text-center py-4">
                  <div className="text-4xl mb-2">😔</div>
                  <p className="text-zinc-500 dark:text-zinc-400 font-medium">
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

            {/* Event Info */}
            <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-6">
              <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4">
                Event Details
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Sport</span>
                  <span className="font-medium text-zinc-900 dark:text-white capitalize">
                    {event.sport_type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Max participants</span>
                  <span className="font-medium text-zinc-900 dark:text-white">
                    {event.max_participants}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Created</span>
                  <span className="font-medium text-zinc-900 dark:text-white">
                    {new Date(event.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
