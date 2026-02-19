"use client";

import dynamic from "next/dynamic";
import type { BoundingBox, DisplayCourt } from "@/features/courts/types";
import type { EventWithMetadata } from "@/lib/queries/events";

type ExploreEvent = EventWithMetadata & {
  distance?: number;
};

type MapDynamicProps = {
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

const ExploreMap = dynamic(() => import("@/components/map/ExploreMap"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-zinc-100 animate-pulse">
      <div className="h-full w-full bg-gradient-to-br from-zinc-100 via-zinc-200 to-zinc-100" />
    </div>
  ),
});

export default function MapDynamic(props: MapDynamicProps) {
  return <ExploreMap {...props} />;
}
