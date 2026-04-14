const DEV_FALLBACK_STYLE_URL = "https://demotiles.maplibre.org/style.json";
const CONFIGURED_STYLE_URL = process.env.NEXT_PUBLIC_MAP_STYLE_URL?.trim() || "";

export function getMapStyleUrl(): string {
  if (CONFIGURED_STYLE_URL) {
    return CONFIGURED_STYLE_URL;
  }

  return DEV_FALLBACK_STYLE_URL;
}

export function hasConfiguredMapStyle(): boolean {
  return CONFIGURED_STYLE_URL.length > 0;
}
