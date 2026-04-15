"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Map, { Marker, NavigationControl, type MapRef } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { BoundingBox, DisplayCourt } from "@/features/courts/types";
import type { EventWithMetadata } from "@/lib/queries/events";
import { formatShortAddress } from "@/lib/formatAddress";
import { getMapStyleUrl, hasConfiguredMapStyle } from "@/lib/map-config";
import { getSportEmoji } from "@/lib/share/sportEmojis";

type ExploreEvent = EventWithMetadata & {
  distance?: number;
};

type ExploreMapProps = {
  events: ExploreEvent[];
  courts: DisplayCourt[];
  userLocation: { lat: number; lng: number; accuracy?: number } | null;
  center: [number, number];
  zoom: number;
  selectedId: string | null;
  onMarkerClick: (id: string) => void;
  activeView: "events" | "courts";
  onBoundsChange?: (bounds: BoundingBox) => void;
};

type MarkerButtonProps = {
  accentClassName: string;
  emoji: string;
  subtitle: string;
  title: string;
  selected: boolean;
  onClick: () => void;
};

const MarkerButton = memo(function MarkerButton({
  accentClassName,
  emoji,
  subtitle,
  title,
  selected,
  onClick,
}: MarkerButtonProps) {
  if (selected) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="group rounded-full bg-zinc-950 pl-2 pr-3 py-2 text-left text-white shadow-[0_12px_30px_rgba(15,23,42,0.28)] ring-1 ring-white/15 transition-transform hover:scale-[1.02]"
      >
        <span className="flex items-center gap-2">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 text-lg ${accentClassName}`}
          >
            {emoji}
          </span>
          <span className="min-w-0">
            <span className="block text-[10px] uppercase tracking-[0.18em] text-zinc-400">
              {subtitle}
            </span>
            <span className="block max-w-44 truncate text-sm font-semibold">{title}</span>
          </span>
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-11 w-11 items-center justify-center rounded-full border border-white/80 text-lg shadow-[0_10px_24px_rgba(15,23,42,0.16)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,23,42,0.22)] ${accentClassName}`}
    >
      {emoji}
    </button>
  );
});

const UserLocationMarker = memo(function UserLocationMarker({ accuracy }: { accuracy?: number }) {
  return (
    <span className="relative flex h-4 w-4 items-center justify-center">
      {accuracy && accuracy > 200 && (
        <span
          className="absolute rounded-full bg-sky-400/10 border border-sky-400/20"
          style={{ width: `${Math.min(120, accuracy / 10)}px`, height: `${Math.min(120, accuracy / 10)}px` }}
        />
      )}
      <span className="absolute inline-flex h-full w-full rounded-full bg-sky-400/40 animate-ping" />
      <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-white bg-sky-500 shadow-[0_0_0_6px_rgba(14,165,233,0.16)]" />
    </span>
  );
});

