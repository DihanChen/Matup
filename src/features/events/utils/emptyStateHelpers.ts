import {
  EMPTY_ACTION_ALL_SPORTS,
  EMPTY_ACTION_CLEAR_SEARCH,
  EMPTY_ACTION_CREATE_EVENT,
  EMPTY_ACTION_SHOW_ALL,
  EMPTY_DEFAULT_DESC,
  EMPTY_DEFAULT_TITLE,
  EMPTY_SEARCH_DESC,
  EMPTY_SPORT_DESC,
  EMPTY_SPORT_TITLE,
  EMPTY_TONIGHT_DESC,
  EMPTY_TONIGHT_TITLE,
} from "@/lib/explore-strings";

export type EmptyStateFilters = {
  sport: string;
  search: string;
  tonightOnly: boolean;
};

export type EmptyStateDescription = {
  title: string;
  description: string;
  actionLabel?: string;
};

/**
 * Returns context-aware copy for the events-discovery empty state.
 * Priority order: tonight filter > search query > sport filter > default.
 */
export function describeEmptyState(filters: EmptyStateFilters): EmptyStateDescription {
  if (filters.tonightOnly) {
    return {
      title: EMPTY_TONIGHT_TITLE,
      description: EMPTY_TONIGHT_DESC,
      actionLabel: EMPTY_ACTION_SHOW_ALL,
    };
  }
  if (filters.search) {
    return {
      title: `No results for "${filters.search}"`,
      description: EMPTY_SEARCH_DESC,
      actionLabel: EMPTY_ACTION_CLEAR_SEARCH,
    };
  }
  if (filters.sport) {
    return {
      title: EMPTY_SPORT_TITLE,
      description: EMPTY_SPORT_DESC,
      actionLabel: EMPTY_ACTION_ALL_SPORTS,
    };
  }
  return {
    title: EMPTY_DEFAULT_TITLE,
    description: EMPTY_DEFAULT_DESC,
    actionLabel: EMPTY_ACTION_CREATE_EVENT,
  };
}
