"use client";

import { useEffect, useRef, useState } from "react";
import { getApiBaseUrl } from "@/lib/api";
import type { BoundingBox, OsmCourt } from "@/features/courts/types";

const MIN_BOUNDS_DELTA = 0.01;
const MAX_BOUNDS_SPAN = 0.5;
const FETCH_DEBOUNCE_MS = 800;

function hasBoundsMovedEnough(previous: BoundingBox | null, next: BoundingBox): boolean {
  if (!previous) return true;

  return (
    Math.abs(previous.south - next.south) > MIN_BOUNDS_DELTA ||
    Math.abs(previous.west - next.west) > MIN_BOUNDS_DELTA ||
    Math.abs(previous.north - next.north) > MIN_BOUNDS_DELTA ||
    Math.abs(previous.east - next.east) > MIN_BOUNDS_DELTA
  );
}

export function useOsmCourts(bounds: BoundingBox | null, sportFilter: string) {
  const [osmCourts, setOsmCourts] = useState<OsmCourt[]>([]);
  const [loading, setLoading] = useState(false);
  const previousBoundsRef = useRef<BoundingBox | null>(null);

  useEffect(() => {
    if (!bounds) {
      setOsmCourts([]);
      setLoading(false);
      return;
    }

    if (sportFilter && sportFilter !== "tennis" && sportFilter !== "pickleball") {
      setOsmCourts([]);
      setLoading(false);
      return;
    }

    const latSpan = Math.abs(bounds.north - bounds.south);
    const lonSpan = Math.abs(bounds.east - bounds.west);
    if (latSpan > MAX_BOUNDS_SPAN || lonSpan > MAX_BOUNDS_SPAN) {
      setOsmCourts([]);
      setLoading(false);
      return;
    }

    if (!hasBoundsMovedEnough(previousBoundsRef.current, bounds)) {
      return;
    }

    const abortController = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setLoading(true);
      try {
        const apiBaseUrl = getApiBaseUrl();
        const response = await fetch(
          `${apiBaseUrl}/api/courts/osm?south=${bounds.south}&west=${bounds.west}&north=${bounds.north}&east=${bounds.east}`,
          {
            signal: abortController.signal,
          }
        );

        if (!response.ok) {
          setOsmCourts([]);
          return;
        }

        const payload = (await response.json()) as { courts?: OsmCourt[] };
        const nextCourts = (payload.courts || []).filter((court) =>
          sportFilter ? court.sport === sportFilter : true
        );
        setOsmCourts(nextCourts);
        previousBoundsRef.current = bounds;
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setOsmCourts([]);
        }
      } finally {
        setLoading(false);
      }
    }, FETCH_DEBOUNCE_MS);

    return () => {
      abortController.abort();
      window.clearTimeout(timeoutId);
    };
  }, [bounds, sportFilter]);

  return { osmCourts, loading };
}
