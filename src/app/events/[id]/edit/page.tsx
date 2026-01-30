"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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

type Event = {
  id: string;
  title: string;
  description: string | null;
  sport_type: string;
  location: string;
  datetime: string;
  max_participants: number;
  creator_id: string;
  latitude: number | null;
  longitude: number | null;
};

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sportType, setSportType] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  useEffect(() => {
    const supabase = createClient();

    async function fetchData() {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

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

      // Check if user is the creator
      if (eventData.creator_id !== user.id) {
        router.push(`/events/${eventId}`);
        return;
      }

      setEvent(eventData);

      // Populate form fields
      setTitle(eventData.title);
      setDescription(eventData.description || "");
      setSportType(eventData.sport_type);
      setLocation(eventData.location);
      setMaxParticipants(eventData.max_participants);

      // Parse datetime
      const dt = new Date(eventData.datetime);
      setDate(dt.toISOString().split("T")[0]);
      setTime(dt.toTimeString().slice(0, 5));

      // Load existing coordinates
      if (eventData.latitude && eventData.longitude) {
        setCoordinates({ lat: eventData.latitude, lng: eventData.longitude });
        setLocationStatus("success");
      }

      setLoading(false);
    }

    fetchData();
  }, [eventId, router]);

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
    setSaving(true);
    setError(null);
    setSuccess(false);

    const datetime = new Date(`${date}T${time}`).toISOString();

    const supabase = createClient();

    const { error } = await supabase
      .from("events")
      .update({
        title,
        description: description || null,
        sport_type: sportType,
        location,
        datetime,
        max_participants: maxParticipants,
        latitude: coordinates?.lat || null,
        longitude: coordinates?.lng || null,
      })
      .eq("id", eventId)
      .eq("creator_id", user?.id);

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    setSuccess(true);
    setSaving(false);

    // Redirect after short delay
    setTimeout(() => {
      router.push(`/events/${eventId}`);
    }, 1500);
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

  if (error && !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="text-6xl mb-4">😕</div>
            <p className="text-zinc-500 mb-4">{error}</p>
            <Link href="/events" className="text-emerald-600 hover:underline">
              Back to events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800">
      <Navbar />

      <main className="max-w-2xl mx-auto px-6 py-8">
        <Link
          href={`/events/${eventId}`}
          className="inline-flex items-center text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 mb-6 font-medium"
        >
          ← Back to event
        </Link>

        <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6">
            <h1 className="text-2xl font-bold text-white">Edit Event</h1>
            <p className="text-white/80">Update your event details</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                ❌ {error}
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm">
                ✅ Event updated! Redirecting...
              </div>
            )}

            <div className="space-y-6">
              {/* Title */}
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
                >
                  Event Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-600 rounded-xl bg-zinc-50 dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* Sport Type */}
              <div>
                <label
                  htmlFor="sport_type"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
                >
                  Sport / Activity
                </label>
                <select
                  id="sport_type"
                  value={sportType}
                  onChange={(e) => setSportType(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-600 rounded-xl bg-zinc-50 dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
                >
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-600 rounded-xl bg-zinc-50 dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                        <span>Update location coordinates</span>
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
                    className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
                  >
                    Date
                  </label>
                  <input
                    type="date"
                    id="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-600 rounded-xl bg-zinc-50 dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label
                    htmlFor="time"
                    className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
                  >
                    Time
                  </label>
                  <input
                    type="time"
                    id="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-600 rounded-xl bg-zinc-50 dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Max Participants */}
              <div>
                <label
                  htmlFor="max_participants"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
                >
                  Max Participants
                </label>
                <input
                  type="number"
                  id="max_participants"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
                  min="2"
                  max="100"
                  required
                  className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-600 rounded-xl bg-zinc-50 dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
                >
                  Description (optional)
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-600 rounded-xl bg-zinc-50 dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Tell people what to expect..."
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={saving || success}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Saving..." : success ? "Saved!" : "💾 Save Changes"}
                </button>
                <Link
                  href={`/events/${eventId}`}
                  className="px-6 py-3 border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 rounded-xl font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors text-center"
                >
                  Cancel
                </Link>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
