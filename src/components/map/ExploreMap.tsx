"use client";

import { useEffect, useRef } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { BoundingBox, DisplayCourt } from "@/features/courts/types";
import type { EventWithMetadata } from "@/lib/queries/events";

type ExploreEvent = EventWithMetadata & {
  distance?: number;
};

type ExploreMapProps = {
  events: ExploreEvent[];
  courts: DisplayCourt[];
  userLocation: { lat: number; lng: number } | null;
  center: [number, number];
  zoom: number;
  selectedId: string | null;
  onMarkerClick: (id: string) => void;
  activeView: "events" | "courts";
  onBoundsChange?: (bounds: BoundingBox) => void;
};

const eventIcon = L.divIcon({
  className: "custom-event-marker-default",
  html: `<div style="width:32px;height:32px;border-radius:9999px;background:#a1a1aa;border:2px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.2);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

const eventSelectedIcon = L.divIcon({
  className: "custom-event-marker-selected",
  html: `<div style="width:32px;height:32px;border-radius:9999px;background:#f97316;border:2px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.2);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

const courtIcon = L.divIcon({
  className: "custom-court-marker-default",
  html: `<div style="width:32px;height:32px;border-radius:9999px;background:#a1a1aa;border:2px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.25);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10.5c0 7.142-9 11.25-9 11.25S3 17.642 3 10.5a9 9 0 1 1 18 0Z"></path><circle cx="12" cy="10.5" r="3"></circle></svg></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

const courtSelectedIcon = L.divIcon({
  className: "custom-court-marker-selected",
  html: `<div style="width:32px;height:32px;border-radius:9999px;background:#f97316;border:2px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.25);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10.5c0 7.142-9 11.25-9 11.25S3 17.642 3 10.5a9 9 0 1 1 18 0Z"></path><circle cx="12" cy="10.5" r="3"></circle></svg></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

const userIcon = L.divIcon({
  className: "custom-user-marker",
  html: `<span style="position:relative;display:block;width:16px;height:16px;"><style>@keyframes matup-user-pulse{0%{transform:scale(1);opacity:.9;}70%{transform:scale(2);opacity:0;}100%{transform:scale(2);opacity:0;}}</style><span style="position:absolute;inset:0;border-radius:9999px;background:rgba(59,130,246,.45);animation:matup-user-pulse 1.6s ease-out infinite;"></span><span style="position:absolute;inset:0;border-radius:9999px;background:#3b82f6;border:2px solid #fff;"></span></span>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -8],
});

function FlyTo({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  const previousRef = useRef<{ lat: number; lng: number; zoom: number } | null>(null);

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

    if (!movedEnough) {
      return;
    }

    previousRef.current = { lat, lng, zoom };
    map.flyTo([lat, lng], zoom, { duration: 0.8 });
  }, [map, center, zoom]);

  return null;
}

function BoundsTracker({ onBoundsChange }: { onBoundsChange: (bounds: BoundingBox) => void }) {
  const map = useMap();

  useEffect(() => {
    function handleMoveEnd() {
      const bounds = map.getBounds();
      onBoundsChange({
        south: bounds.getSouth(),
        west: bounds.getWest(),
        north: bounds.getNorth(),
        east: bounds.getEast(),
      });
    }

    map.on("moveend", handleMoveEnd);
    handleMoveEnd();

    return () => {
      map.off("moveend", handleMoveEnd);
    };
  }, [map, onBoundsChange]);

  return null;
}

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
  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom className="absolute inset-0 h-full w-full z-0">
      <FlyTo center={center} zoom={zoom} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {onBoundsChange ? <BoundsTracker onBoundsChange={onBoundsChange} /> : null}

      {activeView === "events" &&
        events
          .filter((event) => event.latitude !== null && event.longitude !== null)
          .map((event) => (
            <Marker
              key={event.id}
              position={[event.latitude as number, event.longitude as number]}
              icon={selectedId === event.id ? eventSelectedIcon : eventIcon}
              opacity={selectedId && selectedId !== event.id ? 0.85 : 1}
              zIndexOffset={selectedId === event.id ? 1000 : 0}
              eventHandlers={{
                click: () => onMarkerClick(event.id),
              }}
            />
          ))}

      {activeView === "courts" &&
        courts.map((court) => (
          <Marker
            key={court.id}
            position={[court.latitude, court.longitude]}
            icon={selectedId === court.id ? courtSelectedIcon : courtIcon}
            opacity={selectedId && selectedId !== court.id ? 0.85 : 1}
            zIndexOffset={selectedId === court.id ? 1000 : 0}
            eventHandlers={{
              click: () => onMarkerClick(court.id),
            }}
          />
        ))}

      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon} zIndexOffset={1200} />
      )}
    </MapContainer>
  );
}
