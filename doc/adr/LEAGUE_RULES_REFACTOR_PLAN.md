# ADR: League Rules and Workflow Refactor Plan

- Status: Proposed
- Date: 2026-02-09
- Owners: Product + Engineering

## Context

Current league features support running and tennis with basic setup, schedule generation, score recording, and leaderboard display.

Main constraints today:
- Rule logic (schedule + standings) lives mostly in frontend code.
- League configuration is limited (few format options, minimal tie-breakers/policies).
- Result recording is owner/admin-centric; participant submission and confirmation are limited.
- Weekly scheduling has no explicit fairness or constraint model.

Goal: give organizers configurable league rules and a reliable workflow for season planning, match execution, and leaderboard integrity.

## Decision

Refactor league features into a backend-authoritative, rule-driven system with:
1) Configurable sport-specific rules (starting with Tennis and Running).
2) Backend-generated fixtures and standings.
3) Participant + organizer result submission and confirmation workflow.
4) Versioned rules and auditable result state transitions.

## Scope

### In scope
- Tennis and Running league rule configuration.
- Weekly fixture generation for tennis doubles/singles.
- Result submission/confirmation/dispute states.
- Leaderboard based only on finalized results.

### Out of scope (initial refactor)
- Court booking integration.
- Payments, penalties, or advanced monetization.
- Additional sports beyond Tennis and Running.

## Target Architecture

### Backend authority
- Move scheduling and ranking logic to backend APIs/services.
- Frontend becomes UI-only for create/configure/submit/view.

### Rule model
- Add a new `rules` jsonb column on `leagues` — governs league behavior such as scoring, tie-breakers, and scheduling constraints.
- Add `rules_version` integer column on `leagues` (default 1). Existing leagues are frozen at the version they were created with. When the rule schema evolves, new versions are opt-in: organizers can upgrade via a "Update rules to latest" action. The backend validates and computes against the league's own `rules_version`, so old leagues are never broken by schema changes.

### Data model additions
- `league_fixtures`: canonical schedule entities.
- `result_submissions`: raw submissions from organizer/participants.
- `result_confirmations`: per-side confirmations.
- `standings_snapshots` (optional): cached standings per update.
- `league_invites`: email-based invitations (league_id, email, token, status, invited_by, invited_at, claimed_by, claimed_at). Status: `pending | accepted | expired`.
- Add `invite_code` (unique, short string) column on `leagues` for shareable join links.

### RLS policies for new tables

**`league_fixtures`** (mirrors existing `league_matches` policies):
- SELECT: any authenticated user.
- INSERT/UPDATE/DELETE: owner/admin of the parent league (via `league_members` join).

**`result_submissions`**:
- SELECT: any authenticated user.
- INSERT: fixture participants (own `user_id`) or league owner/admin.
- UPDATE: own submissions only, or league owner/admin.
- DELETE: league owner/admin only.

**`result_confirmations`**:
- SELECT: any authenticated user.
- INSERT: fixture participants on the opposing side, or league owner/admin.
- UPDATE/DELETE: league owner/admin only.

**`standings_snapshots`**:
- SELECT: any authenticated user.
- INSERT/UPDATE/DELETE: backend service role only (no direct user writes).

**`league_invites`**:
- SELECT: league owner/admin (full list) or own invite (by email match on `auth.jwt() ->> 'email'`).
- INSERT: league owner/admin only.
- UPDATE: own invite (accept), or league owner/admin (cancel/resend).
- DELETE: league owner/admin only.

### Match lifecycle
- `scheduled -> submitted -> confirmed -> finalized`
- Optional: `disputed` state with admin/owner override.

## Sport Rule Sets

### Tennis (v1 target)
- Mode: `singles | doubles`
- Doubles pairing: `random_weekly | fixed_pairs | rotating_pairs`
- Match scoring:
  - winner-only
  - set scoring (best-of, optional tiebreak policy)
- League points:
  - configurable points for win/loss (and optional draw if supported)
- Tie-breaker sequence (configurable):
  - points -> head-to-head -> set diff -> game diff

### Running (v1.5 target)
- Result mode: `fastest_time | points_by_rank`
- Season scoring:
  - best N weeks
  - drop worst K weeks
- DNF/no-show policy: `mark_dnf | exclude_from_week`

#### Running session definition (v1.5 — minimal)
- `distance_meters` (optional, for display/grouping)
- `start_window` / `end_window` for valid submission period
- One submission per runner per session (latest before lock wins)

#### Running submission workflow (v1.5)
1) Runner submits: elapsed time + distance.
2) System validates: within submission window, one per runner.
3) Organizer can override/edit submissions before session lock.
4) Session locks at `end_window`. Finalized runs feed leaderboard.

#### Deferred to v2: extended running sessions
- `session_type`: `time_trial | group_run | interval`
- `route_id` / `route_name` (same course grouping)
- `elevation_profile`: `flat | mixed | hilly` (fairness bucket)
- `surface_type`: `road | trail | track` (fairness bucket)
- Proof submission (`device_link` or `screenshot_url`) with review queue
- Comparison modes: `absolute_performance` vs `personal_progress`
- Distance tolerance validation (e.g. +/-5%)
- Late edit audit records with leaderboard recalculation

## Product Workflow

