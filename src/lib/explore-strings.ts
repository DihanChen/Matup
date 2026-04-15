/**
 * User-visible strings for the events / explore experience.
 * Keep names stable — referenced by helpers in
 * src/features/events/utils/ and components in
 * src/features/events/components/.
 */

export const TONIGHT_FILTER_LABEL = "Join tonight";
export const TONIGHT_EMPTY_TITLE = "No events tonight";
export const TONIGHT_EMPTY_DESCRIPTION = "Check back later or browse all events.";

// Context-aware empty-state copy (T-20260414-15)
export const EMPTY_TONIGHT_TITLE = "Nothing tonight with open spots";
export const EMPTY_TONIGHT_DESC = "Check back later or browse all events.";
export const EMPTY_SEARCH_DESC = "Check your spelling or try a broader term.";
export const EMPTY_SPORT_TITLE = "No events for this sport";
export const EMPTY_SPORT_DESC = "Try a different sport or zoom out on the map.";
export const EMPTY_DEFAULT_TITLE = "No events nearby";
export const EMPTY_DEFAULT_DESC = "Try moving the map or adjusting the distance slider.";

// Action labels for empty-state CTAs
export const EMPTY_ACTION_SHOW_ALL = "Show all events";
export const EMPTY_ACTION_CLEAR_SEARCH = "Clear search";
export const EMPTY_ACTION_ALL_SPORTS = "All sports";
export const EMPTY_ACTION_CREATE_EVENT = "Create an event";