export default function ExploreMap({
  events,
  courts,
  userLocation,
  center,
  zoom,
  selectedId,
  onMarkerClick,
  activeView,
  onBoundsChange,
}: ExploreMapProps) {
  const mapRef = useRef<MapRef | null>(null);
  const previousRef = useRef<{ lat: number; lng: number; zoom: number } | null>(null);
  const flyToTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const configuredStyle = useMemo(() => hasConfiguredMapStyle(), []);
  const styleUrl = useMemo(() => getMapStyleUrl(), []);

  const emitBoundsChange = useCallback(() => {
    if (!onBoundsChange || !mapRef.current) {
      return;
    }

    const bounds = mapRef.current.getBounds();
    if (!bounds) {
      return;
    }

    onBoundsChange({
      south: bounds.getSouth(),
      west: bounds.getWest(),
      north: bounds.getNorth(),
      east: bounds.getEast(),
    });
  }, [onBoundsChange]);

  useEffect(() => {
    const [lat, lng] = center;
    const previous = previousRef.current;

    if (!previous) {
      previousRef.current = { lat, lng, zoom };
      return;
    }

    const movedEnough =
      Math.abs(previous.lat - lat) > 0.00001 ||
      Math.abs(previous.lng - lng) > 0.00001 ||
      previous.zoom !== zoom;

    if (!movedEnough || !mapRef.current) {
      return;
    }

    if (flyToTimerRef.current) {
      clearTimeout(flyToTimerRef.current);
    }

    const map = mapRef.current.getMap();
    if (map) {
      map.stop();
    }

    previousRef.current = { lat, lng, zoom };

    flyToTimerRef.current = setTimeout(() => {
      flyToTimerRef.current = null;
      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [lng, lat],
          zoom,
          duration: 900,
          essential: true,
        });
      }
    }, 150);

    return () => {
      if (flyToTimerRef.current) {
        clearTimeout(flyToTimerRef.current);
        flyToTimerRef.current = null;
      }
    };
  }, [center, zoom]);

  if (mapError) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-100 gap-3">
        <div className="w-12 h-12 rounded-full bg-zinc-200 flex items-center justify-center">
          <svg className="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-zinc-700">Map unavailable</p>
        <p className="text-xs text-zinc-500 text-center max-w-48">The map tiles could not be loaded. Try refreshing the page.</p>
        <button
          type="button"
          onClick={() => { setMapError(null); }}
          className="px-4 py-2 rounded-full bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      <Map
        ref={mapRef}
        mapLib={maplibregl}
        initialViewState={{
          latitude: center[0],
          longitude: center[1],
          zoom,
        }}
        mapStyle={styleUrl}
        minZoom={2}
        maxZoom={18}
        reuseMaps
        attributionControl={false}
        scrollZoom
        dragRotate={false}
        onMoveEnd={emitBoundsChange}
        onLoad={emitBoundsChange}
        onError={(e) => {
          if (e.error?.message?.includes("Failed to fetch") || e.error?.message?.includes("CORS")) {
            setMapError(e.error.message);
          }
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="bottom-right" showCompass={false} />

        {activeView === "events" &&
          events
            .filter((event) => event.latitude !== null && event.longitude !== null)
            .map((event) => {
              const selected = selectedId === event.id;

              return (
                <Marker
                  key={event.id}
                  latitude={event.latitude as number}
                  longitude={event.longitude as number}
                  anchor="bottom"
                >
                  <MarkerButton
                    accentClassName={
                      selected
                        ? "bg-orange-500 text-white"
                        : "bg-white/95 text-zinc-900 ring-1 ring-zinc-200"
                    }
                    emoji={getSportEmoji(event.sport_type)}
                    subtitle={event.sport_type}
                    title={event.title}
                    selected={selected}
                    onClick={() => onMarkerClick(event.id)}
                  />
                </Marker>
              );
            })}

        {activeView === "courts" &&
          courts.map((court) => {
            const selected = selectedId === court.id;
            const subtitle = court.sport_types.slice(0, 2).join(" / ") || "Court";

            return (
              <Marker key={court.id} latitude={court.latitude} longitude={court.longitude} anchor="bottom">
                <MarkerButton
                  accentClassName={
                    selected
                      ? "bg-emerald-500 text-white"
                      : "bg-white/95 text-zinc-900 ring-1 ring-zinc-200"
                  }
                  emoji={getSportEmoji(court.sport_types[0] || "other")}
                  subtitle={subtitle}
                  title={court.name || formatShortAddress(court.address)}
                  selected={selected}
                  onClick={() => onMarkerClick(court.id)}
                />
              </Marker>
            );
          })}

        {userLocation ? (
          <Marker latitude={userLocation.lat} longitude={userLocation.lng} anchor="center">
            <UserLocationMarker accuracy={userLocation.accuracy} />
          </Marker>
        ) : null}
      </Map>

      {!configuredStyle ? (
        <div className="pointer-events-none absolute left-4 top-4 z-10 max-w-64 rounded-2xl bg-white/92 px-3 py-2 text-xs text-zinc-600 shadow-lg ring-1 ring-zinc-200 backdrop-blur">
          Using the demo MapLibre style. Set <code>NEXT_PUBLIC_MAP_STYLE_URL</code> for your production map style.
        </div>
      ) : null}
    </div>
  );
}
