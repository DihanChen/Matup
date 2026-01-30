"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";

type Event = {
  id: string;
  title: string;
  sport_type: string;
  location: string;
  datetime: string;
  max_participants: number;
  creator_id: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [createdEvents, setCreatedEvents] = useState<Event[]>([]);
  const [joinedEvents, setJoinedEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [showPastEvents, setShowPastEvents] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);

      // Fetch events created by user
      const { data: created } = await supabase
        .from("events")
        .select("*")
        .eq("creator_id", user.id)
        .gte("datetime", new Date().toISOString())
        .order("datetime", { ascending: true });

      setCreatedEvents(created || []);

      // Fetch events user has joined
      const { data: participations } = await supabase
        .from("event_participants")
        .select("event_id")
        .eq("user_id", user.id);

      if (participations && participations.length > 0) {
        const eventIds = participations.map((p) => p.event_id);

        const { data: joined } = await supabase
          .from("events")
          .select("*")
          .in("id", eventIds)
          .neq("creator_id", user.id) // Exclude events they created
          .gte("datetime", new Date().toISOString())
          .order("datetime", { ascending: true });

        setJoinedEvents(joined || []);
      }

      // Fetch past events (both created and joined)
      const { data: pastCreated } = await supabase
        .from("events")
        .select("*")
        .eq("creator_id", user.id)
        .lt("datetime", new Date().toISOString())
        .order("datetime", { ascending: false })
        .limit(10);

      const { data: pastParticipations } = await supabase
        .from("event_participants")
        .select("event_id")
        .eq("user_id", user.id);

      let allPastEvents = pastCreated || [];

      if (pastParticipations && pastParticipations.length > 0) {
        const pastEventIds = pastParticipations.map((p) => p.event_id);
        const { data: pastJoined } = await supabase
          .from("events")
          .select("*")
          .in("id", pastEventIds)
          .neq("creator_id", user.id)
          .lt("datetime", new Date().toISOString())
          .order("datetime", { ascending: false })
          .limit(10);

        if (pastJoined) {
          allPastEvents = [...allPastEvents, ...pastJoined];
        }
      }

      // Sort by date and remove duplicates
      allPastEvents.sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
      setPastEvents(allPastEvents.slice(0, 10));

      setLoading(false);
    }

    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-zinc-500">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-8">
          Welcome, {user?.user_metadata?.name || "there"}!
        </h1>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Link
            href="/events/create"
            className="p-6 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-emerald-500 transition-colors"
          >
            <div className="text-3xl mb-3">📅</div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
              Create Event
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              Organize a fitness event and find partners
            </p>
          </Link>

          <Link
            href="/events"
            className="p-6 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-emerald-500 transition-colors"
          >
            <div className="text-3xl mb-3">🔍</div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
              Find Events
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              Browse and join fitness events near you
            </p>
          </Link>

          <Link
            href="/profile"
            className="p-6 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-emerald-500 transition-colors"
          >
            <div className="text-3xl mb-3">👤</div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
              My Profile
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              Update your profile and preferences
            </p>
          </Link>
        </div>

        {/* Events I'm Hosting */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
              Events I&apos;m Hosting
            </h2>
            <span className="text-sm text-zinc-500">
              {createdEvents.length} upcoming
            </span>
          </div>

          {createdEvents.length === 0 ? (
            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-8 text-center">
              <p className="text-zinc-500 dark:text-zinc-400 mb-4">
                You haven&apos;t created any events yet.
              </p>
              <Link
                href="/events/create"
                className="inline-block px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Create Your First Event
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {createdEvents.map((event) => (
                <EventCard key={event.id} event={event} isCreator />
              ))}
            </div>
          )}
        </section>

        {/* Events I've Joined */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
              Events I&apos;ve Joined
            </h2>
            <span className="text-sm text-zinc-500">
              {joinedEvents.length} upcoming
            </span>
          </div>

          {joinedEvents.length === 0 ? (
            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-8 text-center">
              <p className="text-zinc-500 dark:text-zinc-400 mb-4">
                You haven&apos;t joined any events yet.
              </p>
              <Link
                href="/events"
                className="inline-block px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Browse Events
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {joinedEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>

        {/* Past Events */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
              Past Events
            </h2>
            <button
              onClick={() => setShowPastEvents(!showPastEvents)}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              {showPastEvents ? "Hide" : `Show (${pastEvents.length})`}
            </button>
          </div>

          {showPastEvents && (
            pastEvents.length === 0 ? (
              <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-8 text-center">
                <p className="text-zinc-500 dark:text-zinc-400">
                  No past events yet. Your event history will appear here.
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pastEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    isCreator={event.creator_id === user?.id}
                    isPast
                  />
                ))}
              </div>
            )
          )}
        </section>
      </main>
    </div>
  );
}

function EventCard({ event, isCreator, isPast }: { event: Event; isCreator?: boolean; isPast?: boolean }) {
  const date = new Date(event.datetime);
  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <Link
      href={`/events/${event.id}`}
      className={`block bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-emerald-500 transition-colors p-4 ${isPast ? "opacity-75" : ""}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs rounded capitalize">
            {event.sport_type}
          </span>
          {isPast && (
            <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 text-xs rounded">
              Completed
            </span>
          )}
        </div>
        {isCreator && (
          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded">
            Hosted
          </span>
        )}
      </div>

      <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">
        {event.title}
      </h3>

      <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
        <p>📍 {event.location}</p>
        <p>📅 {formattedDate} at {formattedTime}</p>
      </div>
    </Link>
  );
}
