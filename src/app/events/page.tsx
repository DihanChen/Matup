"use client";

import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { createClient } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import { useSearchParams } from "next/navigation";
import LocationLink from "@/components/LocationLink";

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
  participant_count: number;
  latitude: number | null;
  longitude: number | null;
  skill_level: string;
  distance?: number; // calculated client-side
};

type UserLocation = {
  lat: number;
  lng: number;
};

// Haversine formula to calculate distance between two points
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}

export default function EventsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#fbfbfd]">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-zinc-500">Loading...</div>
        </div>
      </div>
    }>
      <EventsContent />
    </Suspense>
  );
}

function EventsContent() {
  const searchParams = useSearchParams();
  const sportFromUrl = searchParams.get("sport") || "";

  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [sportFilter, setSportFilter] = useState(sportFromUrl);
  const [locationSearch, setLocationSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [sortByDistance, setSortByDistance] = useState(false);
  const [maxDistance, setMaxDistance] = useState<number | null>(null); // in km
  const [skillFilter, setSkillFilter] = useState("");

  // Get user's location
  function handleGetLocation() {
    if (!navigator.geolocation) {
      setLocationStatus("error");
      return;
    }

    setLocationStatus("loading");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationStatus("success");
        setSortByDistance(true);
      },
      () => {
        setLocationStatus("error");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // Fetch events from database
  useEffect(() => {
    async function fetchEvents() {
      const supabase = createClient();

      let query = supabase
        .from("events")
        .select("*")
        .gte("datetime", new Date().toISOString())
        .order("datetime", { ascending: true });

      if (sportFilter) {
        query = query.eq("sport_type", sportFilter);
      }

      const { data: eventsData, error } = await query;

      if (error) {
        console.error("Error fetching events:", error);
        setLoading(false);
        return;
      }

      const eventIds = (eventsData || []).map((e) => e.id);

      if (eventIds.length > 0) {
        const { data: participantsData } = await supabase
          .from("event_participants")
          .select("event_id")
          .in("event_id", eventIds);

        const counts: Record<string, number> = {};
        (participantsData || []).forEach((p) => {
          counts[p.event_id] = (counts[p.event_id] || 0) + 1;
        });

        const eventsWithCount = (eventsData || []).map((event) => ({
          ...event,
          participant_count: counts[event.id] || 0,
        }));
        setEvents(eventsWithCount);
      } else {
        setEvents([]);
      }

      setLoading(false);
    }

    fetchEvents();
  }, [sportFilter]);

  // Client-side filtering for location, search, and distance
  useEffect(() => {
    let result = events.map((event) => {
      // Calculate distance if we have user location and event has coordinates
      if (userLocation && event.latitude && event.longitude) {
        return {
          ...event,
          distance: calculateDistance(
            userLocation.lat,
            userLocation.lng,
            event.latitude,
            event.longitude
          ),
        };
      }
      return { ...event, distance: undefined };
    });

    // Filter by text location search
    if (locationSearch.trim()) {
      const searchLower = locationSearch.toLowerCase();
      result = result.filter((event) =>
        event.location.toLowerCase().includes(searchLower)
      );
    }

    // Filter by title/description search
    if (searchQuery.trim()) {
      const queryLower = searchQuery.toLowerCase();
      result = result.filter(
        (event) =>
          event.title.toLowerCase().includes(queryLower) ||
          event.description?.toLowerCase().includes(queryLower)
      );
    }

    // Filter by max distance
    if (maxDistance && userLocation) {
      result = result.filter(
        (event) => event.distance !== undefined && event.distance <= maxDistance
      );
    }

    // Filter by skill level
    if (skillFilter) {
      result = result.filter(
        (event) => event.skill_level === skillFilter || event.skill_level === "all"
      );
    }

    // Sort by distance if enabled
    if (sortByDistance && userLocation) {
      result.sort((a, b) => {
        // Events with coordinates come first
        if (a.distance === undefined && b.distance === undefined) return 0;
        if (a.distance === undefined) return 1;
        if (b.distance === undefined) return -1;
        return a.distance - b.distance;
      });
    }

    setFilteredEvents(result);
  }, [events, locationSearch, searchQuery, userLocation, sortByDistance, maxDistance, skillFilter]);

  return (
    <div className="min-h-screen bg-[#fbfbfd]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Search Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-8 mb-8">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 left-10 text-6xl">🏃</div>
            <div className="absolute top-8 right-16 text-5xl">🎾</div>
            <div className="absolute bottom-4 left-1/4 text-4xl">🚴</div>
            <div className="absolute bottom-6 right-1/4 text-5xl">💪</div>
          </div>

          <div className="relative">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Find Events Near You
            </h1>
            <p className="text-white/80 text-lg mb-6">
              Discover fitness activities and meet workout partners
            </p>

            {/* Search Inputs */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">
                  🔍
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search events..."
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/90 backdrop-blur text-zinc-900 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white"
                />
              </div>
              <div className="flex-1 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">
                  📍
                </span>
                <input
                  type="text"
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  placeholder="Location (e.g. Toronto, Downtown)"
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/90 backdrop-blur text-zinc-900 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white"
                />
              </div>
              <Link
                href="/events/create"
                className="px-6 py-3 bg-white text-emerald-600 rounded-xl font-semibold hover:bg-emerald-50 transition-colors text-center"
              >
                + Create Event
              </Link>
            </div>
          </div>
        </div>

        {/* Near Me Button */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <button
            onClick={handleGetLocation}
            disabled={locationStatus === "loading"}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${
              locationStatus === "success"
                ? "bg-emerald-500 text-white"
                : locationStatus === "error"
                ? "bg-red-100 text-red-700 border border-red-300"
                : "bg-white text-zinc-700 border border-zinc-200 hover:border-emerald-500 hover:text-emerald-600"
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
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                <span>Near Me</span>
              </>
            ) : locationStatus === "error" ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
                <span>Location denied</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                <span>Near Me</span>
              </>
            )}
          </button>

          {/* Distance Filter - only show when location is enabled */}
          {userLocation && (
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 text-sm">Within:</span>
              {[5, 10, 25, 50].map((km) => (
                <button
                  key={km}
                  onClick={() => setMaxDistance(maxDistance === km ? null : km)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    maxDistance === km
                      ? "bg-emerald-500 text-white"
                      : "bg-white text-zinc-600 border border-zinc-200 hover:border-emerald-500"
                  }`}
                >
                  {km}km
                </button>
              ))}
              {maxDistance && (
                <button
                  onClick={() => setMaxDistance(null)}
                  className="text-zinc-500 hover:text-zinc-700 text-sm underline"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sport Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="text-zinc-600 font-medium">
            Sport:
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSportFilter("")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                sportFilter === ""
                  ? "bg-emerald-500 text-white"
                  : "bg-white text-zinc-700 border border-zinc-200 hover:border-emerald-500"
              }`}
            >
              All Sports
            </button>
            {[
              { id: "running", icon: "🏃", label: "Running" },
              { id: "tennis", icon: "🎾", label: "Tennis" },
              { id: "cycling", icon: "🚴", label: "Cycling" },
              { id: "gym", icon: "💪", label: "Gym" },
              { id: "yoga", icon: "🧘", label: "Yoga" },
              { id: "basketball", icon: "🏀", label: "Basketball" },
              { id: "soccer", icon: "⚽", label: "Soccer" },
              { id: "swimming", icon: "🏊", label: "Swimming" },
              { id: "hiking", icon: "🥾", label: "Hiking" },
            ].map((sport) => (
              <button
                key={sport.id}
                onClick={() => setSportFilter(sport.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  sportFilter === sport.id
                    ? "bg-emerald-500 text-white"
                    : "bg-white text-zinc-700 border border-zinc-200 hover:border-emerald-500"
                }`}
              >
                {sport.icon} {sport.label}
              </button>
            ))}
          </div>
        </div>

        {/* Skill Level Filter */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="text-zinc-600 font-medium">
            Level:
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSkillFilter("")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                skillFilter === ""
                  ? "bg-emerald-500 text-white"
                  : "bg-white text-zinc-700 border border-zinc-200 hover:border-emerald-500"
              }`}
            >
              All Levels
            </button>
            {[
              { id: "beginner", label: "Beginner" },
              { id: "intermediate", label: "Intermediate" },
              { id: "advanced", label: "Advanced" },
            ].map((level) => (
              <button
                key={level.id}
                onClick={() => setSkillFilter(level.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  skillFilter === level.id
                    ? "bg-emerald-500 text-white"
                    : "bg-white text-zinc-700 border border-zinc-200 hover:border-emerald-500"
                }`}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-zinc-600">
            {loading ? (
              "Loading..."
            ) : (
              <>
                <span className="font-semibold text-zinc-900">
                  {filteredEvents.length}
                </span>{" "}
                {filteredEvents.length === 1 ? "event" : "events"} found
                {maxDistance && ` within ${maxDistance}km`}
                {locationSearch && ` near "${locationSearch}"`}
                {sportFilter && ` for ${sportFilter}`}
                {skillFilter && ` (${skillFilter})`}
                {sortByDistance && userLocation && " (sorted by distance)"}
              </>
            )}
          </p>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-zinc-200 p-5 animate-pulse"
              >
                <div className="h-6 bg-zinc-200 rounded w-20 mb-4"></div>
                <div className="h-6 bg-zinc-200 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-zinc-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-zinc-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-zinc-200">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-zinc-900 mb-2">
              No events found
            </h3>
            <p className="text-zinc-500 mb-6">
              {maxDistance
                ? `No events within ${maxDistance}km. Try increasing the distance or`
                : locationSearch || searchQuery
                ? "Try adjusting your search or filters"
                : "Be the first to create an event!"}
            </p>
            <Link
              href="/events/create"
              className="inline-block px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-colors"
            >
              Create an Event
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function EventCard({ event }: { event: Event }) {
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

  const spotsLeft = event.max_participants - event.participant_count;
  const isFull = spotsLeft <= 0;
  const isAlmostFull = spotsLeft > 0 && spotsLeft <= 2;

  return (
    <Link
      href={`/events/${event.id}`}
      className="group block bg-white rounded-2xl border border-zinc-200 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10 transition-all overflow-hidden"
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-full capitalize">
              {event.sport_type}
            </span>
            {event.skill_level && event.skill_level !== "all" && (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full capitalize">
                {event.skill_level}
              </span>
            )}
            {event.distance !== undefined && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                {formatDistance(event.distance)}
              </span>
            )}
          </div>
          <span
            className={`text-sm font-medium ${
              isFull
                ? "text-red-500"
                : isAlmostFull
                ? "text-orange-500"
                : "text-zinc-500"
            }`}
          >
            {isFull
              ? "Full"
              : `${event.participant_count}/${event.max_participants}`}
          </span>
        </div>

        <h3 className="text-lg font-semibold text-zinc-900 mb-3 group-hover:text-emerald-600 transition-colors">
          {event.title}
        </h3>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-zinc-600">
            <LocationLink
              location={event.location}
              latitude={event.latitude}
              longitude={event.longitude}
              className="text-zinc-600"
              asButton={true}
            />
          </div>
          <div className="flex items-center gap-2 text-zinc-600">
            <span>📅</span>
            <span>
              {formattedDate} at {formattedTime}
            </span>
          </div>
        </div>

        {event.description && (
          <p className="mt-3 text-sm text-zinc-500 line-clamp-2">
            {event.description}
          </p>
        )}

        <div className="mt-4 pt-4 border-t border-zinc-100">
          <div
            className={`w-full py-2 text-center rounded-lg font-medium transition-colors ${
              isFull
                ? "bg-zinc-100 text-zinc-500"
                : "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100"
            }`}
          >
            {isFull ? "Event Full" : "View Details →"}
          </div>
        </div>
      </div>
    </Link>
  );
}
