import assert from "node:assert/strict";
import test from "node:test";
import {
  formatDistance,
  formatDuration,
  getInitials,
} from "../../lib/league-utils.ts";

test("getInitials returns fallback question mark for null names", () => {
  assert.equal(getInitials(null), "?");
});

test("getInitials builds uppercase initials from name words", () => {
  assert.equal(getInitials("mat up"), "MU");
  assert.equal(getInitials("Mat"), "M");
});

test("formatDuration formats minutes and padded seconds", () => {
  assert.equal(formatDuration(125), "2:05");
  assert.equal(formatDuration(61), "1:01");
});

test("formatDistance formats short and long distances", () => {
  assert.equal(formatDistance(850), "850m");
  assert.equal(formatDistance(1200), "1.2km");
});
