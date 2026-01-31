"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import LocationAutocomplete from "@/components/LocationAutocomplete";
import { notifyNearbyUsers } from "@/lib/push-notifications";

const SPORT_TYPES = [
  "Running",
  "Tennis",
  "Cycling",
  "Gym",
  "Yoga",
  "Basketball",
  "Soccer",
  "Swimming",
  "Hiking",
  "Other",
];

export default function CreateEventPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);
    }

    getUser();
  }, [router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate that location is provided
    if (!location.trim()) {
      setError("Please enter a location");
      setLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const sportType = formData.get("sport_type") as string;
    const date = formData.get("date") as string;
    const time = formData.get("time") as string;
    const skillLevel = formData.get("skill_level") as string;
    const duration = parseInt(formData.get("duration") as string);
    const maxParticipants = parseInt(formData.get("max_participants") as string);
    const reminderMinutesStr = formData.get("reminder_minutes") as string;
    const reminderMinutes = reminderMinutesStr ? parseInt(reminderMinutesStr) : null;

    const datetime = new Date(`${date}T${time}`).toISOString();

    const supabase = createClient();

    const { data: eventData, error } = await supabase.from("events").insert({
      title,
      description,
      sport_type: sportType,
      location,
      datetime,
      duration,
      skill_level: skillLevel,
      max_participants: maxParticipants,
      creator_id: user?.id,
      latitude: coordinates?.lat || null,
      longitude: coordinates?.lng || null,
      reminder_minutes: reminderMinutes,
    }).select("id").single();

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Notify nearby users if we have coordinates
    if (coordinates && eventData?.id) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          await notifyNearbyUsers(
            session.access_token,
            eventData.id,
            title,
            location,
            coordinates.lat,
            coordinates.lng
          );
        }
      } catch (notifyError) {
        // Don't block event creation if notifications fail
        console.error("Failed to send notifications:", notifyError);
      }
    }

    router.push("/events");
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-zinc-500">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />

      <main className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-zinc-900 mb-8">
          Create Event
        </h1>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-xl border border-zinc-200"
        >
          {error && (
            <div className="mb-6 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-zinc-700 mb-1"
              >
                Event Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg bg-white text-zinc-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Morning Run Club"
              />
            </div>

            {/* Sport Type */}
            <div>
              <label
                htmlFor="sport_type"
                className="block text-sm font-medium text-zinc-700 mb-1"
              >
                Sport / Activity
              </label>
              <select
                id="sport_type"
                name="sport_type"
                required
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg bg-white text-zinc-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">Select activity</option>
                {SPORT_TYPES.map((sport) => (
                  <option key={sport} value={sport.toLowerCase()}>
                    {sport}
                  </option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div>
              <label
                htmlFor="location"
                className="block text-sm font-medium text-zinc-700 mb-1"
              >
                Event Location
              </label>
              <LocationAutocomplete
                value={location}
                onChange={setLocation}
                onLocationSelect={(loc) => {
                  setLocation(loc.address);
                  setCoordinates({ lat: loc.lat, lng: loc.lng });
                }}
                placeholder="Search for the event location (e.g., Central Park, NYC)"
                required
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="date"
                  className="block text-sm font-medium text-zinc-700 mb-1"
                >
                  Date
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  required
                  className="w-full px-4 py-2 border border-zinc-300 rounded-lg bg-white text-zinc-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label
                  htmlFor="time"
                  className="block text-sm font-medium text-zinc-700 mb-1"
                >
                  Time
                </label>
                <input
                  type="time"
                  id="time"
                  name="time"
                  required
                  className="w-full px-4 py-2 border border-zinc-300 rounded-lg bg-white text-zinc-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Duration */}
            <div>
              <label
                htmlFor="duration"
                className="block text-sm font-medium text-zinc-700 mb-1"
              >
                Duration
              </label>
              <select
                id="duration"
                name="duration"
                required
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg bg-white text-zinc-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="30">30 min</option>
                <option value="45">45 min</option>
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
                <option value="120">2 hours</option>
                <option value="180">3 hours</option>
                <option value="240">4 hours</option>
              </select>
            </div>

            {/* Skill Level */}
            <div>
              <label
                htmlFor="skill_level"
                className="block text-sm font-medium text-zinc-700 mb-1"
              >
                Skill Level
              </label>
              <select
                id="skill_level"
                name="skill_level"
                required
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg bg-white text-zinc-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="all">All Levels Welcome</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            {/* Max Participants */}
            <div>
              <label
                htmlFor="max_participants"
                className="block text-sm font-medium text-zinc-700 mb-1"
              >
                Max Participants
              </label>
              <input
                type="number"
                id="max_participants"
                name="max_participants"
                min="2"
                max="100"
                defaultValue="10"
                required
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg bg-white text-zinc-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            {/* Reminder */}
            <div>
              <label
                htmlFor="reminder_minutes"
                className="block text-sm font-medium text-zinc-700 mb-1"
              >
                Send Reminder
              </label>
              <select
                id="reminder_minutes"
                name="reminder_minutes"
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg bg-white text-zinc-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">No reminder</option>
                <option value="15">15 minutes before</option>
                <option value="30">30 minutes before</option>
                <option value="60">1 hour before</option>
                <option value="120">2 hours before</option>
                <option value="1440">1 day before</option>
              </select>
              <p className="mt-1 text-xs text-zinc-500">
                Attendees will receive a push notification before the event
              </p>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-zinc-700 mb-1"
              >
                Description (optional)
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg bg-white text-zinc-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Tell people what to expect..."
              />
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "Create Event"}
              </button>
              <Link
                href="/events"
                className="px-6 py-3 border border-zinc-300 text-zinc-700 rounded-lg hover:border-zinc-400 transition-colors text-center"
              >
                Cancel
              </Link>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
