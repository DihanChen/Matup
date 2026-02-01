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
  creator_name?: string;
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
  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [sortByDistance, setSortByDistance] = useState(false);
  const [maxDistance, setMaxDistance] = useState<number | null>(null); // in km
  const [skillFilter, setSkillFilter] = useState("");

  // Get user's location
  function handleGetLocation() {
    // If already active, turn it off
    if (locationStatus === "success") {
      setUserLocation(null);
      setLocationStatus("idle");
      setSortByDistance(false);
      setMaxDistance(null);
      return;
    }

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
      const creatorIds = [...new Set((eventsData || []).map((e) => e.creator_id))];

      if (eventIds.length > 0) {
        const { data: participantsData } = await supabase
          .from("event_participants")
          .select("event_id")
          .in("event_id", eventIds);

        const counts: Record<string, number> = {};
        (participantsData || []).forEach((p) => {
          counts[p.event_id] = (counts[p.event_id] || 0) + 1;
        });

        // Fetch creator profiles
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, name")
          .in("id", creatorIds);

        const creatorNames: Record<string, string> = {};
        (profilesData || []).forEach((p) => {
          creatorNames[p.id] = p.name || "Anonymous";
        });

        const eventsWithCount = (eventsData || []).map((event) => ({
          ...event,
          participant_count: counts[event.id] || 0,
          creator_name: creatorNames[event.creator_id] || "Anonymous",
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

    // Filter by search query (title, description, or location)
    if (searchQuery.trim()) {
      const queryLower = searchQuery.toLowerCase();
      result = result.filter(
        (event) =>
          event.title.toLowerCase().includes(queryLower) ||
          event.description?.toLowerCase().includes(queryLower) ||
          event.location.toLowerCase().includes(queryLower)
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
  }, [events, searchQuery, userLocation, sortByDistance, maxDistance, skillFilter]);

  return (
    <div className="min-h-screen bg-[#fbfbfd]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Search Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-8 mb-8">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg className="absolute top-4 left-10 w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            <svg className="absolute top-8 right-16 w-14 h-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <circle cx="12" cy="12" r="9" />
              <path strokeLinecap="round" d="M3.5 12c0-2 3.8-3.5 8.5-3.5s8.5 1.5 8.5 3.5M3.5 12c0 2 3.8 3.5 8.5 3.5s8.5-1.5 8.5-3.5" />
            </svg>
            <svg className="absolute bottom-4 left-1/4 w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <circle cx="6" cy="17" r="3" />
              <circle cx="18" cy="17" r="3" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 17l4-7h4l2 3.5M10 10l2-4h3" />
            </svg>
            <svg className="absolute bottom-6 right-1/4 w-14 h-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h2m14 0h2M6 12v-2a1 1 0 011-1h1v6H7a1 1 0 01-1-1v-2zm12 0v-2a1 1 0 00-1-1h-1v6h1a1 1 0 001-1v-2zm-10 0h8" />
            </svg>
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
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search events or locations..."
                  className="w-full pl-9 pr-4 py-3 rounded-xl bg-white/90 backdrop-blur text-zinc-900 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white"
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

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Sport Dropdown */}
          <select
            value={sportFilter}
            onChange={(e) => setSportFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent cursor-pointer"
          >
            <option value="">All Sports</option>
            <option value="running">Running</option>
            <option value="tennis">Tennis</option>
            <option value="cycling">Cycling</option>
            <option value="gym">Gym</option>
            <option value="yoga">Yoga</option>
            <option value="basketball">Basketball</option>
            <option value="soccer">Soccer</option>
            <option value="swimming">Swimming</option>
            <option value="hiking">Hiking</option>
          </select>

          {/* Level Dropdown */}
          <select
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent cursor-pointer"
          >
            <option value="">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>

          {/* Near Me Button */}
          <button
            onClick={handleGetLocation}
            disabled={locationStatus === "loading"}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              locationStatus === "success"
                ? "bg-emerald-500 text-white"
                : locationStatus === "error"
                ? "bg-red-50 text-red-600 border border-red-200"
                : "bg-white text-zinc-700 border border-zinc-200 hover:border-emerald-500 hover:text-emerald-600"
            }`}
          >
            {locationStatus === "loading" ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Locating...</span>
              </>
            ) : locationStatus === "success" ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="m9.69 18.933.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 0 0 .281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 1 0 3 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 0 0 2.273 1.765 11.842 11.842 0 0 0 .976.544l.062.029.018.008.006.003ZM10 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" clipRule="evenodd" />
                </svg>
                <span>Near Me</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 opacity-60">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </>
            ) : locationStatus === "error" ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                </svg>
                <span>Location denied</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="m9.69 18.933.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 0 0 .281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 1 0 3 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 0 0 2.273 1.765 11.842 11.842 0 0 0 .976.544l.062.029.018.008.006.003ZM10 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" clipRule="evenodd" />
                </svg>
                <span>Near Me</span>
              </>
            )}
          </button>

          {/* Distance Dropdown - only show when location is enabled */}
          {userLocation && (
            <select
              value={maxDistance?.toString() || ""}
              onChange={(e) => setMaxDistance(e.target.value ? Number(e.target.value) : null)}
              className="px-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent cursor-pointer"
            >
              <option value="">Any Distance</option>
              <option value="5">Within 5km</option>
              <option value="10">Within 10km</option>
              <option value="25">Within 25km</option>
              <option value="50">Within 50km</option>
            </select>
          )}

          {/* Clear Filters - show when any filter is active */}
          {(sportFilter || skillFilter || maxDistance) && (
            <button
              onClick={() => {
                setSportFilter("");
                setSkillFilter("");
                setMaxDistance(null);
              }}
              className="text-sm text-zinc-500 hover:text-zinc-700 underline"
            >
              Clear filters
            </button>
          )}
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
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-zinc-900 mb-2">
              No events found
            </h3>
            <p className="text-zinc-500 mb-6">
              {maxDistance
                ? `No events within ${maxDistance}km. Try increasing the distance or`
                : searchQuery
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
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>
              {formattedDate} at {formattedTime}
            </span>
          </div>
          {event.creator_name && (
            <div className="flex items-center gap-2 text-zinc-600">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>{event.creator_name}</span>
            </div>
          )}
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
