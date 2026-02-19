"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import CourtCard from "@/components/CourtCard";
import EventCard from "@/components/EventCard";
import MapDynamic from "@/components/map/MapDynamic";
import { OSM_COURTS_SESSION_KEY } from "@/features/courts/constants";
import { useOsmCourts } from "@/features/courts/hooks/useOsmCourts";
import type { BoundingBox, Court, DisplayCourt, OsmCourt } from "@/features/courts/types";
import { haversineDistance } from "@/lib/geo";
import { getApprovedCourts } from "@/lib/queries/courts";
import {
  getCurrentUserId,
  getUpcomingEventsWithMetadata,
  type EventWithMetadata,
} from "@/lib/queries/events";
import { createClient } from "@/lib/supabase";

type Event = EventWithMetadata & {
  distance?: number;
};

type UserLocation = {
  lat: number;
  lng: number;
};

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
const OSM_MARKER_CLUSTER_RADIUS_METERS = 100;
const DEFAULT_OSM_COURT_NAME = "Public Court";
const NEAR_ME_SEARCH_LAT_DELTA = 0.02;

type DbCourtRecord = Court & {
  osm_id?: number | string | null;
  source?: string | null;
  surface?: string | null;
  lighting?: boolean | null;
  average_rating?: number | string | null;
  review_count?: number | null;
};

type OsmCourtImportPayload = {
  osm_id: number;
  osm_type: string;
  name: string;
  latitude: number;
  longitude: number;
  sport_types: string[];
  surface: string | null;
  address: string;
};

type OSMAggregateCourt = {
  osmIds: number[];
  osmType: string;
  primaryOsmId: number;
  name: string;
  hasCustomName: boolean;
  latitude: number;
  longitude: number;
  sportTypes: Set<string>;
  surface: string | null;
  lighting: boolean | null;
};

