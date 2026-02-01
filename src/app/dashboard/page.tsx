"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import { formatShortAddress } from "@/lib/formatAddress";

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

      const { data: created } = await supabase
        .from("events")
        .select("*")
        .eq("creator_id", user.id)
        .gte("datetime", new Date().toISOString())
        .order("datetime", { ascending: true });

      setCreatedEvents(created || []);

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
          .neq("creator_id", user.id)
          .gte("datetime", new Date().toISOString())
          .order("datetime", { ascending: true });

        setJoinedEvents(joined || []);
      }

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

      allPastEvents.sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
      setPastEvents(allPastEvents.slice(0, 10));

      setLoading(false);
    }

    fetchData();
  }, [router]);

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

  return (
    <div className="min-h-screen bg-[#fbfbfd]">
      <Navbar />

      <main className="max-w-[980px] mx-auto px-6 py-8">
        <h1 className="text-3xl font-semibold text-zinc-900 mb-8 tracking-tight">
          Welcome, {user?.user_metadata?.name || "there"}
        </h1>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          <Link
            href="/events/create"
            className="group p-6 bg-white rounded-2xl border border-zinc-200 hover:border-zinc-300 hover:shadow-sm transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-zinc-900 mb-1">
              Create Event
            </h2>
            <p className="text-sm text-zinc-500">
              Organize a fitness event
            </p>
          </Link>

          <Link
            href="/events"
            className="group p-6 bg-white rounded-2xl border border-zinc-200 hover:border-zinc-300 hover:shadow-sm transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-zinc-900 mb-1">
              Find Events
            </h2>
            <p className="text-sm text-zinc-500">
              Browse events near you
            </p>
          </Link>

          <Link
            href="/profile"
            className="group p-6 bg-white rounded-2xl border border-zinc-200 hover:border-zinc-300 hover:shadow-sm transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-zinc-900 mb-1">
              My Profile
            </h2>
            <p className="text-sm text-zinc-500">
              Update your preferences
            </p>
          </Link>
        </div>

        {/* Events I'm Hosting */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-zinc-900">
              Events I&apos;m Hosting
            </h2>
            <span className="text-sm text-zinc-500">
              {createdEvents.length} upcoming
            </span>
          </div>

          {createdEvents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-zinc-200 p-8 text-center">
              <p className="text-zinc-500 mb-4">
                You haven&apos;t created any events yet.
              </p>
              <Link
                href="/events/create"
                className="inline-block px-5 py-2.5 bg-zinc-900 text-white rounded-full text-sm font-medium hover:bg-zinc-800 transition-colors"
              >
                Create Your First Event
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {createdEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>

        {/* Events I've Joined */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-zinc-900">
              Events I&apos;ve Joined
            </h2>
            <span className="text-sm text-zinc-500">
              {joinedEvents.length} upcoming
            </span>
          </div>

          {joinedEvents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-zinc-200 p-8 text-center">
              <p className="text-zinc-500 mb-4">
                You haven&apos;t joined any events yet.
              </p>
              <Link
                href="/events"
                className="inline-block px-5 py-2.5 bg-zinc-900 text-white rounded-full text-sm font-medium hover:bg-zinc-800 transition-colors"
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
            <h2 className="text-xl font-semibold text-zinc-900">
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
              <div className="bg-white rounded-2xl border border-zinc-200 p-8 text-center">
                <p className="text-zinc-500">
                  No past events yet. Your event history will appear here.
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pastEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    showHostBadge={event.creator_id === user?.id}
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

function EventCard({ event, showHostBadge, isPast }: { event: Event; showHostBadge?: boolean; isPast?: boolean }) {
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
      className={`block bg-white rounded-2xl border border-zinc-200 hover:border-zinc-300 hover:shadow-sm transition-all p-5 ${isPast ? "opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full capitalize">
            {event.sport_type}
          </span>
          {isPast && (
            <span className="px-2.5 py-1 bg-zinc-100 text-zinc-500 text-xs font-medium rounded-full">
              Completed
            </span>
          )}
        </div>
        {showHostBadge && (
          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
            Host
          </span>
        )}
      </div>

      <h3 className="font-semibold text-zinc-900 mb-3">
        {event.title}
      </h3>

      <div className="text-sm text-zinc-500 space-y-1.5">
        <p className="flex items-center gap-2" title={event.location}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">{formatShortAddress(event.location)}</span>
        </p>
        <p className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {formattedDate} at {formattedTime}
        </p>
      </div>
    </Link>
  );
}
