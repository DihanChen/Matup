import assert from "node:assert/strict";
import test from "node:test";
import {
  createInitialSwipeDeckState,
  dismissSwipeDeckItem,
  getVisibleSwipeItems,
  rankSwipeCourts,
  rankSwipeEvents,
  resetSwipeDeckState,
} from "../../features/events/lib/exploreSwipe.ts";

function createEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: "event-1",
    title: "Morning Match",
    description: null,
    sport_type: "tennis",
    location: "Mission Bay Park",
    datetime: "2026-03-10T18:00:00.000Z",
    max_participants: 4,
    creator_id: "host-1",
    created_at: "2026-03-01T10:00:00.000Z",
    latitude: 37.77,
    longitude: -122.39,
    skill_level: "intermediate",
    participant_count: 2,
    creator_name: "Alex",
    is_joined_by_current_user: false,
    ...overrides,
  };
}

function createCourt(overrides: Record<string, unknown> = {}) {
  return {
    id: "court-1",
    source: "db" as const,
    osm_id: null,
    name: "Mission Court",
    address: "Mission Bay Park",
    latitude: 37.77,
    longitude: -122.39,
    sport_types: ["tennis"],
    surface: "hard",
    lighting: true,
    image_url: null,
    average_rating: 4.4,
    review_count: 8,
    ...overrides,
  };
}

test("rankSwipeEvents excludes full, creator-owned, and joined events for logged-in users", () => {
  const ranked = rankSwipeEvents(
    [
      createEvent({ id: "available" }),
      createEvent({ id: "full", participant_count: 4, max_participants: 4 }),
      createEvent({ id: "owned", creator_id: "user-1" }),
      createEvent({ id: "joined", is_joined_by_current_user: true }),
    ],
    "user-1"
  );

  assert.deepEqual(
    ranked.map((event) => event.id),
    ["available"]
  );
});

test("rankSwipeEvents orders by distance, date, fill ratio, title, then id", () => {
  const ranked = rankSwipeEvents(
    [
      createEvent({
        id: "later",
        title: "Later Match",
        distance: 2,
        datetime: "2026-03-12T18:00:00.000Z",
      }),
      createEvent({
        id: "closer",
        title: "Closer Match",
        distance: 1,
        datetime: "2026-03-13T18:00:00.000Z",
      }),
      createEvent({
        id: "fuller",
        title: "Alpha Match",
        distance: 2,
        datetime: "2026-03-12T18:00:00.000Z",
        participant_count: 3,
      }),
      createEvent({
        id: "alpha-id-b",
        title: "Alpha Match",
        distance: 2,
        datetime: "2026-03-12T18:00:00.000Z",
        participant_count: 3,
      }),
      createEvent({
        id: "alpha-id-a",
        title: "Alpha Match",
        distance: 2,
        datetime: "2026-03-12T18:00:00.000Z",
        participant_count: 3,
      }),
    ],
    null
  );

  assert.deepEqual(
    ranked.map((event) => event.id),
    ["closer", "alpha-id-a", "alpha-id-b", "fuller", "later"]
  );
});

test("rankSwipeCourts orders by distance, source, rating, review count, then name", () => {
  const ranked = rankSwipeCourts([
    createCourt({
      id: "closer-osm",
      source: "osm" as const,
      name: "Closer OSM Court",
      distance: 1,
      average_rating: 0,
      review_count: 0,
    }),
    createCourt({
      id: "db-higher-rating",
      distance: 2,
      average_rating: 4.9,
      review_count: 4,
      name: "Bay Court",
    }),
    createCourt({
      id: "db-more-reviews",
      distance: 2,
      average_rating: 4.9,
      review_count: 8,
      name: "Harbor Court",
    }),
    createCourt({
      id: "osm-after-db",
      source: "osm" as const,
      distance: 2,
      average_rating: 5,
      review_count: 10,
      name: "Open Court",
    }),
  ]);

  assert.deepEqual(
    ranked.map((court) => court.id),
    ["closer-osm", "db-more-reviews", "db-higher-rating", "osm-after-db"]
  );
});

test("dismissSwipeDeckItem removes the current card and resetSwipeDeckState clears session state", () => {
  const initialDeck = createInitialSwipeDeckState();
  const advancedDeck = {
    ...initialDeck,
    currentIndex: 2,
    dismissedIds: new Set(["event-1"]),
  };

  const nextDeck = dismissSwipeDeckItem(advancedDeck, "event-3", 3);
  const visibleItems = getVisibleSwipeItems(
    [{ id: "event-1" }, { id: "event-2" }, { id: "event-3" }, { id: "event-4" }],
    nextDeck.dismissedIds
  );

  assert.equal(nextDeck.currentIndex, 1);
  assert.deepEqual(Array.from(nextDeck.dismissedIds).sort(), ["event-1", "event-3"]);
  assert.deepEqual(
    visibleItems.map((item) => item.id),
    ["event-2", "event-4"]
  );

  const resetDeck = resetSwipeDeckState();
  assert.equal(resetDeck.currentIndex, 0);
  assert.equal(resetDeck.dismissedIds.size, 0);
});
