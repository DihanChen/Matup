"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, Suspense, useRef } from "react";
import { createClient } from "@/lib/supabase";
import EventCard from "@/components/EventCard";
import { useSearchParams } from "next/navigation";
import {
  getCurrentUserId,
  getUpcomingEventsWithMetadata,
  type EventWithMetadata,
} from "@/lib/queries/events";

type Event = EventWithMetadata & {
  distance?: number;
};

type UserLocation = {
  lat: number;
  lng: number;
};

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const SPORT_FILTERS = [
  { value: "", label: "All" },
  { value: "soccer", label: "Soccer" },
  { value: "tennis", label: "Tennis" },
  { value: "pickleball", label: "Pickleball" },
  { value: "basketball", label: "Basketball" },
  { value: "running", label: "Running" },
  { value: "cycling", label: "Cycling" },
  { value: "gym", label: "Gym" },
  { value: "yoga", label: "Yoga" },
  { value: "hiking", label: "Hiking" },
];

export default function EventsPage() {
  return (
    <Suspense fallback={
      <div className="h-[calc(100vh-56px)] bg-zinc-50 overflow-hidden animate-pulse">
        <div className="flex h-full min-h-0 flex-col lg:flex-row">
          <div className="w-full lg:w-96 bg-white border-b lg:border-b-0 lg:border-r border-zinc-200 p-5 sm:p-6 space-y-4">
            <div className="h-8 w-32 bg-zinc-200 rounded-xl" />
            <div className="h-4 w-56 bg-zinc-100 rounded" />
            <div className="h-10 w-full bg-zinc-100 rounded-full" />
            <div className="h-10 w-full bg-zinc-100 rounded-full" />
            <div className="space-y-3 pt-2">
              {[1, 2, 3].map((item) => (
                <div key={`events-list-skeleton-${item}`} className="rounded-xl border border-zinc-200 overflow-hidden">
                  <div className="h-32 bg-zinc-100" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 w-24 bg-zinc-200 rounded" />
                    <div className="h-4 w-3/4 bg-zinc-200 rounded" />
                    <div className="h-3 w-1/2 bg-zinc-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 bg-zinc-100" />
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
  const searchFromUrl = searchParams.get("search") || "";

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [sportFilter, setSportFilter] = useState(sportFromUrl);
  const [searchQuery, setSearchQuery] = useState(searchFromUrl);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [sortByDistance, setSortByDistance] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const hasAttemptedAutoLocation = useRef(false);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  function handleGetLocation() {
    if (locationStatus === "success") {
      setUserLocation(null);
      setLocationStatus("idle");
      setSortByDistance(false);
      return;
    }

    if (!navigator.geolocation) {
      setLocationStatus("error");
      return;
    }

    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationStatus("success");
        setSortByDistance(true);
      },
      () => { setLocationStatus("error"); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  useEffect(() => {
    async function fetchEvents() {
      const supabase = createClient();

      const userId = await getCurrentUserId(supabase);
      if (userId) setCurrentUserId(userId);

      const eventsData = await getUpcomingEventsWithMetadata(supabase, sportFilter);
      setEvents(eventsData);

      setLoading(false);
    }

    fetchEvents();
  }, [sportFilter]);

  useEffect(() => {
    if (hasAttemptedAutoLocation.current) return;
    hasAttemptedAutoLocation.current = true;

    if (!navigator.geolocation) {
      window.setTimeout(() => setLocationStatus("error"), 0);
      return;
    }

    window.setTimeout(() => setLocationStatus("loading"), 0);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationStatus("success");
        setSortByDistance(true);
      },
      () => { setLocationStatus("error"); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const filteredEvents = useMemo(() => {
    let result = events.map((event) => {
      if (userLocation && event.latitude && event.longitude) {
        return {
          ...event,
          distance: calculateDistance(userLocation.lat, userLocation.lng, event.latitude, event.longitude),
        };
      }
      return { ...event, distance: undefined };
    });

    if (searchQuery.trim()) {
      const queryLower = searchQuery.toLowerCase();
      result = result.filter(
        (event) =>
          event.title.toLowerCase().includes(queryLower) ||
          event.description?.toLowerCase().includes(queryLower) ||
          event.location.toLowerCase().includes(queryLower) ||
          event.creator_name?.toLowerCase().includes(queryLower)
      );
    }

    if (sortByDistance && userLocation) {
      result.sort((a, b) => {
        if (a.distance === undefined && b.distance === undefined) return 0;
        if (a.distance === undefined) return 1;
        if (b.distance === undefined) return -1;
        return a.distance - b.distance;
      });
    }

    return result;
  }, [events, searchQuery, userLocation, sortByDistance]);

  // Map center — user location or default
  const mapLat = userLocation?.lat ?? 39.8283;
  const mapLng = userLocation?.lng ?? -98.5795;
  const bboxOffset = userLocation ? 0.035 : 30;

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] overflow-hidden">

      {/* Content: sidebar + map, fills remaining height */}
      <div className="flex-1 flex min-h-0 flex-col lg:flex-row">
        {/* ── LEFT SIDEBAR ── */}
        <aside className="w-full lg:w-96 flex-1 lg:flex-none bg-white border-b lg:border-b-0 lg:border-r border-zinc-200 flex flex-col overflow-hidden min-h-0">
          <div className="px-5 pt-8 pb-0 flex-shrink-0">
            {/* Title */}
            <div className="mb-5">
              <h1 className="text-3xl font-bold text-zinc-900">Nearby</h1>
              <p className="text-zinc-400 text-sm mt-1">
                {loading ? "Searching..." : `Found ${filteredEvents.length} matches in your vicinity`}
              </p>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sport, venue, host..."
                className="w-full pl-12 pr-4 py-3 rounded-full bg-zinc-100 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:bg-white transition-all"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 pb-4">
              <div className="relative flex-1">
                <select
                  value={sportFilter}
                  onChange={(e) => setSportFilter(e.target.value)}
                  className="w-full appearance-none px-4 py-2.5 pr-10 rounded-full text-sm font-medium bg-zinc-100 text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:bg-white cursor-pointer"
                >
                  {SPORT_FILTERS.map((sport) => (
                    <option key={sport.value} value={sport.value}>{sport.label}</option>
                  ))}
                </select>
                <svg
                  className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
                </svg>
              </div>
              <button
                onClick={handleGetLocation}
                disabled={locationStatus === "loading"}
                className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                  locationStatus === "success"
                    ? "bg-orange-500 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                {locationStatus === "loading" ? "..." : "Near Me"}
              </button>
            </div>
          </div>

          {/* Scrollable cards */}
          <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4 scrollbar-hide">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border border-zinc-200 animate-pulse overflow-hidden">
                  <div className="h-40 bg-zinc-100" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-zinc-200 rounded w-24" />
                    <div className="h-4 bg-zinc-200 rounded w-3/4" />
                    <div className="h-3 bg-zinc-200 rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-zinc-900 mb-1">No events found</p>
                <p className="text-xs text-zinc-400 mb-4">
                  {searchQuery ? "Try a different search" : "Try a different sport or create the first one!"}
                </p>
                <Link href="/events/create" className="inline-block px-4 py-2 bg-zinc-900 text-white rounded-full text-sm font-medium hover:bg-zinc-800">
                  Create Event
                </Link>
              </div>
            ) : (
              filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} currentUserId={currentUserId} />
              ))
            )}
          </div>
        </aside>

        {/* ── MAP (fills remaining space) ── */}
        <div className="relative h-52 sm:h-64 lg:h-auto lg:flex-1 flex-shrink-0">
          <iframe
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapLng - bboxOffset},${mapLat - bboxOffset * 0.6},${mapLng + bboxOffset},${mapLat + bboxOffset * 0.6}&layer=mapnik&marker=${mapLat},${mapLng}`}
            className="absolute inset-0 w-full h-full border-0"
            loading="lazy"
            title="Nearby events map"
          />

        </div>
      </div>

    </div>
  );
}
