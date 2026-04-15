// Self-hosted OSM raster style — works on all domains, no API key required.
// Used as fallback when NEXT_PUBLIC_MAP_STYLE_URL is not set.
const OSM_FALLBACK_STYLE_URL = "/map-style.json";
const CONFIGURED_STYLE_URL = process.env.NEXT_PUBLIC_MAP_STYLE_URL?.trim() || "";

export function getMapStyleUrl(): string {
  return CONFIGURED_STYLE_URL || OSM_FALLBACK_STYLE_URL;
}

export function hasConfiguredMapStyle(): boolean {
  return CONFIGURED_STYLE_URL.length > 0;
}
