"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import EventCard from "@/components/EventCard";

type Profile = {
  id: string;
  name: string | null;
  avatar_url: string | null;
  is_premium?: boolean;
  bio?: string | null;
};

type Event = {
  id: string;
  title: string;
  sport_type: string;
  datetime: string;
  location: string;
  max_participants: number;
  skill_level?: string;
  creator_id?: string;
  cover_url?: string | null;
  participant_count?: number;
};

type Badge = {
  icon: string;
  label: string;
  description: string;
  color: string;
};

export default function PublicProfilePage() {
  const params = useParams();
  const userId = params.id as string;

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activityTab, setActivityTab] = useState<"upcoming" | "past">("upcoming");

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, name, avatar_url, is_premium")
        .eq("id", userId)
        .single();

      if (profileError || !profileData) {
        setError("User not found");
        setLoading(false);
        return;
      }

      setProfile(profileData);

      // Upcoming events (hosted or participating)
      const { data: hostedUpcoming } = await supabase
        .from("events")
        .select("*")
        .eq("creator_id", userId)
        .gte("datetime", new Date().toISOString())
        .order("datetime", { ascending: true })
        .limit(4);

      setUpcomingEvents(hostedUpcoming || []);

      // Past events
      const { data: hostedPast } = await supabase
        .from("events")
        .select("*")
        .eq("creator_id", userId)
        .lt("datetime", new Date().toISOString())
        .order("datetime", { ascending: false })
        .limit(4);

      setPastEvents(hostedPast || []);

      setLoading(false);
    }

    fetchData();
  }, [userId]);

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const splitName = (name: string | null) => {
    if (!name) return { first: "Anonymous", last: "User" };
    const parts = name.trim().split(" ");
    if (parts.length === 1) return { first: parts[0], last: "" };
    return { first: parts.slice(0, -1).join(" "), last: parts[parts.length - 1] };
  };

  // Generate badges based on activity
  const getBadges = (): Badge[] => {
    const badges: Badge[] = [];
    if (pastEvents.length >= 3) {
      badges.push({ icon: "team", label: "Team Player", description: `Hosted ${pastEvents.length}+ events`, color: "bg-blue-500" });
    }
    return badges;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center py-20">
          <div className="text-zinc-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-zinc-500 mb-4">{error || "User not found"}</p>
            <Link href="/events" className="text-orange-500 hover:underline">
              Back to events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === userId;
  const { first, last } = splitName(profile.name);
  const badges = getBadges();
  const activityEvents = activityTab === "upcoming" ? upcomingEvents : pastEvents;

  return (
    <div className="min-h-screen bg-white">

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Profile Header */}
        <div className="grid md:grid-cols-[1fr_auto] gap-8 mb-10">
          {/* Left: Name & Info */}
          <div>
            {/* Badges */}
            <div className="flex items-center gap-2 mb-3">
              {profile.is_premium && (
                <span className="px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">
                  Pro Athlete
                </span>
              )}
              <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Verified
              </span>
            </div>

            {/* Name */}
            <h1 className="text-4xl sm:text-5xl font-bold mb-3">
              <span className="text-zinc-900">{first} </span>
              <span className="text-orange-500">{last}</span>
            </h1>

            {/* Bio / subtitle */}
            <p className="text-zinc-500 text-sm mb-5">
              {(profile as Profile & { bio?: string }).bio || "Sports enthusiast"}
            </p>

            {/* Invite button */}
            {!isOwnProfile && (
              <Link
                href={`/events/create`}
                className="inline-flex items-center px-5 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-full hover:bg-zinc-800 transition-colors"
              >
                Invite to Game
              </Link>
            )}
            {isOwnProfile && (
              <Link
                href="/profile"
                className="inline-flex items-center px-5 py-2.5 border border-zinc-300 text-zinc-700 text-sm font-medium rounded-full hover:bg-zinc-50 transition-colors"
              >
                Edit Profile
              </Link>
            )}
          </div>

          {/* Right: Avatar */}
          <div className="flex flex-col items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.name || "User"}
                  width={160}
                  height={160}
                  className="w-36 h-36 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-zinc-100"
                />
              ) : (
                <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-zinc-200 text-zinc-400 text-4xl font-bold flex items-center justify-center border-4 border-zinc-100">
                  {getInitials(profile.name)}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Content Grid */}
        <div className="grid md:grid-cols-[1fr_340px] gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Photo Gallery Placeholder */}
            <section>
              <h2 className="text-lg font-bold text-zinc-900 mb-4">Photo Gallery</h2>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="aspect-square bg-zinc-100 rounded-xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                    </svg>
                  </div>
                ))}
              </div>
            </section>

            {/* Activity Feed */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-zinc-900">Activity Feed</h2>
                <div className="flex items-center bg-zinc-100 rounded-full p-0.5">
                  <button
                    onClick={() => setActivityTab("upcoming")}
                    className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${
                      activityTab === "upcoming" ? "bg-zinc-900 text-white" : "text-zinc-500"
                    }`}
                  >
                    Upcoming
                  </button>
                  <button
                    onClick={() => setActivityTab("past")}
                    className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${
                      activityTab === "past" ? "bg-zinc-900 text-white" : "text-zinc-500"
                    }`}
                  >
                    Past
                  </button>
                </div>
              </div>

              {activityEvents.length === 0 ? (
                <div className="bg-zinc-50 rounded-2xl p-8 text-center">
                  <p className="text-zinc-400 text-sm">No {activityTab} events</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activityEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      variant={activityTab === "past" ? "past" : "default"}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Badges */}
            <section className="bg-white rounded-2xl border border-zinc-200 p-5">
              <h3 className="text-base font-bold text-zinc-900 mb-4">Badges</h3>
              {badges.length === 0 ? (
                <p className="text-zinc-400 text-sm text-center py-4">No badges yet</p>
              ) : (
                <div className="space-y-3">
                  {badges.map((badge) => (
                    <div key={badge.label} className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${badge.color} rounded-full flex items-center justify-center`}>
                        {badge.icon === "team" && (
                          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                          </svg>
                        )}
                        {badge.icon === "star" && (
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        )}
                        {badge.icon === "bolt" && (
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-zinc-900 text-sm">{badge.label}</div>
                        <div className="text-xs text-zinc-500">{badge.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}