function normalizeOsmId(value: number | string | null | undefined): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeRating(value: number | string | null | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function toDisplayDbCourt(court: DbCourtRecord): DisplayCourt {
  const osmId = normalizeOsmId(court.osm_id);
  return {
    id: court.id,
    source: "db",
    osm_id: osmId,
    name: court.name,
    address: court.address,
    latitude: court.latitude,
    longitude: court.longitude,
    sport_types: court.sport_types,
    surface: court.surface || null,
    lighting: typeof court.lighting === "boolean" ? court.lighting : null,
    image_url: court.image_url,
    average_rating: normalizeRating(court.average_rating),
    review_count: typeof court.review_count === "number" ? court.review_count : 0,
  };
}

function toOsmImportPayload(court: {
  osm_id: number;
  osm_type: string;
  name: string;
  latitude: number;
  longitude: number;
  sport_types: string[];
  surface: string | null;
}): OsmCourtImportPayload {
  const name = court.name.trim() || DEFAULT_OSM_COURT_NAME;
  return {
    osm_id: court.osm_id,
    osm_type: court.osm_type,
    name,
    latitude: court.latitude,
    longitude: court.longitude,
    sport_types: court.sport_types,
    surface: court.surface,
    address: `${name}, OpenStreetMap`,
  };
}

function mergeOsmCourtsByLocation(courts: OsmCourt[]): OSMAggregateCourt[] {
  const groups: OSMAggregateCourt[] = [];

  for (const court of courts) {
    const customName = court.name?.trim() || "";
    const fallbackName = DEFAULT_OSM_COURT_NAME;
    const existing = groups.find(
      (group) =>
        haversineDistance(group.latitude, group.longitude, court.latitude, court.longitude) * 1000 <=
        OSM_MARKER_CLUSTER_RADIUS_METERS
    );

    if (!existing) {
      groups.push({
        osmIds: [court.osm_id],
        osmType: court.osm_type,
        primaryOsmId: court.osm_id,
        name: customName || fallbackName,
        hasCustomName: customName.length > 0,
        latitude: court.latitude,
        longitude: court.longitude,
        sportTypes: new Set([court.sport]),
        surface: court.surface,
        lighting: court.lit,
      });
      continue;
    }

    const existingCount = existing.osmIds.length;
    existing.osmIds.push(court.osm_id);
    existing.latitude = (existing.latitude * existingCount + court.latitude) / (existingCount + 1);
    existing.longitude = (existing.longitude * existingCount + court.longitude) / (existingCount + 1);
    existing.sportTypes.add(court.sport);

    if (court.osm_id < existing.primaryOsmId) {
      existing.primaryOsmId = court.osm_id;
      existing.osmType = court.osm_type;
    }

    if (!existing.hasCustomName && customName) {
      existing.name = customName;
      existing.hasCustomName = true;
    }

    if (!existing.surface && court.surface) {
      existing.surface = court.surface;
    }

    if (existing.lighting === null && court.lit !== null) {
      existing.lighting = court.lit;
    }
  }

  return groups;
}

function isPointInBounds(lat: number, lng: number, bounds: BoundingBox): boolean {
  return (
    lat >= bounds.south &&
    lat <= bounds.north &&
    lng >= bounds.west &&
    lng <= bounds.east
  );
}

function areBoundsEqual(a: BoundingBox, b: BoundingBox): boolean {
  return (
    Math.abs(a.south - b.south) < 0.000001 &&
    Math.abs(a.west - b.west) < 0.000001 &&
    Math.abs(a.north - b.north) < 0.000001 &&
    Math.abs(a.east - b.east) < 0.000001
  );
}

function buildNearMeBounds(location: UserLocation): BoundingBox {
  const latitude = location.lat;
  const longitude = location.lng;
  const latitudeRadians = (latitude * Math.PI) / 180;
  const cosine = Math.abs(Math.cos(latitudeRadians));
  const longitudeDelta = NEAR_ME_SEARCH_LAT_DELTA / Math.max(cosine, 0.2);

  return {
    south: latitude - NEAR_ME_SEARCH_LAT_DELTA,
    west: longitude - longitudeDelta,
    north: latitude + NEAR_ME_SEARCH_LAT_DELTA,
    east: longitude + longitudeDelta,
  };
}

export default function EventsPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[calc(100vh-56px)] bg-zinc-50 overflow-hidden animate-pulse">
          <div className="flex h-full min-h-0 flex-col lg:flex-row">
            <div className="w-full lg:w-96 bg-white border-b lg:border-b-0 lg:border-r border-zinc-200 p-5 sm:p-6 space-y-4">
              <div className="h-8 w-32 bg-zinc-200 rounded-xl" />
              <div className="h-4 w-56 bg-zinc-100 rounded" />
              <div className="h-10 w-full bg-zinc-100 rounded-full" />
              <div className="h-10 w-full bg-zinc-100 rounded-full" />
              <div className="space-y-3 pt-2">
                {[1, 2, 3].map((item) => (
                  <div
                    key={`events-list-skeleton-${item}`}
                    className="rounded-xl border border-zinc-200 overflow-hidden"
                  >
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
      }
    >
      <EventsContent />
    </Suspense>
  );
}

function EventsContent() {
  const searchParams = useSearchParams();
  const sportFromUrl = searchParams.get("sport") || "";
  const searchFromUrl = searchParams.get("search") || "";

  const [events, setEvents] = useState<Event[]>([]);
  const [dbCourts, setDbCourts] = useState<Court[]>([]);
  const [mapBounds, setMapBounds] = useState<BoundingBox | null>(null);
  const [searchedBounds, setSearchedBounds] = useState<BoundingBox | null>(null);
  const [loading, setLoading] = useState(true);
  const [sportFilter, setSportFilter] = useState(sportFromUrl);
  const [searchQuery, setSearchQuery] = useState(searchFromUrl);
  const [activeView, setActiveView] = useState<"events" | "courts">("events");
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [sortByDistance, setSortByDistance] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [selectedMarkerType, setSelectedMarkerType] = useState<"event" | "court" | null>(null);
  const hasAttemptedAutoLocation = useRef(false);
  const hasAutoInitialAreaSearch = useRef(false);
  const listContainerRef = useRef<HTMLDivElement | null>(null);
  const eventRowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const courtRowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const { osmCourts, loading: osmLoading } = useOsmCourts(searchedBounds, sportFilter);

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
      () => {
        setLocationStatus("error");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  useEffect(() => {
    let isCancelled = false;

    async function fetchData() {
      setLoading(true);
      const supabase = createClient();

      const userId = await getCurrentUserId(supabase);
      if (!isCancelled) {
        setCurrentUserId(userId);
      }

      const [eventsData, courtsData]: [EventWithMetadata[], Court[]] = await Promise.all([
        getUpcomingEventsWithMetadata(supabase, sportFilter),
        getApprovedCourts(supabase, sportFilter),
      ]);

      if (isCancelled) {
        return;
      }

      setEvents(eventsData);
      setDbCourts(courtsData);
      setLoading(false);
    }

    fetchData();

    return () => {
      isCancelled = true;
    };
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
      () => {
        setLocationStatus("error");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const filteredEvents = useMemo(() => {
    if (!searchedBounds) return [];

    let result = events.map((event) => {
      if (userLocation && event.latitude && event.longitude) {
        return {
          ...event,
          distance: haversineDistance(userLocation.lat, userLocation.lng, event.latitude, event.longitude),
        };
      }
      return { ...event, distance: undefined };
    });

    result = result.filter((event) => {
      if (event.latitude == null || event.longitude == null) return false;
      return isPointInBounds(event.latitude, event.longitude, searchedBounds);
    });

    if (searchQuery.trim()) {
      const queryLower = searchQuery.toLowerCase();
      result = result.filter(
        (event) =>
          event.title.toLowerCase().includes(queryLower) ||
          event.description?.toLowerCase().includes(queryLower) ||
          event.location.toLowerCase().includes(queryLower) ||
          event.creator_name?.toLowerCase().includes(queryLower) ||
          event.sport_type.toLowerCase().includes(queryLower)
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
  }, [events, searchQuery, userLocation, sortByDistance, searchedBounds]);

  const { mergedCourts, osmImportPayloadById } = useMemo(() => {
    const dbByOsmId = new Map<number, DbCourtRecord>();
    const dbRecords = dbCourts as DbCourtRecord[];

    for (const dbCourt of dbRecords) {
      const osmId = normalizeOsmId(dbCourt.osm_id);
      if (osmId !== null) {
        dbByOsmId.set(osmId, dbCourt);
      }
    }

    const merged: DisplayCourt[] = [];
    const importPayloadById: Record<string, OsmCourtImportPayload> = {};
    const usedDbCourtIds = new Set<string>();

    const osmAggregates = mergeOsmCourtsByLocation(osmCourts);
    for (const aggregate of osmAggregates) {
      const dbMatch = aggregate.osmIds
        .map((osmId) => dbByOsmId.get(osmId))
        .find((candidate): candidate is DbCourtRecord => Boolean(candidate));

      if (dbMatch) {
        merged.push(toDisplayDbCourt(dbMatch));
        usedDbCourtIds.add(dbMatch.id);
        continue;
      }

      const sportTypes = Array.from(aggregate.sportTypes);
      const displayId = `osm-${aggregate.primaryOsmId}`;
      merged.push({
        id: displayId,
        source: "osm",
        osm_id: aggregate.primaryOsmId,
        name: aggregate.name,
        address: `${aggregate.name}, OpenStreetMap`,
        latitude: aggregate.latitude,
        longitude: aggregate.longitude,
        sport_types: sportTypes,
        surface: aggregate.surface,
        lighting: aggregate.lighting,
        image_url: null,
        average_rating: 0,
        review_count: 0,
      });

      importPayloadById[displayId] = toOsmImportPayload({
        osm_id: aggregate.primaryOsmId,
        osm_type: aggregate.osmType,
        name: aggregate.name,
        latitude: aggregate.latitude,
        longitude: aggregate.longitude,
        sport_types: sportTypes,
        surface: aggregate.surface,
      });
    }

    for (const dbCourt of dbRecords) {
      const hasOsmId = normalizeOsmId(dbCourt.osm_id) !== null;
      if (!hasOsmId && !usedDbCourtIds.has(dbCourt.id)) {
        merged.push(toDisplayDbCourt(dbCourt));
      }
    }

    return { mergedCourts: merged, osmImportPayloadById: importPayloadById };
  }, [dbCourts, osmCourts]);

  useEffect(() => {
    if (typeof window === "undefined" || Object.keys(osmImportPayloadById).length === 0) return;

    let existingPayload: Record<string, OsmCourtImportPayload> = {};
    const existingRaw = window.sessionStorage.getItem(OSM_COURTS_SESSION_KEY);
    if (existingRaw) {
      try {
        existingPayload = JSON.parse(existingRaw) as Record<string, OsmCourtImportPayload>;
      } catch {
        existingPayload = {};
      }
    }

    window.sessionStorage.setItem(
      OSM_COURTS_SESSION_KEY,
      JSON.stringify({ ...existingPayload, ...osmImportPayloadById })
    );
  }, [osmImportPayloadById]);

  const filteredCourts = useMemo(() => {
    if (!searchedBounds) return [];

    let result = mergedCourts.map((court) => {
      if (userLocation) {
        return {
          ...court,
          distance: haversineDistance(userLocation.lat, userLocation.lng, court.latitude, court.longitude),
        };
      }
      return { ...court, distance: undefined };
    });

    result = result.filter((court) =>
      isPointInBounds(court.latitude, court.longitude, searchedBounds)
    );

    if (searchQuery.trim()) {
      const queryLower = searchQuery.toLowerCase();
      result = result.filter(
        (court) =>
          court.name.toLowerCase().includes(queryLower) ||
          court.address.toLowerCase().includes(queryLower) ||
          court.sport_types.some((sport) => sport.toLowerCase().includes(queryLower))
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
  }, [mergedCourts, searchQuery, userLocation, sortByDistance, searchedBounds]);

  const selectedEvent =
    selectedMarkerType === "event"
      ? filteredEvents.find((event) => event.id === selectedMarkerId)
      : undefined;
  const selectedCourt =
    selectedMarkerType === "court"
      ? filteredCourts.find((court) => court.id === selectedMarkerId)
      : undefined;

  const mapLat =
    selectedEvent?.latitude ??
    selectedCourt?.latitude ??
    userLocation?.lat ??
    39.8283;
  const mapLng =
    selectedEvent?.longitude ??
    selectedCourt?.longitude ??
    userLocation?.lng ??
    -98.5795;
  const mapCenter: [number, number] = [mapLat, mapLng];
  const activeCount = activeView === "events" ? filteredEvents.length : filteredCourts.length;
  const hasActiveAreaSearch = searchedBounds !== null;
  const showSearchAreaButton = mapBounds !== null;
  const canShowEventCount = hasActiveAreaSearch && !loading;
  const canShowCourtCount = hasActiveAreaSearch && !loading && !osmLoading;

  function handleMarkerClick(id: string) {
    setSelectedMarkerId(id);
    setSelectedMarkerType(activeView === "events" ? "event" : "court");
  }

  function handleSidebarClick(id: string, type: "event" | "court") {
    setSelectedMarkerId(id);
    setSelectedMarkerType(type);
  }

  function handleSearchThisArea() {
    if (!mapBounds) return;
    setSearchedBounds({ ...mapBounds });
    setSelectedMarkerId(null);
    setSelectedMarkerType(null);
  }

  const handleMapBoundsChange = useCallback((bounds: BoundingBox) => {
    setMapBounds((previous) => {
      if (previous && areBoundsEqual(previous, bounds)) {
        return previous;
      }
      return bounds;
    });

    if (!hasAutoInitialAreaSearch.current) {
      hasAutoInitialAreaSearch.current = true;
      setSearchedBounds((previous) => {
        if (previous && areBoundsEqual(previous, bounds)) {
          return previous;
        }
        return { ...bounds };
      });
    }
  }, []);

  useEffect(() => {
    if (!selectedMarkerId || !selectedMarkerType) return;

    const target =
      selectedMarkerType === "event"
        ? eventRowRefs.current[selectedMarkerId]
        : courtRowRefs.current[selectedMarkerId];

    if (!target) return;

    target.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });
  }, [selectedMarkerId, selectedMarkerType, activeView]);

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] overflow-hidden">
      <div className="flex-1 flex min-h-0 flex-col lg:flex-row">
        <aside className="w-full lg:w-96 flex-1 lg:flex-none bg-white border-b lg:border-b-0 lg:border-r border-zinc-200 flex flex-col overflow-hidden min-h-0">
          <div className="px-5 pt-8 pb-0 flex-shrink-0">
            <div className="mb-5">
              <h1 className="text-3xl font-bold text-zinc-900">Nearby</h1>
              <p className="text-zinc-400 text-sm mt-1">
                {loading
                  ? "Searching..."
                  : hasActiveAreaSearch
                    ? `Found ${activeCount} matches in this area`
                    : "Move the map and search this area"}
              </p>
            </div>

            <div className="relative mb-4">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sport, venue, host..."
                className="w-full pl-12 pr-4 py-3 rounded-full bg-zinc-100 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:bg-white transition-all"
              />
            </div>

            <div className="flex items-center gap-2 pb-4">
              <div className="relative flex-1">
                <select
                  value={sportFilter}
                  onChange={(e) => setSportFilter(e.target.value)}
                  className="w-full appearance-none px-4 py-2.5 pr-10 rounded-full text-sm font-medium bg-zinc-100 text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:bg-white cursor-pointer"
                >
                  {SPORT_FILTERS.map((sport) => (
                    <option key={sport.value} value={sport.value}>
                      {sport.label}
                    </option>
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
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                  />
                </svg>
                {locationStatus === "loading" ? "..." : "Near Me"}
              </button>
            </div>

            <div className="pb-4">
              <div className="bg-zinc-100 rounded-full p-1 flex gap-1">
                <button
                  onClick={() => {
                    setActiveView("events");
                    setSelectedMarkerId(null);
                    setSelectedMarkerType(null);
                  }}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-full transition-all ${
                    activeView === "events"
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-500"
                  }`}
                >
                  {canShowEventCount ? `Events (${filteredEvents.length})` : "Events"}
                </button>
                <button
                  onClick={() => {
                    setActiveView("courts");
                    setSelectedMarkerId(null);
                    setSelectedMarkerType(null);

                    if (userLocation) {
                      const nearMeBounds = buildNearMeBounds(userLocation);
                      setSearchedBounds((previous) => {
                        if (previous && areBoundsEqual(previous, nearMeBounds)) {
                          return previous;
                        }
                        return nearMeBounds;
                      });
                    } else if (mapBounds) {
                      setSearchedBounds((previous) => {
                        if (previous && areBoundsEqual(previous, mapBounds)) {
                          return previous;
                        }
                        return { ...mapBounds };
                      });
                    }
                  }}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-full transition-all ${
                    activeView === "courts"
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-500"
                  }`}
                >
                  {canShowCourtCount ? `Courts (${filteredCourts.length})` : "Courts"}
                </button>
              </div>
            </div>
          </div>

          <div ref={listContainerRef} className="flex-1 overflow-y-auto px-5 pb-5 space-y-4 scrollbar-hide">
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
            ) : !hasActiveAreaSearch ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-100 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-zinc-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-zinc-900 mb-1">Search this area</p>
                <p className="text-xs text-zinc-400">Pan or zoom the map, then tap &quot;Search this area&quot;.</p>
              </div>
            ) : activeView === "events" ? (
              filteredEvents.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-100 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-zinc-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-zinc-900 mb-1">No events found</p>
                  <p className="text-xs text-zinc-400 mb-4">
                    {searchQuery
                      ? "Try a different search"
                      : "Try a different sport or create the first one!"}
                  </p>
                  <Link
                    href="/events/create"
                    className="inline-block px-4 py-2 bg-zinc-900 text-white rounded-full text-sm font-medium hover:bg-zinc-800"
                  >
                    Create Event
                  </Link>
                </div>
              ) : (
                filteredEvents.map((event) => (
                  <div
                    key={event.id}
                    ref={(node) => {
                      eventRowRefs.current[event.id] = node;
                    }}
                    onClick={() => handleSidebarClick(event.id, "event")}
                    className={`rounded-xl ${
                      selectedMarkerType === "event" && selectedMarkerId === event.id
                        ? "ring-2 ring-orange-500"
                        : ""
                    }`}
                  >
                    <EventCard event={event} currentUserId={currentUserId} />
                  </div>
                ))
              )
            ) : filteredCourts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-100 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-zinc-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-zinc-900 mb-1">No courts found</p>
                <p className="text-xs text-zinc-400 mb-4">
                  {searchQuery
                    ? "Try a different search"
                    : "Be the first to submit a court near you."}
                </p>
                <Link
                  href="/courts/create"
                  className="inline-block px-4 py-2 bg-zinc-900 text-white rounded-full text-sm font-medium hover:bg-zinc-800"
                >
                  Submit Court
                </Link>
              </div>
            ) : (
              filteredCourts.map((court) => (
                <div
                  key={court.id}
                  ref={(node) => {
                    courtRowRefs.current[court.id] = node;
                  }}
                >
                  <CourtCard
                    court={court}
                    onSelect={(id) => handleSidebarClick(id, "court")}
                    isSelected={selectedMarkerType === "court" && selectedMarkerId === court.id}
                  />
                </div>
              ))
            )}
          </div>
        </aside>

        <div className="relative h-52 sm:h-64 lg:h-auto lg:flex-1 flex-shrink-0">
          <MapDynamic
            events={filteredEvents}
            courts={filteredCourts}
            userLocation={userLocation}
            center={mapCenter}
            zoom={userLocation ? 14 : 4}
            selectedId={selectedMarkerId}
            onMarkerClick={handleMarkerClick}
            activeView={activeView}
            onBoundsChange={handleMapBoundsChange}
          />
          {showSearchAreaButton ? (
            <div className="pointer-events-none absolute left-1/2 top-3 z-[500] -translate-x-1/2">
              <button
                type="button"
                onClick={handleSearchThisArea}
                disabled={loading || osmLoading}
                className="pointer-events-auto rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-lg ring-1 ring-zinc-200 transition hover:bg-zinc-50 disabled:opacity-60"
              >
                {osmLoading ? "Searching..." : "Search this area"}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
