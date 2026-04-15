"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OSM_COURTS_SESSION_KEY } from "@/features/courts/constants";
import { useOsmCourts } from "@/features/courts/hooks/useOsmCourts";
import type { BoundingBox, Court, DisplayCourt, OsmCourt } from "@/features/courts/types";
import ExploreMapView from "@/features/events/components/ExploreMapView";
import ExploreSwipeView from "@/features/events/components/ExploreSwipeView";
import {
  clampSwipeIndex,
  createInitialSwipeDecks,
  dismissSwipeDeckItem,
  getVisibleSwipeItems,
  isSwipeJoinable,
  rankSwipeCourts,
  rankSwipeEvents,
  type ExploreEvent,
  type ExploreMode,
  type SwipeTab,
} from "@/features/events/lib/exploreSwipe";
import { haversineDistance } from "@/lib/geo";
import { getApprovedCourts } from "@/lib/queries/courts";
import {
  getCurrentUserId,
  getUpcomingEventsWithMetadata,
  joinEvent,
  type EventWithMetadata,
} from "@/lib/queries/events";
import { createClient } from "@/lib/supabase";

type Event = ExploreEvent;

type UserLocation = {
  lat: number;
  lng: number;
  accuracy?: number;
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
const OSM_MARKER_CLUSTER_RADIUS_METERS = 150;
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

function formatSportLabel(sportTypes: string[]): string {
  if (sportTypes.length === 0) return "Public";
  const primary = sportTypes[0];
  return primary.charAt(0).toUpperCase() + primary.slice(1);
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
  const trimmed = court.name.trim();
  const name = trimmed || `${formatSportLabel(court.sport_types)} Court`;
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
    existing.longitude =
      (existing.longitude * existingCount + court.longitude) / (existingCount + 1);
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
  return lat >= bounds.south && lat <= bounds.north && lng >= bounds.west && lng <= bounds.east;
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

function buildLoginRedirectUrl(): string {
  const params = new URLSearchParams();
  params.set("message", "Sign in to join an event.");
  params.set("next", "/events?mode=swipe");
  return `/login?${params.toString()}`;
}

export default function EventsPageClient() {
  return (
    <Suspense
      fallback={
        <div className="h-[calc(100dvh-56px)] animate-pulse overflow-hidden bg-zinc-50">
          <div className="flex h-full min-h-0 flex-col lg:flex-row">
            <div className="w-full space-y-4 border-b border-zinc-200 bg-white p-5 sm:p-6 lg:w-96 lg:border-b-0 lg:border-r">
              <div className="h-8 w-32 rounded-xl bg-zinc-200" />
              <div className="h-4 w-56 rounded bg-zinc-100" />
              <div className="h-10 w-full rounded-full bg-zinc-100" />
              <div className="h-10 w-full rounded-full bg-zinc-100" />
              <div className="space-y-3 pt-2">
                {[1, 2, 3].map((item) => (
                  <div
                    key={`events-list-skeleton-${item}`}
                    className="overflow-hidden rounded-xl border border-zinc-200"
                  >
                    <div className="h-32 bg-zinc-100" />
                    <div className="space-y-2 p-4">
                      <div className="h-3 w-24 rounded bg-zinc-200" />
                      <div className="h-4 w-3/4 rounded bg-zinc-200" />
                      <div className="h-3 w-1/2 rounded bg-zinc-100" />
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const sportFromUrl = searchParams.get("sport") || "";
  const searchFromUrl = searchParams.get("search") || "";
  const modeFromUrl = searchParams.get("mode");
  const tonightFromUrl = searchParams.get("tonight") === "1";
  const exploreMode: ExploreMode = modeFromUrl === "swipe" ? "swipe" : "map";

  const [events, setEvents] = useState<Event[]>([]);
  const [dbCourts, setDbCourts] = useState<Court[]>([]);
  const [mapBounds, setMapBounds] = useState<BoundingBox | null>(null);
  const [searchedBounds, setSearchedBounds] = useState<BoundingBox | null>(null);
  const [loading, setLoading] = useState(true);
  const [sportFilter, setSportFilter] = useState(sportFromUrl);
  const [searchQuery, setSearchQuery] = useState(searchFromUrl);
  const [tonightOnly, setTonightOnly] = useState(tonightFromUrl);
  const [activeView, setActiveView] = useState<SwipeTab>("events");
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [sortByDistance, setSortByDistance] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [selectedMarkerType, setSelectedMarkerType] = useState<"event" | "court" | null>(null);
  const [swipeDecks, setSwipeDecks] = useState(() => createInitialSwipeDecks());
  const [joiningEventId, setJoiningEventId] = useState<string | null>(null);
  const [swipeError, setSwipeError] = useState<string | null>(null);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchFromUrl);
  const hasAttemptedAutoLocation = useRef(false);
  const hasAutoInitialAreaSearch = useRef(false);
  const currentUserIdRef = useRef<string | null>(null);
  const eventRowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const courtRowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const { osmCourts, loading: osmLoading } = useOsmCourts(
    searchedBounds,
    sportFilter,
    activeView === "courts"
  );

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;
    async function fetchUserId() {
      const supabase = createClient();
      const userId = await getCurrentUserId(supabase);
      if (!isCancelled) {
        currentUserIdRef.current = userId;
        setCurrentUserId(userId);
      }
    }
    fetchUserId();
    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const setExploreMode = useCallback(
    (nextMode: ExploreMode) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.set("mode", nextMode);
      const query = nextParams.toString();

      router.replace(query ? `/events?${query}` : "/events", { scroll: false });
    },
    [router, searchParams]
  );

  const handleTonightChange = useCallback(
    (nextValue: boolean) => {
      setTonightOnly(nextValue);
      const nextParams = new URLSearchParams(searchParams.toString());
      if (nextValue) {
        nextParams.set("tonight", "1");
      } else {
        nextParams.delete("tonight");
      }
      const query = nextParams.toString();
      router.push(query ? `/events?${query}` : "/events", { scroll: false });
    },
    [router, searchParams]
  );

  const handleGetLocation = useCallback(() => {
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
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        setUserLocation(location);
        setLocationStatus("success");
        setSortByDistance(true);
        hasAutoInitialAreaSearch.current = true;
        const nearMeBounds = buildNearMeBounds(location);
        setSearchedBounds((previous) => {
          if (previous && areBoundsEqual(previous, nearMeBounds)) {
            return previous;
          }

          return nearMeBounds;
        });

        if (position.coords.accuracy < 100) {
          navigator.geolocation.clearWatch(watchId);
        }
      },
      () => {
        setLocationStatus("error");
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );

    const stopTimer = setTimeout(() => {
      navigator.geolocation.clearWatch(watchId);
      setLocationStatus((current) => (current === "loading" ? "error" : current));
    }, 15000);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      clearTimeout(stopTimer);
    };
  }, [locationStatus]);

  const handleActiveViewChange = useCallback(
    (view: SwipeTab) => {
      setActiveView(view);
      setSelectedMarkerId(null);
      setSelectedMarkerType(null);
      setSwipeError(null);

      if (view !== "courts") {
        return;
      }

      if (userLocation) {
        const nearMeBounds = buildNearMeBounds(userLocation);
        setSearchedBounds((previous) => {
          if (previous && areBoundsEqual(previous, nearMeBounds)) {
            return previous;
          }

          return nearMeBounds;
        });
        return;
      }

      if (mapBounds) {
        setSearchedBounds((previous) => {
          if (previous && areBoundsEqual(previous, mapBounds)) {
            return previous;
          }

          return { ...mapBounds };
        });
      }
    },
    [mapBounds, userLocation]
  );

  useEffect(() => {
    let isCancelled = false;

    async function fetchData() {
      setLoading(true);
      const supabase = createClient();

      const eventsPromise = searchedBounds
        ? getUpcomingEventsWithMetadata(supabase, sportFilter, searchedBounds, currentUserIdRef.current)
        : Promise.resolve<EventWithMetadata[]>([]);

      const [eventsData, courtsData]: [EventWithMetadata[], Court[]] = await Promise.all([
        eventsPromise,
        getApprovedCourts(supabase, sportFilter, searchedBounds),
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
  }, [searchedBounds, sportFilter]);

  useEffect(() => {
    if (hasAttemptedAutoLocation.current) return;
    hasAttemptedAutoLocation.current = true;

    if (!navigator.geolocation) {
      window.setTimeout(() => setLocationStatus("error"), 0);
      return;
    }

    window.setTimeout(() => setLocationStatus("loading"), 0);
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        setUserLocation(location);
        setLocationStatus("success");
        setSortByDistance(true);
        hasAutoInitialAreaSearch.current = true;
        const nearMeBounds = buildNearMeBounds(location);
        setSearchedBounds((previous) => {
          if (previous && areBoundsEqual(previous, nearMeBounds)) {
            return previous;
          }

          return nearMeBounds;
        });

        if (position.coords.accuracy < 100) {
          navigator.geolocation.clearWatch(watchId);
        }
      },
      () => {
        setLocationStatus("error");
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );

    const stopTimer = setTimeout(() => {
      navigator.geolocation.clearWatch(watchId);
      setLocationStatus((current) => (current === "loading" ? "error" : current));
    }, 15000);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      clearTimeout(stopTimer);
    };
  }, []);

  const filteredEvents = useMemo(() => {
    if (!searchedBounds) return [];

    let result = events.map((event) => {
      if (userLocation && event.latitude != null && event.longitude != null) {
        return {
          ...event,
          distance: haversineDistance(
            userLocation.lat,
            userLocation.lng,
            event.latitude,
            event.longitude
          ),
        };
      }

      return { ...event, distance: undefined };
    });

    result = result.filter((event) => {
      if (event.latitude == null || event.longitude == null) return false;
      return isPointInBounds(event.latitude, event.longitude, searchedBounds);
    });

    if (debouncedSearchQuery.trim()) {
      const queryLower = debouncedSearchQuery.toLowerCase();
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
      result.sort((left, right) => {
        if (left.distance === undefined && right.distance === undefined) return 0;
        if (left.distance === undefined) return 1;
        if (right.distance === undefined) return -1;
        return left.distance - right.distance;
      });
    }

    return result;
  }, [events, debouncedSearchQuery, searchedBounds, sortByDistance, userLocation]);

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

    result = result.filter((court) => isPointInBounds(court.latitude, court.longitude, searchedBounds));

    if (debouncedSearchQuery.trim()) {
      const queryLower = debouncedSearchQuery.toLowerCase();
      result = result.filter(
        (court) =>
          court.name.toLowerCase().includes(queryLower) ||
          court.address.toLowerCase().includes(queryLower) ||
          court.sport_types.some((sport) => sport.toLowerCase().includes(queryLower))
      );
    }

    if (sortByDistance && userLocation) {
      result.sort((left, right) => {
        if (left.distance === undefined && right.distance === undefined) return 0;
        if (left.distance === undefined) return 1;
        if (right.distance === undefined) return -1;
        return left.distance - right.distance;
      });
    }

    return result;
  }, [mergedCourts, debouncedSearchQuery, searchedBounds, sortByDistance, userLocation]);

  const rankedSwipeEvents = useMemo(
    () => rankSwipeEvents(filteredEvents, currentUserId),
    [currentUserId, filteredEvents]
  );
  const rankedSwipeCourts = useMemo(() => rankSwipeCourts(filteredCourts), [filteredCourts]);

  const visibleSwipeEvents = useMemo(
    () => getVisibleSwipeItems(rankedSwipeEvents, swipeDecks.events.dismissedIds),
    [rankedSwipeEvents, swipeDecks.events.dismissedIds]
  );
  const visibleSwipeCourts = useMemo(
    () => getVisibleSwipeItems(rankedSwipeCourts, swipeDecks.courts.dismissedIds),
    [rankedSwipeCourts, swipeDecks.courts.dismissedIds]
  );

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
  }, [activeView, selectedMarkerId, selectedMarkerType]);

  const selectedEvent =
    selectedMarkerType === "event"
      ? filteredEvents.find((event) => event.id === selectedMarkerId)
      : undefined;
  const selectedCourt =
    selectedMarkerType === "court"
      ? filteredCourts.find((court) => court.id === selectedMarkerId)
      : undefined;
  const mapLat = selectedEvent?.latitude ?? selectedCourt?.latitude ?? userLocation?.lat ?? 39.8283;
  const mapLng =
    selectedEvent?.longitude ?? selectedCourt?.longitude ?? userLocation?.lng ?? -98.5795;
  const mapCenter: [number, number] = [mapLat, mapLng];
  const mapZoom = userLocation ? 14 : 4;
  const hasActiveAreaSearch = searchedBounds !== null;
  const showSearchAreaButton = mapBounds !== null;
  const activeCount = activeView === "events" ? filteredEvents.length : filteredCourts.length;
  const canShowGameCount = hasActiveAreaSearch && !loading;
  const canShowCourtCount = hasActiveAreaSearch && !loading && !osmLoading;

  const currentEventSwipeIndex = clampSwipeIndex(swipeDecks.events.currentIndex, visibleSwipeEvents.length);
  const currentCourtSwipeIndex = clampSwipeIndex(swipeDecks.courts.currentIndex, visibleSwipeCourts.length);
  const currentSwipeEvent = visibleSwipeEvents[currentEventSwipeIndex] ?? null;
  const currentSwipeCourt = visibleSwipeCourts[currentCourtSwipeIndex] ?? null;
  const activeSwipeItems = activeView === "events" ? visibleSwipeEvents : visibleSwipeCourts;
  const activeSwipeIndex = activeView === "events" ? currentEventSwipeIndex : currentCourtSwipeIndex;
  const hasPreviousSwipeItem = activeSwipeIndex > 0;
  const hasNextSwipeItem = activeSwipeIndex < activeSwipeItems.length - 1;

  const primaryActionLabel =
    activeView === "courts"
      ? "View Court"
      : currentSwipeEvent && currentUserId && !isSwipeJoinable(currentSwipeEvent, currentUserId)
      ? "View Details"
      : "Join Session";

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
    setSwipeError(null);
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

  const handleSwipePrevious = useCallback(() => {
    setSwipeDecks((previous) => {
      const deck = previous[activeView];
      const nextIndex = clampSwipeIndex(deck.currentIndex - 1, activeSwipeItems.length);

      if (nextIndex === deck.currentIndex) {
        return previous;
      }

      return {
        ...previous,
        [activeView]: { ...deck, currentIndex: nextIndex },
      };
    });
  }, [activeSwipeItems.length, activeView]);

  const handleSwipeNext = useCallback(() => {
    setSwipeDecks((previous) => {
      const deck = previous[activeView];
      const nextIndex = clampSwipeIndex(deck.currentIndex + 1, activeSwipeItems.length);

      if (nextIndex === deck.currentIndex) {
        return previous;
      }

      return {
        ...previous,
        [activeView]: { ...deck, currentIndex: nextIndex },
      };
    });
  }, [activeSwipeItems.length, activeView]);

  const handleSkipCurrentSuggestion = useCallback(() => {
    const currentItemId =
      activeView === "events" ? currentSwipeEvent?.id ?? null : currentSwipeCourt?.id ?? null;

    if (!currentItemId) {
      return;
    }

    setSwipeDecks((previous) => ({
      ...previous,
      [activeView]: dismissSwipeDeckItem(previous[activeView], currentItemId, activeSwipeItems.length),
    }));
    setSwipeError(null);
  }, [activeSwipeItems.length, activeView, currentSwipeCourt?.id, currentSwipeEvent?.id]);

  const handleResetSuggestions = useCallback(() => {
    setSwipeDecks((previous) => ({
      ...previous,
      [activeView]: {
        currentIndex: 0,
        dismissedIds: new Set<string>(),
      },
    }));
    setSwipeError(null);
  }, [activeView]);

  const handlePrimarySwipeAction = useCallback(async () => {
    if (activeView === "courts") {
      if (currentSwipeCourt) {
        router.push(`/courts/${currentSwipeCourt.id}`);
      }
      return;
    }

    if (!currentSwipeEvent) {
      return;
    }

    if (currentUserId && !isSwipeJoinable(currentSwipeEvent, currentUserId)) {
      router.push(`/events/${currentSwipeEvent.id}`);
      return;
    }

    setSwipeError(null);

    if (!currentUserId) {
      router.push(buildLoginRedirectUrl());
      return;
    }

    setJoiningEventId(currentSwipeEvent.id);
    const supabase = createClient();
    const result = await joinEvent(supabase, currentSwipeEvent.id);

    if (result.requiresAuth) {
      setJoiningEventId(null);
      router.push(buildLoginRedirectUrl());
      return;
    }

    if (result.error || !result.participant) {
      setSwipeError(result.error || "Failed to join event.");
      setJoiningEventId(null);
      return;
    }

    setCurrentUserId((previous) => previous ?? result.userId);
    setEvents((previous) =>
      previous.map((event) =>
        event.id === currentSwipeEvent.id
          ? {
              ...event,
              participant_count: event.participant_count + 1,
              is_joined_by_current_user: true,
            }
          : event
      )
    );
    setSwipeDecks((previous) => ({
      ...previous,
      events: dismissSwipeDeckItem(previous.events, currentSwipeEvent.id, visibleSwipeEvents.length),
    }));
    setJoiningEventId(null);
  }, [
    activeView,
    currentSwipeCourt,
    currentSwipeEvent,
    currentUserId,
    router,
    visibleSwipeEvents.length,
  ]);

  if (exploreMode === "swipe") {
    return (
      <ExploreSwipeView
        loading={loading || (activeView === "courts" && osmLoading)}
        activeView={activeView}
        currentEvent={currentSwipeEvent}
        currentCourt={currentSwipeCourt}
        hasPrevious={hasPreviousSwipeItem}
        hasNext={hasNextSwipeItem}
        primaryActionLabel={primaryActionLabel}
        primaryActionLoading={joiningEventId === currentSwipeEvent?.id}
        primaryActionDisabled={
          activeView === "events"
            ? !currentSwipeEvent || joiningEventId === currentSwipeEvent.id
            : !currentSwipeCourt
        }
        error={swipeError}
        hasActiveAreaSearch={hasActiveAreaSearch}
        onActiveViewChange={handleActiveViewChange}
        onPrevious={handleSwipePrevious}
        onNext={handleSwipeNext}
        onSkip={handleSkipCurrentSuggestion}
        onPrimaryAction={handlePrimarySwipeAction}
        onResetSuggestions={handleResetSuggestions}
        onOpenMapView={() => setExploreMode("map")}
      />
    );
  }

  return (
    <div className="flex h-[calc(100dvh-56px)] flex-col overflow-hidden">
      <ExploreMapView
        loading={loading}
        osmLoading={osmLoading}
        searchQuery={searchQuery}
        sportFilter={sportFilter}
        sportFilters={SPORT_FILTERS}
        locationStatus={locationStatus}
        activeView={activeView}
        filteredEvents={filteredEvents}
        filteredCourts={filteredCourts}
        currentUserId={currentUserId}
        userLocation={userLocation}
        mapCenter={mapCenter}
        mapZoom={mapZoom}
        selectedMarkerId={selectedMarkerId}
        selectedMarkerType={selectedMarkerType}
        hasActiveAreaSearch={hasActiveAreaSearch}
        showSearchAreaButton={showSearchAreaButton}
        canShowGameCount={canShowGameCount}
        canShowCourtCount={canShowCourtCount}
        activeCount={activeCount}
        eventRowRefs={eventRowRefs}
        courtRowRefs={courtRowRefs}
        tonightOnly={tonightOnly}
        onTonightChange={handleTonightChange}
        onSearchQueryChange={setSearchQuery}
        onSportFilterChange={setSportFilter}
        onGetLocation={handleGetLocation}
        onActiveViewChange={handleActiveViewChange}
        onSidebarClick={handleSidebarClick}
        onMarkerClick={handleMarkerClick}
        onSearchThisArea={handleSearchThisArea}
        onMapBoundsChange={handleMapBoundsChange}
        onOpenSwipeView={() => setExploreMode("swipe")}
      />
    </div>
  );
}
