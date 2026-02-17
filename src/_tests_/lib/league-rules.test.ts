import assert from "node:assert/strict";
import test from "node:test";
import { buildLeagueRules } from "../../lib/league-rules.ts";

test("buildLeagueRules builds running defaults with normalized schedule values", () => {
  const rules = buildLeagueRules({
    sportType: "running",
    matchType: "",
    rotationType: "",
    runningComparisonMode: "absolute_performance",
    startDate: "",
    seasonWeeks: 1,
  });

  assert.equal(rules.sport, "running");
  assert.equal(rules.schedule.starts_on, null);
  assert.equal(rules.standings.best_n_weeks, 1);
  assert.equal(rules.standings.min_sessions_for_ranking, 1);
  assert.equal(rules.sessions.comparison_mode, "absolute_performance");
});

test("buildLeagueRules builds tennis assigned doubles with fixed pairs enabled", () => {
  const rules = buildLeagueRules({
    sportType: "tennis",
    matchType: "doubles",
    rotationType: "assigned",
    runningComparisonMode: "personal_progress",
    startDate: "2026-03-01",
    seasonWeeks: 8,
  });

  assert.equal(rules.sport, "tennis");
  assert.equal(rules.match.mode, "doubles");
  assert.equal(rules.match.doubles_partner_mode, "fixed_pairs");
  assert.deepEqual(rules.match.fixed_pairs, []);
});

test("buildLeagueRules builds pickleball singles with no fixed pairs", () => {
  const rules = buildLeagueRules({
    sportType: "pickleball",
    matchType: "singles",
    rotationType: "random",
    runningComparisonMode: "personal_progress",
    startDate: "2026-03-01",
    seasonWeeks: 6,
  });

  assert.equal(rules.sport, "pickleball");
  assert.equal(rules.match.mode, "singles");
  assert.equal(rules.match.doubles_partner_mode, null);
  assert.equal(rules.match.fixed_pairs, null);
});
