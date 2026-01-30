"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";

type Profile = {
  id: string;
  name: string | null;
  avatar_url: string | null;
};

type Event = {
  id: string;
  title: string;
  sport_type: string;
  datetime: string;
  location: string;
};

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer: Profile | null;
  event: { id: string; title: string } | null;
};

export default function PublicProfilePage() {
  const params = useParams();
  const userId = params.id as string;

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [hostedEvents, setHostedEvents] = useState<Event[]>([]);
  const [joinedEvents, setJoinedEvents] = useState<Event[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // Get profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, name, avatar_url")
        .eq("id", userId)
        .single();

      if (profileError || !profileData) {
        setError("User not found");
        setLoading(false);
        return;
      }

      setProfile(profileData);

      // Get hosted events (past)
      const { data: hosted } = await supabase
        .from("events")
        .select("id, title, sport_type, datetime, location")
        .eq("creator_id", userId)
        .lt("datetime", new Date().toISOString())
        .order("datetime", { ascending: false })
        .limit(5);

      setHostedEvents(hosted || []);

      // Get joined events (past)
      const { data: participations } = await supabase
        .from("event_participants")
        .select("event_id")
        .eq("user_id", userId);

      if (participations && participations.length > 0) {
        const eventIds = participations.map((p) => p.event_id);
        const { data: joined } = await supabase
          .from("events")
          .select("id, title, sport_type, datetime, location")
          .in("id", eventIds)
          .lt("datetime", new Date().toISOString())
          .order("datetime", { ascending: false })
          .limit(5);

        setJoinedEvents(joined || []);
      }

      // Get reviews received
      const { data: reviewsData } = await supabase
        .from("reviews")
        .select("id, rating, comment, created_at, reviewer_id, event_id")
        .eq("reviewed_id", userId)
        .order("created_at", { ascending: false });

      if (reviewsData && reviewsData.length > 0) {
        // Get reviewer profiles
        const reviewerIds = reviewsData.map((r) => r.reviewer_id);
        const { data: reviewerProfiles } = await supabase
          .from("profiles")
          .select("id, name, avatar_url")
          .in("id", reviewerIds);

        // Get event titles
        const eventIds = reviewsData.map((r) => r.event_id).filter(Boolean);
        const { data: eventData } = await supabase
          .from("events")
          .select("id, title")
          .in("id", eventIds);

        const reviewsWithInfo = reviewsData.map((r) => ({
          ...r,
          reviewer: reviewerProfiles?.find((p) => p.id === r.reviewer_id) || null,
          event: eventData?.find((e) => e.id === r.event_id) || null,
        }));

        setReviews(reviewsWithInfo);

        // Calculate average rating
        const total = reviewsData.reduce((sum, r) => sum + r.rating, 0);
        setAverageRating(total / reviewsData.length);
      }

      setLoading(false);
    }

    fetchData();
  }, [userId]);

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (datetime: string) => {
    return new Date(datetime).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

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

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="text-6xl mb-4">😕</div>
            <p className="text-zinc-500 mb-4">{error || "User not found"}</p>
            <Link href="/events" className="text-emerald-600 hover:underline">
              Back to events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === userId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Profile Header */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-8 mb-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.name || "User"}
                width={120}
                height={120}
                className="w-28 h-28 rounded-full object-cover border-4 border-emerald-500"
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-3xl font-bold flex items-center justify-center">
                {getInitials(profile.name)}
              </div>
            )}

            <div className="text-center md:text-left flex-1">
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
                {profile.name || "Anonymous User"}
              </h1>

              {/* Stats */}
              <div className="flex flex-wrap justify-center md:justify-start gap-6 mt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-zinc-900 dark:text-white">
                    {hostedEvents.length}
                  </div>
                  <div className="text-sm text-zinc-500">Events Hosted</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-zinc-900 dark:text-white">
                    {joinedEvents.length}
                  </div>
                  <div className="text-sm text-zinc-500">Events Joined</div>
                </div>
                {averageRating && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center justify-center gap-1">
                      <span className="text-yellow-500">★</span>
                      {averageRating.toFixed(1)}
                    </div>
                    <div className="text-sm text-zinc-500">
                      {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {isOwnProfile && (
              <Link
                href="/profile"
                className="px-4 py-2 border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
              >
                Edit Profile
              </Link>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Past Events Hosted */}
          <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <span>🎯</span> Events Hosted
            </h2>
            {hostedEvents.length === 0 ? (
              <p className="text-zinc-500 text-center py-4">No events hosted yet</p>
            ) : (
              <div className="space-y-3">
                {hostedEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="block p-3 bg-zinc-50 dark:bg-zinc-700/50 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                  >
                    <div className="font-medium text-zinc-900 dark:text-white">
                      {event.title}
                    </div>
                    <div className="text-sm text-zinc-500 flex items-center gap-2 mt-1">
                      <span className="capitalize">{event.sport_type}</span>
                      <span>•</span>
                      <span>{formatDate(event.datetime)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Past Events Joined */}
          <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <span>🏃</span> Events Joined
            </h2>
            {joinedEvents.length === 0 ? (
              <p className="text-zinc-500 text-center py-4">No events joined yet</p>
            ) : (
              <div className="space-y-3">
                {joinedEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="block p-3 bg-zinc-50 dark:bg-zinc-700/50 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                  >
                    <div className="font-medium text-zinc-900 dark:text-white">
                      {event.title}
                    </div>
                    <div className="text-sm text-zinc-500 flex items-center gap-2 mt-1">
                      <span className="capitalize">{event.sport_type}</span>
                      <span>•</span>
                      <span>{formatDate(event.datetime)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-6 mt-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
            <span>⭐</span> Reviews ({reviews.length})
          </h2>
          {reviews.length === 0 ? (
            <p className="text-zinc-500 text-center py-4">No reviews yet</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="p-4 bg-zinc-50 dark:bg-zinc-700/50 rounded-xl"
                >
                  <div className="flex items-start gap-3">
                    {review.reviewer?.avatar_url ? (
                      <Image
                        src={review.reviewer.avatar_url}
                        alt={review.reviewer.name || "Reviewer"}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-medium">
                        {getInitials(review.reviewer?.name || null)}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-zinc-900 dark:text-white">
                          {review.reviewer?.name || "Anonymous"}
                        </div>
                        <div className="flex items-center gap-1 text-yellow-500">
                          {[...Array(5)].map((_, i) => (
                            <span key={i}>
                              {i < review.rating ? "★" : "☆"}
                            </span>
                          ))}
                        </div>
                      </div>
                      {review.event && (
                        <div className="text-xs text-zinc-500 mt-1">
                          From: {review.event.title}
                        </div>
                      )}
                      {review.comment && (
                        <p className="text-zinc-600 dark:text-zinc-400 mt-2">
                          {review.comment}
                        </p>
                      )}
                      <div className="text-xs text-zinc-400 mt-2">
                        {formatDate(review.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
