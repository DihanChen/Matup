import type { EventDetailEvent } from "@/lib/queries/event-detail";

/** Escape RFC 5545 special characters in text values. */
function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/** Format a JS Date to ICS UTC timestamp: 20260414T120000Z */
function toIcsUtcTimestamp(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

/**
 * Generate a VCALENDAR/VEVENT string for the given event.
 *
 * - DTSTART / DTEND are derived from `event.datetime` + `event.duration` (minutes).
 *   If `duration` is 0 / null, a 2-hour default is applied.
 * - LOCATION is omitted when `event.location` is empty.
 * - DESCRIPTION includes the event description (if any) plus a deep link.
 */
export function generateEventIcsContent(event: EventDetailEvent): string {
  const startDate = new Date(event.datetime);
  const durationMinutes = event.duration && event.duration > 0 ? event.duration : 120;
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

  const dtStart = toIcsUtcTimestamp(startDate);
  const dtEnd = toIcsUtcTimestamp(endDate);

  const deepLink = `https://matup.app/events/${event.id}`;
  const descriptionParts: string[] = [];
  if (event.description) {
    descriptionParts.push(escapeIcsText(event.description));
  }
  descriptionParts.push(escapeIcsText(deepLink));
  const description = descriptionParts.join("\\n\\n");

  const location = event.location_name
    ? event.location_name
    : event.location
      ? event.location
      : null;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MatUp//Event//EN",
    "BEGIN:VEVENT",
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    location ? `LOCATION:${escapeIcsText(location)}` : null,
    `DESCRIPTION:${description}`,
    `UID:event-${event.id}@matup`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter((line): line is string => line !== null);

  return lines.join("\r\n");
}

/**
 * Trigger a browser download of `event-title.ics` for the given event.
 * Safe to call only in a browser context (Client Component or click handler).
 */
export function downloadEventIcs(event: EventDetailEvent): void {
  const content = generateEventIcsContent(event);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const slug = event.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
  link.download = `${slug || "event"}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
