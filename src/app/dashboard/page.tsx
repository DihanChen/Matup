"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import EventCard from "@/components/EventCard";

type Event = {
  id: string;
  title: string;
  sport_type: string;
  location: string;
  datetime: string;
  max_participants: number;
  skill_level?: string;
  creator_id: string;
  cover_url?: string | null;
  participant_count?: number;
};

type Tab = "hosting" | "joining" | "past";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("hosting");
  const [createdEvents, setCreatedEvents] = useState<Event[]>([]);
  const [joinedEvents, setJoinedEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);

  useEffect(() => {
    const supabase = createClient();

    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);

      // Fetch events I'm hosting (upcoming)
      const { data: created } = await supabase
        .from("events")
        .select("*")
        .eq("creator_id", user.id)
        .gte("datetime", new Date().toISOString())
        .order("datetime", { ascending: true });

      setCreatedEvents(created || []);

      // Fetch events I've joined (upcoming, not my own)
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

      // Fetch past events (both hosted and joined)
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

  const tabs: { id: Tab; label: string }[] = [
    { id: "hosting", label: "Hosting" },
    { id: "joining", label: "Joining" },
    { id: "past", label: "Past" },
  ];

  const getActiveEvents = () => {
    switch (activeTab) {
      case "hosting": return createdEvents;
      case "joining": return joinedEvents;
      case "past": return pastEvents;
    }
  };

  const getEmptyMessage = () => {
    switch (activeTab) {
      case "hosting": return "You haven't created any events yet.";
      case "joining": return "You haven't joined any events yet.";
      case "past": return "No past events yet. Your event history will appear here.";
    }
  };

  const getEmptyAction = () => {
    switch (activeTab) {
      case "hosting":
        return { label: "Create Your First Event", href: "/events/create" };
      case "joining":
        return { label: "Browse Events", href: "/events" };
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <main className="max-w-[980px] mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6 animate-pulse">
          <div className="space-y-3">
            <div className="h-9 w-64 bg-zinc-200 rounded-xl" />
            <div className="h-4 w-80 bg-zinc-100 rounded" />
          </div>

          <div className="flex items-center gap-6 border-b border-zinc-200 pb-3">
            {[1, 2, 3].map((tab) => (
              <div
                key={`dashboard-tab-skeleton-${tab}`}
                className="h-4 w-16 rounded bg-zinc-100"
              />
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((card) => (
              <div
                key={`dashboard-card-skeleton-${card}`}
                className="rounded-2xl border border-zinc-200 p-4 space-y-3"
              >
                <div className="h-36 rounded-xl bg-zinc-100" />
                <div className="h-5 w-3/4 rounded bg-zinc-200" />
                <div className="h-4 w-2/3 rounded bg-zinc-100" />
                <div className="h-4 w-1/2 rounded bg-zinc-100" />
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  const events = getActiveEvents();
  const emptyAction = getEmptyAction();

  return (
    <div className="min-h-screen bg-white">

      <main className="max-w-[980px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-2">
            My <span className="text-orange-500">Activities</span>
          </h1>
          <p className="text-zinc-500">Manage your upcoming and past events</p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-zinc-200 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? "text-zinc-900"
                  : "text-zinc-400 hover:text-zinc-600"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Event Grid */}
        {events.length === 0 ? (
          <div className="bg-white rounded-2xl border border-zinc-200 p-8 sm:p-12 text-center">
            <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
            </div>
            <p className="text-zinc-500 mb-4">{getEmptyMessage()}</p>
            {emptyAction && (
              <Link
                href={emptyAction.href}
                className="inline-block px-6 py-2.5 bg-zinc-900 text-white rounded-full text-sm font-medium hover:bg-zinc-800 transition-colors"
              >
                {emptyAction.label}
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                variant={activeTab === "past" ? "past" : activeTab === "hosting" ? "hosting" : "default"}
                showHostBadge={activeTab === "past" && event.creator_id === user?.id}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
