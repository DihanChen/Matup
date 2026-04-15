"use client";

import Link from "next/link";
import { useMemo, type MutableRefObject } from "react";
import CourtCard from "@/components/CourtCard";
import EventCard from "@/components/EventCard";
import MapDynamic from "@/components/map/MapDynamic";
import type { BoundingBox, DisplayCourt } from "@/features/courts/types";
import type { ExploreEvent, SwipeTab } from "@/features/events/lib/exploreSwipe";
import {
  TONIGHT_EMPTY_DESCRIPTION,
  TONIGHT_EMPTY_TITLE,
  TONIGHT_FILTER_LABEL,
} from "@/lib/explore-strings";

/**
 * Mirrors the mobile T-08 helper: returns true when the event is today
 * (in local time) and still has open spots. The mobile spec uses
 * `starts_at` / `current_participants`; the web data layer uses
 * `datetime` / `participant_count` so we accept either shape.
 */
export function isTonightWithOpenSpots(event: {
  starts_at?: string;
  datetime?: string;
  max_participants?: number | null;
  current_participants?: number | null;
  participant_count?: number | null;
}): boolean {
  const now = new Date();
  const todayYear = now.getFullYear();
  const todayMonth = now.getMonth();
  const todayDate = now.getDate();
  const startsAt = event.starts_at ?? event.datetime;
  if (!startsAt) return false;
  const eventDate = new Date(startsAt);
  const isSameDay =
    eventDate.getFullYear() === todayYear &&
    eventDate.getMonth() === todayMonth &&
    eventDate.getDate() === todayDate;
  if (!isSameDay) return false;
  if (event.max_participants == null) return true;
  const currentCount = event.current_participants ?? event.participant_count ?? 0;
  return currentCount < event.max_participants;
}

type SportFilterOption = {
  value: string;
  label: string;
};

type Props = {
  loading: boolean;
  osmLoading: boolean;
  searchQuery: string;
  sportFilter: string;
  sportFilters: SportFilterOption[];
  locationStatus: "idle" | "loading" | "success" | "error";
  activeView: SwipeTab;
  filteredEvents: ExploreEvent[];
  filteredCourts: DisplayCourt[];
  currentUserId: string | null;
  userLocation: { lat: number; lng: number; accuracy?: number } | null;
  mapCenter: [number, number];
  mapZoom: number;
  selectedMarkerId: string | null;
  selectedMarkerType: "event" | "court" | null;
  hasActiveAreaSearch: boolean;
  showSearchAreaButton: boolean;
  canShowGameCount: boolean;
  canShowCourtCount: boolean;
  activeCount: number;
  eventRowRefs: MutableRefObject<Record<string, HTMLDivElement | null>>;
  courtRowRefs: MutableRefObject<Record<string, HTMLDivElement | null>>;
  tonightOnly: boolean;
  onTonightChange: (next: boolean) => void;
  onSearchQueryChange: (value: string) => void;
  onSportFilterChange: (value: string) => void;
  onGetLocation: () => void;
  onActiveViewChange: (view: SwipeTab) => void;
  onSidebarClick: (id: string, type: "event" | "court") => void;
  onMarkerClick: (id: string) => void;
  onSearchThisArea: () => void;
  onMapBoundsChange: (bounds: BoundingBox) => void;
  onOpenSwipeView: () => void;
};

