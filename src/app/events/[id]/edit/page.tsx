"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import LocationAutocomplete from "@/components/LocationAutocomplete";

const SPORT_TYPES = [
  "Running",
  "Tennis",
  "Pickleball",
  "Cycling",
  "Gym",
  "Yoga",
  "Basketball",
  "Soccer",
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
  duration: number;
  max_participants: number;
  creator_id: string;
  latitude: number | null;
  longitude: number | null;
  skill_level: string;
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
  const [duration, setDuration] = useState(60);
  const [skillLevel, setSkillLevel] = useState("all");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState("");
  const [addressLine, setAddressLine] = useState("");

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

      // Check if event is in the past
      if (new Date(eventData.datetime) < new Date()) {
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
      setDuration(eventData.duration || 60);
      setSkillLevel(eventData.skill_level || "all");

      // Parse datetime
      const dt = new Date(eventData.datetime);
      setDate(dt.toISOString().split("T")[0]);
      setTime(dt.toTimeString().slice(0, 5));

      // Load existing coordinates
      if (eventData.latitude && eventData.longitude) {
        setCoordinates({ lat: eventData.latitude, lng: eventData.longitude });
      }

      setLoading(false);
    }

    fetchData();
  }, [eventId, router]);

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
        duration,
        skill_level: skillLevel,
        max_participants: maxParticipants,
        latitude: coordinates?.lat || null,
        longitude: coordinates?.lng || null,
        location_name: locationName || location.split(",")[0]?.trim() || null,
        address_line: addressLine || null,
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
      <div className="min-h-screen bg-white">
        <main className="max-w-2xl mx-auto px-6 py-8 animate-pulse">
          <div className="h-4 w-28 bg-zinc-100 rounded mb-6" />
          <div className="space-y-3 mb-8">
            <div className="h-10 w-52 bg-zinc-200 rounded-xl" />
            <div className="h-4 w-64 bg-zinc-100 rounded" />
          </div>
          <div className="rounded-2xl border border-zinc-200 p-6 space-y-5">
            <div className="h-4 w-24 bg-zinc-200 rounded" />
            <div className="h-12 w-full bg-zinc-100 rounded-xl" />
            <div className="h-4 w-28 bg-zinc-200 rounded" />
            <div className="h-12 w-full bg-zinc-100 rounded-xl" />
            <div className="h-4 w-20 bg-zinc-200 rounded" />
            <div className="h-24 w-full bg-zinc-100 rounded-xl" />
            <div className="h-12 w-full bg-zinc-200 rounded-full mt-2" />
          </div>
        </main>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="text-6xl mb-4">😕</div>
            <p className="text-zinc-500 mb-4">{error}</p>
            <Link href="/events" className="text-orange-500 hover:underline">
              Back to events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">

      <main className="max-w-2xl mx-auto px-6 py-8">
        <Link
          href={`/events/${eventId}`}
          className="inline-flex items-center text-zinc-600 hover:text-orange-500 mb-6 font-medium"
        >
          ← Back to event
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900">
            Edit <span className="text-orange-500">Event</span>
          </h1>
          <p className="text-zinc-500 mt-1">Update your event details</p>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">
                Event updated! Redirecting...
              </div>
            )}

            <div className="space-y-6">
              {/* Title */}
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-zinc-700 mb-2"
                >
                  Event Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* Sport Type */}
              <div>
                <label
                  htmlFor="sport_type"
                  className="block text-sm font-medium text-zinc-700 mb-2"
                >
                  Sport / Activity
                </label>
                <select
                  id="sport_type"
                  value={sportType}
                  onChange={(e) => setSportType(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                  className="block text-sm font-medium text-zinc-700 mb-2"
                >
                  Event Location
                </label>
                <LocationAutocomplete
                  value={location}
                  onChange={setLocation}
                  onLocationSelect={(loc) => {
                    setLocation(loc.address);
                    setCoordinates({ lat: loc.lat, lng: loc.lng });
                    setLocationName(loc.locationName);
                    setAddressLine(loc.addressLine);
                  }}
                  placeholder="Search for the event location"
                  required
                />
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="date"
                    className="block text-sm font-medium text-zinc-700 mb-2"
                  >
                    Date
                  </label>
                  <input
                    type="date"
                    id="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label
                    htmlFor="time"
                    className="block text-sm font-medium text-zinc-700 mb-2"
                  >
                    Time
                  </label>
                  <input
                    type="time"
                    id="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Duration */}
              <div>
                <label
                  htmlFor="duration"
                  className="block text-sm font-medium text-zinc-700 mb-2"
                >
                  Duration
                </label>
                <select
                  id="duration"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  required
                  className="w-full px-4 py-3 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                  className="block text-sm font-medium text-zinc-700 mb-2"
                >
                  Skill Level
                </label>
                <select
                  id="skill_level"
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                  className="block text-sm font-medium text-zinc-700 mb-2"
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
                  className="w-full px-4 py-3 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-zinc-700 mb-2"
                >
                  Description (optional)
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Tell people what to expect..."
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={saving || success}
                  className="flex-1 py-3 bg-orange-500 text-white rounded-full font-bold hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Saving..." : success ? "Saved!" : "Save Changes"}
                </button>
                <Link
                  href={`/events/${eventId}`}
                  className="px-6 py-3 border border-zinc-300 text-zinc-700 rounded-full font-medium hover:bg-zinc-50 transition-colors text-center"
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
