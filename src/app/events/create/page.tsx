"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";

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
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

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

  function handleGetLocation() {
    if (!navigator.geolocation) {
      setLocationStatus("error");
      return;
    }

    setLocationStatus("loading");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationStatus("success");
      },
      () => {
        setLocationStatus("error");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const sportType = formData.get("sport_type") as string;
    const location = formData.get("location") as string;
    const date = formData.get("date") as string;
    const time = formData.get("time") as string;
    const maxParticipants = parseInt(formData.get("max_participants") as string);

    const datetime = new Date(`${date}T${time}`).toISOString();

    const supabase = createClient();

    const { error } = await supabase.from("events").insert({
      title,
      description,
      sport_type: sportType,
      location,
      datetime,
      max_participants: maxParticipants,
      creator_id: user?.id,
      latitude: coordinates?.lat || null,
      longitude: coordinates?.lng || null,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/events");
  }

  if (!user) {
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

      <main className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-8">
          Create Event
        </h1>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-zinc-800 p-8 rounded-xl border border-zinc-200 dark:border-zinc-700"
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
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
              >
                Event Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Morning Run Club"
              />
            </div>

            {/* Sport Type */}
            <div>
              <label
                htmlFor="sport_type"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
              >
                Sport / Activity
              </label>
              <select
                id="sport_type"
                name="sport_type"
                required
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
              >
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                required
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Central Park Tennis Courts, NYC"
              />

              {/* Geolocation Button */}
              <div className="mt-2">
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={locationStatus === "loading"}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-all ${
                    locationStatus === "success"
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                      : locationStatus === "error"
                      ? "bg-red-100 text-red-700 border border-red-300"
                      : "bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600 border border-zinc-300 dark:border-zinc-600"
                  }`}
                >
                  {locationStatus === "loading" ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Getting location...</span>
                    </>
                  ) : locationStatus === "success" ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                      <span>Location added</span>
                    </>
                  ) : locationStatus === "error" ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                      </svg>
                      <span>Location access denied</span>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                      </svg>
                      <span>Use my current location</span>
                    </>
                  )}
                </button>
                <p className="text-xs text-zinc-500 mt-1">
                  {locationStatus === "success"
                    ? "Users will be able to see how far this event is from them"
                    : "Optional: helps users find events near them"}
                </p>
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="date"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                >
                  Date
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  required
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label
                  htmlFor="time"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                >
                  Time
                </label>
                <input
                  type="time"
                  id="time"
                  name="time"
                  required
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Max Participants */}
            <div>
              <label
                htmlFor="max_participants"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
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
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
              >
                Description (optional)
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                className="px-6 py-3 border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 rounded-lg hover:border-zinc-400 transition-colors text-center"
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