### League creation
1) Choose sport template.
2) Configure rules (basic presets + advanced settings).
3) Configure season schedule (start date, weeks, cadence, matches per week).
4) Review and create.

### Adding participants
Organizers can add participants via three methods:

**Friends list** (at creation time):
- Existing flow: Step 4 of league creation lets the host select from their accepted friends on the platform.
- Selected friends are added as `league_members` immediately.

**Shareable join link** (always available):
- Each league gets a unique `invite_code` (e.g. `matup.app/leagues/join/abc123`).
- Host shares link via WhatsApp, text, etc.
- Has account: click link → join league.
- No account: click link → signup → auto-join.

**Email invites** (targeted adds):
- Host enters email addresses of people to invite.
- System sends an email (via Resend) with a league join link.
- Has account: clicking the link auto-joins the league.
- No account: link goes to signup, then auto-joins on completion.
- Host can see invite status: `pending | accepted | expired`.

The shareable link and email invite methods funnel non-account holders through signup → auto-join, so every league member has a real account and `user_id`.

### Weekly operations
1) System generates fixtures.
2) Organizer can regenerate before season starts (or before week lock).
3) Participants/organizer submit results.
4) Opposing side confirms.
5) Result finalizes and leaderboard updates.

### Running weekly operations
1) Organizer publishes weekly running session definition.
2) Runners submit run results during the allowed window.
3) Organizer/admin reviews flagged submissions.
4) Session locks at cutoff time.
5) Leaderboard recalculates (performance and/or progress view).

### Disputes
- If conflicting submissions occur, fixture moves to `disputed`.
- Owner/admin resolves with audit log.

## API Plan (high level)

- `POST /api/leagues` with `sport_type` + `rules`
- `POST /api/leagues/:id/schedule/generate`
- `GET /api/leagues/:id/fixtures?week=`
- `POST /api/leagues/:id/sessions` (create/update running session definition)
- `GET /api/leagues/:id/sessions?week=`
- `POST /api/fixtures/:id/results/submit`
- `POST /api/fixtures/:id/results/confirm`
- `POST /api/fixtures/:id/results/resolve` (owner/admin)
- `POST /api/sessions/:id/runs/submit`
- `POST /api/sessions/:id/runs/:runId/review` (owner/admin approve/reject)
- `GET /api/leagues/:id/standings`
- `POST /api/leagues/:id/invites` (send email invites — owner/admin)
- `GET /api/leagues/:id/invites` (list invite statuses — owner/admin)
- `POST /api/leagues/:id/join` (join via invite code or invite token)

## Rollout Plan

### Phase 1: Foundation
- Introduce new rule schema and fixture/result tables.
- Add `invite_code` column and `league_invites` table.
- Implement shareable join link and email invite flow.
- Implement backend schedule + standings services for tennis.
- Keep current UI, read from new backend where possible.

### Phase 2: Tennis workflow upgrade
- New create-league rule UI for tennis.
- New fixture list and result submission/confirmation flow.
- Replace owner-only record flow with shared confirmation model.

### Phase 3: Running rule upgrade
- Add running-specific scoring config and standings rules.
- Migrate existing running leagues to default running profile.

### Phase 4: Stabilize and optimize
- Add caching/snapshots for standings.
- Add rule presets and reusable templates.
- Add operational tooling for disputes and overrides.

## Migration Strategy

1) Backfill existing leagues with default `rules` and `rules_version = 1` per sport.
2) Create `league_fixtures` rows from existing `league_matches` data. Keep `league_matches` table intact during transition (do not drop or rename).
3) Mark historical results as finalized in `result_submissions`.
4) Dual-read period (2 weeks minimum): backend serves standings from both old (`league_matches`) and new (`league_fixtures`) paths. Compare outputs nightly. Cutover criteria: zero leaderboard divergence for 7 consecutive days across all active leagues.
5) Cut over frontend to new `/api/leagues/*` endpoints. Old Supabase direct-query paths in frontend are removed.
6) Backfill existing leagues with a generated `invite_code`.
7) After cutover is validated, deprecate `league_matches` and `match_participants` (retain read-only for archival; no new writes).

## Risks and Mitigations

- Risk: rule flexibility increases complexity.
  - Mitigation: use sport presets + advanced mode toggle.
- Risk: inconsistent results from multi-party submissions.
  - Mitigation: explicit states, confirmation rules, dispute workflow.
- Risk: schedule fairness complaints.
  - Mitigation: deterministic generation + fairness constraints + preview before publish.

## Success Metrics

- Time to create league with valid rules < 3 minutes.
- >90% of weekly fixtures finalized without manual admin intervention.
- Reduced organizer edits for schedule/standings by at least 50%.
- Fewer support reports about leaderboard correctness.

## Immediate Engineering Backlog (next sprint)

1) Draft SQL migration: add `rules`/`rules_version` columns on `leagues`, add `invite_code` column on `leagues`, create `league_fixtures`, `result_submissions`, `result_confirmations`, `league_invites` tables.
2) Build backend league service (no league endpoints exist in backend today — this is a ground-up build, not a move).
3) Implement tennis schedule generator as a backend service.
4) Implement standings computation as a backend service.
5) Implement fixture result state machine and authorization rules.
6) Build tennis rules UI in league creation (preset + advanced fields).