export default function ExploreMapView({
  loading,
  osmLoading,
  searchQuery,
  sportFilter,
  sportFilters,
  locationStatus,
  activeView,
  filteredEvents,
  filteredCourts,
  currentUserId,
  userLocation,
  mapCenter,
  mapZoom,
  selectedMarkerId,
  selectedMarkerType,
  hasActiveAreaSearch,
  showSearchAreaButton,
  canShowGameCount,
  canShowCourtCount,
  activeCount,
  eventRowRefs,
  courtRowRefs,
  tonightOnly,
  onTonightChange,
  onSearchQueryChange,
  onSportFilterChange,
  onGetLocation,
  onActiveViewChange,
  onSidebarClick,
  onMarkerClick,
  onSearchThisArea,
  onMapBoundsChange,
  onOpenSwipeView,
}: Props) {
  const visibleEvents = useMemo(
    () => (tonightOnly ? filteredEvents.filter(isTonightWithOpenSpots) : filteredEvents),
    [filteredEvents, tonightOnly]
  );
  const displayedCount = activeView === "events" ? visibleEvents.length : activeCount;

  return (
    <div className="flex-1 flex min-h-0 flex-col lg:flex-row">
      <aside className="w-full lg:w-96 flex-[2] lg:flex-none bg-white border-t lg:border-t-0 lg:border-r border-zinc-200 flex flex-col overflow-hidden min-h-0">
        <div className="px-5 pt-3 lg:pt-8 pb-0 flex-shrink-0">
          <div className="mb-5 hidden lg:block">
            <h1 className="text-3xl font-bold text-zinc-900">Nearby</h1>
            <p className="text-zinc-400 text-sm mt-1">
              {loading
                ? "Searching..."
                : hasActiveAreaSearch
                ? `Found ${displayedCount} results in this area`
                : "Move the map and search this area"}
            </p>
          </div>

          <div className="relative mb-2 lg:mb-4">
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
              onChange={(event) => onSearchQueryChange(event.target.value)}
              placeholder="Search sport, venue, host..."
              className="w-full pl-12 pr-4 py-3 rounded-full bg-zinc-100 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:bg-white transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 pb-2 lg:pb-3">
            <button
              type="button"
              onClick={() => onTonightChange(!tonightOnly)}
              aria-pressed={tonightOnly}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                tonightOnly
                  ? "bg-orange-500 text-white border-orange-500"
                  : "bg-white text-gray-700 border-gray-300 hover:border-orange-300"
              }`}
            >
              {TONIGHT_FILTER_LABEL}
            </button>
          </div>

          <div className="flex items-center gap-2 pb-2 lg:pb-4">
            <div className="relative flex-1">
              <select
                value={sportFilter}
                onChange={(event) => onSportFilterChange(event.target.value)}
                className="w-full appearance-none px-4 py-2.5 pr-10 rounded-full text-sm font-medium bg-zinc-100 text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:bg-white cursor-pointer"
              >
                {sportFilters.map((sport) => (
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
              onClick={onGetLocation}
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

          <div className="pb-2 lg:pb-4">
            <div className="bg-zinc-100 rounded-full p-1 flex gap-1">
              <button
                onClick={() => onActiveViewChange("events")}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ease-in-out ${
                  activeView === "events"
                    ? "flex-[2] bg-zinc-900 text-white"
                    : "flex-1 bg-zinc-100 text-zinc-500"
                }`}
              >
                Games
              </button>
              <button
                onClick={() => onActiveViewChange("courts")}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ease-in-out ${
                  activeView === "courts"
                    ? "flex-[2] bg-zinc-900 text-white"
                    : "flex-1 bg-zinc-100 text-zinc-500"
                }`}
              >
                Courts
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4 scrollbar-hide">
          {loading ? (
            [1, 2, 3].map((item) => (
              <div key={item} className="rounded-xl border border-zinc-200 animate-pulse overflow-hidden">
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
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-zinc-900 mb-1">Search this area</p>
              <p className="text-xs text-zinc-400">Pan or zoom the map, then tap &quot;Search this area&quot;.</p>
            </div>
          ) : activeView === "events" ? (
            visibleEvents.length === 0 ? (
              tonightOnly ? (
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
                  <p className="text-sm font-medium text-zinc-900 mb-1">{TONIGHT_EMPTY_TITLE}</p>
                  <p className="text-xs text-zinc-400 mb-4">{TONIGHT_EMPTY_DESCRIPTION}</p>
                </div>
              ) : (
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
                  <p className="text-sm font-medium text-zinc-900 mb-1">No games found</p>
                  <p className="text-xs text-zinc-400 mb-4">
                    {searchQuery
                      ? "Try a different search"
                      : "Try a different sport or create the first one."}
                  </p>
                  <Link
                    href="/events/create"
                    className="inline-block px-4 py-2 bg-zinc-900 text-white rounded-full text-sm font-medium hover:bg-zinc-800"
                  >
                    Create Event
                  </Link>
                </div>
              )
            ) : (
              visibleEvents.map((event) => (
                <div
                  key={event.id}
                  ref={(node) => {
                    eventRowRefs.current[event.id] = node;
                  }}
                  onClick={() => onSidebarClick(event.id, "event")}
                  className={`rounded-xl ${
                    selectedMarkerType === "event" && selectedMarkerId === event.id
                      ? "ring-2 ring-orange-500"
                      : ""
                  }`}
                >
                  <EventCard
                    event={event}
                    currentUserId={currentUserId}
                    isJoined={event.is_joined_by_current_user}
                  />
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
                  onSelect={(id) => onSidebarClick(id, "court")}
                  isSelected={selectedMarkerType === "court" && selectedMarkerId === court.id}
                />
              </div>
            ))
          )}
        </div>
      </aside>

      <div className="relative flex-[3] lg:h-auto lg:flex-1 order-first lg:order-none min-h-0">
        <MapDynamic
          events={visibleEvents}
          courts={filteredCourts}
          userLocation={userLocation}
          center={mapCenter}
          zoom={mapZoom}
          selectedId={selectedMarkerId}
          onMarkerClick={onMarkerClick}
          activeView={activeView}
          onBoundsChange={onMapBoundsChange}
        />
        {showSearchAreaButton ? (
          <div className="pointer-events-none absolute left-1/2 top-3 z-[500] -translate-x-1/2">
            <button
              type="button"
              onClick={onSearchThisArea}
              disabled={loading || osmLoading}
              className="pointer-events-auto rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-lg ring-1 ring-zinc-200 transition hover:bg-zinc-50 disabled:opacity-60"
            >
              {osmLoading ? "Searching..." : "Search this area"}
            </button>
          </div>
        ) : null}
        <div className="pointer-events-none absolute bottom-5 left-5 z-[500]">
          <button
            type="button"
            onClick={onOpenSwipeView}
            className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-semibold text-zinc-900 shadow-lg ring-1 ring-zinc-200 transition hover:bg-zinc-50"
          >
            <svg className="h-4 w-4 text-zinc-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M13.28 7.22a.75.75 0 0 1 1.06 0l2.25 2.25a.75.75 0 0 1 0 1.06l-2.25 2.25a.75.75 0 1 1-1.06-1.06l.97-.97H6.5a.75.75 0 0 1 0-1.5h7.75l-.97-.97a.75.75 0 0 1 0-1.06Zm-6.56 0a.75.75 0 0 1 0 1.06l-.97.97H13.5a.75.75 0 0 1 0 1.5H5.75l.97.97a.75.75 0 0 1-1.06 1.06L3.41 10.53a.75.75 0 0 1 0-1.06l2.25-2.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
            </svg>
            Swipe View
          </button>
        </div>
      </div>
    </div>
  );
}
