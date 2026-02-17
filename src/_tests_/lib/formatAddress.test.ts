import assert from "node:assert/strict";
import test from "node:test";
import { formatShortAddress } from "../../lib/formatAddress.ts";

test("formatShortAddress returns empty string for empty input", () => {
  assert.equal(formatShortAddress(""), "");
});

test("formatShortAddress returns short addresses unchanged", () => {
  const value = "Fredericton, New Brunswick, Canada";
  assert.equal(formatShortAddress(value), value);
});

test("formatShortAddress extracts venue, city, and province from long addresses", () => {
  const longAddress =
    "Goodlife Fitness, 1156, Prospect Street, Uptown Centre, Prospect, Uptown, Fredericton, City of Fredericton, York County, New Brunswick, E3B 3C1, Canada";

  assert.equal(
    formatShortAddress(longAddress),
    "Goodlife Fitness, Fredericton, New Brunswick"
  );
});

test("formatShortAddress uses fallback when no meaningful location segments exist", () => {
  const address = "Venue Name, 123, 456, 789, Canada";
  assert.equal(formatShortAddress(address), "Venue Name, 789");
});
