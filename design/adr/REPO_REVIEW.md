# MatUp Deep Repository Review

**Scope**: Project structure, runtime/build performance, long-term maintainability
**Codebase**: ~14,600 LOC frontend (50 files) + ~3,400 LOC backend (12 files)
**Stack**: Next.js 16 / React 19 / Tailwind v4 + Express 5 / TypeScript / Supabase / Resend

---

## 1. Executive Summary

- **The league detail page is a 2,973-line monolith** (`frontend/src/app/leagues/[id]/page.tsx`) — the single biggest maintainability and performance risk in the codebase. Several other page files (event detail 1,233 lines, league record 1,160 lines) have the same problem at a smaller scale.
- **Backend `leagues.ts` route file is 2,079 lines** containing invites, teams, schedule generation, fixtures, sessions, and standings in one file — making it hard to reason about, test, or extend any single feature.
- **Zero test files exist** across both frontend and backend. No test runner is even configured. Any refactoring or new feature carries regression risk.
- **Duplicated logic across frontend and backend**: schedule generation algorithms (`generateSinglesSchedule`, `generateDoublesRandomSchedule`, `generateDoublesAssignedSchedule`) are copy-pasted in both `frontend/src/lib/schedule.ts` and `backend/src/services/fixture-schedule.service.ts`.
- **Duplicated utility functions within backend**: `escapeHtml`, `getHostName`, `toRulesObject`, and `getNestedX` helpers are re-defined across `leagues.ts`, `email.ts`, and `sessions.ts`.
- **Every frontend page is `"use client"`** (37 of 37 component files). No server components are used despite Next.js 16 App Router — missing SSR benefits, SEO, and initial load performance.
- **All Supabase queries live directly in page components** (58 `supabase.from/rpc/auth/storage` calls across 17 page files). No data access layer, no caching, no revalidation strategy.
- **No rate limiting, request validation library, or structured logging** on the backend. Ad-hoc validation is scattered across route handlers.
- **API base URL is hardcoded** to `localhost:3001` in the fallback of `frontend/src/lib/api.ts` and no production URL is set via env.
- **Dependencies are lean and well-chosen** — minimal bloat, no unnecessary libraries. The 455MB frontend `node_modules` is standard for Next.js 16.

---

## 2. Findings

### CRITICAL

#### C1. God-file pages — `leagues/[id]/page.tsx` (2,973 lines)

**Why it matters**: A single file mixing data fetching, business logic, 10+ modal states, and rendering for tabs (overview, fixtures, standings, sessions, settings) is impossible to review, test, or safely modify. Any change risks breaking unrelated functionality.

**Impact**: Every league feature change touches this file. Merge conflicts are guaranteed when multiple contributors work on leagues.

**Files**:
- `frontend/src/app/leagues/[id]/page.tsx` — 2,973 lines
- `frontend/src/app/events/[id]/page.tsx` — 1,233 lines
- `frontend/src/app/leagues/[id]/record/page.tsx` — 1,160 lines
- `frontend/src/app/leagues/create/page.tsx` — 856 lines

**Fix**: Extract each tab into its own component file. Extract data-fetching into custom hooks. Extract modal state management into a hook or reducer. Target: no page file over 300 lines.

---

#### C2. God-file route — `backend/src/routes/leagues.ts` (2,079 lines)

**Why it matters**: Invites, teams, schedule generation, fixtures, sessions, and standings are all in one file with ~600 lines of helper functions. This violates single-responsibility and makes it impossible to unit test individual features.

**Impact**: Adding any league feature requires navigating 2,000+ lines. Helper function duplication (see C3) grows because developers can't find existing helpers.

**Files**:
- `backend/src/routes/leagues.ts` — 2,079 lines (invites + teams + schedule + fixtures + sessions + standings)

**Fix**: Split into feature-scoped route modules: `league-invites.ts`, `league-teams.ts`, `league-schedule.ts`, `league-fixtures.ts`, `league-sessions.ts`, `league-standings.ts`. Move helpers to shared utils.

---

#### C3. Zero tests

**Why it matters**: No test files, no test runner, no CI. The standings calculation alone (300+ lines with 4 scoring formats) is complex enough that manual QA cannot catch regressions.

**Impact**: Every change is a gamble. Refactoring (which this codebase needs) is extremely risky without tests.

**Files**: None exist. No `jest.config`, `vitest.config`, or test directories.

**Fix**: Add Vitest (works out-of-the-box with TS). Start with the highest-risk pure functions:
1. `calculateStandings` / `calculateTeamStandings` (backend)
2. `fixture-schedule.service.ts` (backend)
3. `league-rules.ts` / `schedule.ts` (frontend)
Then add integration tests for critical API endpoints (schedule generate, fixture workflow, standings).

---

### HIGH

#### H1. Duplicated schedule algorithms across frontend and backend

**Why it matters**: The same round-robin and shuffle algorithms exist in both `frontend/src/lib/schedule.ts` and `backend/src/services/fixture-schedule.service.ts`. If a bug is fixed in one, the other stays broken.

**Impact**: Divergence over time. Double maintenance burden.

**Files**:
- `frontend/src/lib/schedule.ts` — `generateSinglesSchedule`, `generateDoublesRandomSchedule`, `generateDoublesAssignedSchedule`
- `backend/src/services/fixture-schedule.service.ts` — identical functions

**Fix**: The backend is the authority for schedule generation (it writes to the DB). Remove frontend copies unless they're used for preview — in which case, extract to a shared package or accept the duplication with a comment linking the two files.

---

#### H2. Duplicated helpers within backend routes

**Why it matters**: `escapeHtml` is defined in both `email.ts:16` and `leagues.ts:112`. `getHostName` is in both `email.ts:57` and `leagues.ts:178`. `toRulesObject` is in both `leagues.ts:187` and `sessions.ts:17`. `getNestedNumber`/`getNestedString` are in `leagues.ts` but needed elsewhere too.

**Impact**: Bug fixes or changes must be applied in multiple places. New developers may create yet another copy.

**Files**: `backend/src/routes/email.ts`, `backend/src/routes/leagues.ts`, `backend/src/routes/sessions.ts`

**Fix**: Create `backend/src/utils/html.ts` (escapeHtml, formatMessage), `backend/src/utils/profile.ts` (getHostName), `backend/src/utils/rules.ts` (toRulesObject, getNestedX). Import everywhere.

---

#### H3. No data access layer on the frontend

**Why it matters**: All 17 page files call `supabase.from(...)` directly with inline queries. This means:
- No caching or deduplication of identical queries
- No central place to update a query when the schema changes
- No loading/error state consistency

**Impact**: Schema changes require grep-and-fix across all pages. Performance suffers from redundant fetches (e.g., user profile fetched separately in Navbar, profile page, event detail, etc.).

**Files**: All page files under `frontend/src/app/`

**Fix**: Create a `frontend/src/lib/queries/` directory with domain-scoped query functions (e.g., `getLeagueById`, `getEventParticipants`, `getUserProfile`). Optionally wrap with React Query / SWR for caching and deduplication.

---

#### H4. Everything is `"use client"` — no server components

**Why it matters**: Next.js 16 App Router defaults to server components, which reduce JS shipped to the client and enable streaming SSR. Currently, 37/37 component files are client components. Pages like the events list, league list, and user profiles could render largely on the server.

**Impact**: Larger JS bundles, slower initial paint, no SEO benefit from SSR for public pages (events, user profiles).

**Files**: Every `.tsx` file under `frontend/src/`

**Fix**: Identify pages that don't need interactivity for their initial render (event list, league list, user profiles, dashboard). Split them into a server component (data fetching + layout) and client sub-components (interactive parts only). Start with `/events` and `/leagues` pages which are publicly discoverable.

---

### MEDIUM

#### M1. No input validation library on backend

**Why it matters**: Validation is ad-hoc (`if (!subject || !subject.trim())`, manual type coercion with `getNestedX`). This is error-prone and produces inconsistent error responses.

**Impact**: Risk of uncaught edge cases. Harder to document the API.

**Fix**: Add Zod for request body validation. Define schemas co-located with routes. This also gives you auto-generated TypeScript types.

---

#### M2. No rate limiting on email endpoints

**Why it matters**: `POST /api/email/send` can be called repeatedly with no throttle. A malicious or buggy client could exhaust Resend quota.

**Impact**: Financial cost (Resend charges per email), potential abuse, deliverability reputation damage.

**Fix**: Add `express-rate-limit` to email routes (e.g., 5 requests/minute per user).

---

#### M3. Hardcoded API base URL fallback

**Why it matters**: `frontend/src/lib/api.ts` falls back to `http://localhost:3001`. If `NEXT_PUBLIC_API_BASE_URL` is unset in production, all API calls silently go to localhost and fail.

**Impact**: Production breakage if env var is missed during deploy.

**File**: `frontend/src/lib/api.ts:2`

**Fix**: Throw an error in production if the env var is missing instead of falling back to localhost.

---

#### M4. Email HTML templates are inline string literals

**Why it matters**: `buildEmailHtml` and `buildInviteEmailHtml` in the backend are 40+ line template strings embedded in route files. They're hard to preview, test, or hand off to a designer.

**Impact**: Any email design change requires editing deeply nested template strings in route handlers.

**Files**: `backend/src/routes/email.ts:29-54`, `backend/src/routes/leagues.ts:155-175`

**Fix**: Move templates to dedicated files (`backend/src/templates/email-update.html`, `backend/src/templates/invite.html`). Use a minimal templating approach (string replacement or a library like `mjml` if email design grows).

---

#### M5. No monorepo tooling — shared types are duplicated

**Why it matters**: `League`, `LeagueMember`, `Standing`, etc. are defined in `frontend/src/lib/league-types.ts` but the backend uses its own inline types. When the schema changes, both must be updated manually.

**Impact**: Type drift between frontend and backend.

**Fix**: Short-term: add a `shared/types.ts` file and symlink or copy during build. Long-term: adopt a workspace tool (npm workspaces, turborepo) to share a `@matup/types` package.

---

#### M6. CORS configuration hardcodes domain list

**Why it matters**: `backend/src/app.ts` has hardcoded CORS origins including `matup.app` and `www.matup.app`. Adding a staging environment requires a code change.

**Fix**: Move allowed origins to an env var (comma-separated list) with the current values as defaults.

---

### LOW

#### L1. No structured logging

**Why it matters**: The backend uses `console.log`/`console.error`. As traffic grows, this provides no correlation IDs, no log levels, and no structured output for log aggregation.

**Fix**: Add `pino` or `winston` with request ID middleware when scaling becomes a concern.

---

#### L2. `nodemon` watches all files (no ignore config)

**Why it matters**: Without a `nodemon.json` or `--ignore` flag, nodemon may restart on irrelevant file changes (e.g., editing README, design docs).

**Fix**: Add `nodemon.json` with `"watch": ["src"]` and `"ignore": ["dist", "node_modules"]`.

---

#### L3. No `.env.example` for frontend

**Why it matters**: The backend has `.env.example` but the frontend doesn't. New developers have to guess which env vars are needed.

**Fix**: Add `frontend/.env.example` listing all `NEXT_PUBLIC_*` vars.

---

#### L4. `dist/` directory committed or not in `.gitignore`

**Why it matters**: Compiled output should never be in version control.

**Fix**: Verify `backend/.gitignore` includes `dist/`. If not, add it and remove tracked files.

---

## 3. Performance Audit

### Frontend

| Risk | Root Cause | Impact | Fix | Estimated Improvement |
|------|-----------|--------|-----|----------------------|
| **Large initial JS bundle** | All pages are `"use client"` — entire React tree ships to client | Slow FCP/LCP on mobile | Convert data-fetching pages to server components | 30-50% reduction in page JS |
| **No data caching** | Every navigation re-fetches from Supabase | Unnecessary network requests, slow page transitions | Add React Query/SWR with stale-while-revalidate | Perceived page load drops to near-instant for cached data |
| **Event list fetches all events** | `events/page.tsx` loads all events then filters client-side | Slow on large datasets, unnecessary bandwidth | Add server-side pagination + filtering via Supabase query params | Linear improvement with data growth |
| **Map iframe on every event card render** | OpenStreetMap embeds are iframes loaded per card | Heavy DOM, slow scroll | Lazy-load maps only when visible (IntersectionObserver) or only on detail page | Major scroll performance improvement on events page |
| **html2canvas for share images** | 97KB library loaded for share feature | Adds to bundle even when not used | Dynamic import `html2canvas` only when share button clicked | ~97KB saved from main bundle |
| **No image optimization for avatars** | Supabase storage URLs without size transforms | Full-size images loaded for 32px avatar circles | Use Supabase image transforms (`?width=64&height=64`) or Next.js `Image` with explicit sizes | Significant bandwidth reduction |

### Backend

| Risk | Root Cause | Impact | Fix | Estimated Improvement |
|------|-----------|--------|-----|----------------------|
| **Standings calculation is O(n*m)** | `calculateStandings` in `leagues.ts` fetches all matches + fixtures + runs then processes in-memory | Slow for leagues with many weeks/members | Cache standings per league with invalidation on fixture finalize | Response time from seconds to milliseconds for repeat requests |
| **N+1 query pattern in invite sending** | `getEmailsForUserIds` may fire per-user queries | Slow for large groups | Already using `.in()` — verify batch query is used consistently | Minor |
| **No connection pooling config** | Supabase client created once but no pool tuning | Under high concurrency, connection exhaustion | Configure `db` pool settings in Supabase client options | Prevents failure under load |
| **Email sending blocks response** | `sendGroupEmail` awaits all batches before responding | Slow response for large recipient lists | Return 202 Accepted immediately, process emails in background (queue or fire-and-forget) | Response time drops from seconds to <100ms |
| **No response compression** | No `compression` middleware | Larger payloads over the wire | Add `compression()` middleware to Express | 60-80% reduction in JSON response size |

### Build

| Risk | Root Cause | Impact | Fix |
|------|-----------|--------|-----|
| **Backend uses `ts-node` in dev** | `nodemon --exec ts-node src/index.ts` — full TypeScript compilation on every restart | Slow dev restart cycle | Switch to `tsx` (esbuild-based, 10-50x faster) |
| **No incremental TS compilation** | `tsc` recompiles everything on `npm run build` | Slow CI builds as codebase grows | Add `"incremental": true` to `tsconfig.json` |

---

## 4. Target Structure Proposal

### Frontend — Feature-Based with Server/Client Split

```
frontend/src/
├── app/                          # Next.js routes (thin — layout + data fetch only)
│   ├── layout.tsx                # Root layout (server component)
│   ├── page.tsx                  # Landing (server component)
│   ├── events/
│   │   ├── page.tsx              # Server component: fetch + render EventListClient
│   │   ├── create/page.tsx
│   │   └── [id]/
│   │       ├── page.tsx          # Server component: fetch + render EventDetailClient
│   │       └── edit/page.tsx
│   ├── leagues/
│   │   ├── page.tsx
│   │   ├── create/page.tsx
│   │   ├── join/page.tsx
│   │   └── [id]/
│   │       ├── page.tsx          # Server component: fetch + render LeagueDetailClient
│   │       └── record/page.tsx
│   ├── dashboard/page.tsx
│   ├── profile/page.tsx
│   ├── friends/page.tsx
│   ├── users/[id]/page.tsx
│   └── (auth)/                   # Route group for auth pages
│       ├── login/page.tsx
│       ├── signup/page.tsx
│       ├── forgot-password/page.tsx
│       └── reset-password/page.tsx
│
├── features/                     # Feature modules (NEW)
│   ├── events/
│   │   ├── components/           # EventCard, EventMap, EventForm, JoinModal, etc.
│   │   ├── hooks/                # useEventDetail, useEventList, useEventForm
│   │   └── queries.ts            # getEvents, getEventById, joinEvent, etc.
│   ├── leagues/
│   │   ├── components/           # LeagueTabs, StandingsTable, FixtureCard, modals
│   │   ├── hooks/                # useLeagueDetail, useStandings, useFixtures
│   │   └── queries.ts            # getLeague, getStandings, generateSchedule, etc.
│   ├── auth/
│   │   ├── components/           # LoginForm, SignupForm
│   │   └── hooks/                # useAuth, useSession
│   └── social/
│       ├── components/           # FriendCard, FriendRequestCard
│       └── queries.ts            # getFriends, sendRequest, etc.
│
├── components/                   # Shared UI primitives only
│   ├── Navbar.tsx
│   ├── NavbarShell.tsx
│   ├── LocationAutocomplete.tsx
│   ├── LocationLink.tsx
│   └── share/                    # Share utilities (cross-feature)
│
├── lib/                          # Pure utilities (no React, no Supabase)
│   ├── supabase.ts               # Client init
│   ├── api.ts                    # API base URL
│   ├── formatAddress.ts
│   ├── geo.ts
│   └── share/
│       ├── captureImage.ts
│       └── sportEmojis.ts
│
└── types/                        # Shared TypeScript types (NEW — replaces league-types.ts etc.)
    ├── league.ts
    ├── event.ts
    ├── user.ts
    └── index.ts
```

**Rationale**:
- **`app/` stays thin**: routes do data fetching (server) and delegate to feature components (client)
- **`features/`**: groups all related code by domain — components, hooks, queries. When you work on "leagues", everything is in one folder.
- **`components/`**: only truly shared, cross-feature UI primitives
- **`types/`**: single source of truth for data models, importable everywhere

### Backend — Feature-Scoped Modules

```
backend/src/
├── index.ts                      # Server entrypoint (unchanged)
├── app.ts                        # Express setup + route mounting (unchanged)
├── config/
│   └── env.ts                    # Environment config (unchanged)
│
├── middleware/
│   ├── auth.ts                   # JWT auth (unchanged)
│   └── rate-limit.ts             # Rate limiting (NEW)
│
├── modules/                      # Feature modules (NEW — replaces routes/)
│   ├── email/
│   │   ├── email.routes.ts       # POST /api/email/send
│   │   ├── email.service.ts      # sendGroupEmail (moved from services/)
│   │   └── email.templates.ts    # HTML templates (extracted from routes)
│   ├── leagues/
│   │   ├── invites.routes.ts     # GET/POST invites, POST join
│   │   ├── teams.routes.ts       # GET/PUT teams
│   │   ├── schedule.routes.ts    # POST generate
│   │   ├── fixtures.routes.ts    # GET fixtures (moved from routes/fixtures.ts)
│   │   ├── sessions.routes.ts    # GET/POST sessions (moved from routes/sessions.ts)
│   │   ├── standings.routes.ts   # GET standings
│   │   ├── standings.service.ts  # calculateStandings (extracted)
│   │   ├── schedule.service.ts   # generateXSchedule (moved from services/)
│   │   └── invite.templates.ts   # Invite email HTML
│   └── fixtures/
│       ├── results.routes.ts     # submit, confirm, resolve
│       └── results.service.ts    # Finalization logic (extracted)
│
├── utils/                        # Shared utilities (deduplicated)
│   ├── supabase.ts               # Admin client (unchanged)
│   ├── league-access.ts          # Role checks (unchanged)
│   ├── html.ts                   # escapeHtml, formatMessage (NEW — deduplicated)
│   ├── profile.ts                # getHostName (NEW — deduplicated)
│   └── rules.ts                  # toRulesObject, getNestedX (NEW — deduplicated)
│
└── templates/                    # Email templates (if preferred flat)
```

**Rationale**:
- Each feature gets its own module with co-located routes, services, and templates
- `leagues.ts` (2,079 lines) splits into 6 focused route files (~200-350 lines each)
- Shared helpers are deduplicated into `utils/`
- Adding a new feature = add a new module directory, mount in `app.ts`

---

## 5. Incremental Migration Plan

Each step is independently deployable. No step breaks existing features.

### Phase 1: Foundation (Week 1)

**Step 1**: Deduplicate backend helpers
- Create `backend/src/utils/html.ts`, `profile.ts`, `rules.ts`
- Move `escapeHtml`, `getHostName`, `toRulesObject`, `getNestedX` to shared utils
- Update imports in `email.ts`, `leagues.ts`, `sessions.ts`
- Search-and-replace, no logic changes

**Step 2**: Add test infrastructure
- `npm install -D vitest` in both frontend and backend
- Add `vitest.config.ts` to both
- Write first tests for `fixture-schedule.service.ts` (pure functions, easy to test)
- Write tests for `calculateStandings` (extract from `leagues.ts` into `standings.service.ts` first)

**Step 3**: Add `.env.example` for frontend, verify `.gitignore` for `dist/`

### Phase 2: Backend Split (Week 2)

**Step 4**: Split `leagues.ts` into feature route files
- Start by extracting standings into `league-standings.routes.ts` + `standings.service.ts`
- Then extract invites into `league-invites.routes.ts`
- Then schedule generation into `league-schedule.routes.ts`
- Update `app.ts` to mount sub-routers
- Each extraction is a separate commit, testable independently

**Step 5**: Move fixtures and sessions routes under `modules/`
- `routes/fixtures.ts` → `modules/fixtures/results.routes.ts`
- `routes/sessions.ts` → `modules/leagues/sessions.routes.ts`

### Phase 3: Frontend Data Layer (Week 3)

**Step 6**: Create `frontend/src/features/` directory structure
- Start with `features/leagues/queries.ts` — extract all Supabase calls from `leagues/[id]/page.tsx`
- Create `features/events/queries.ts` — extract from event pages

**Step 7**: Break up `leagues/[id]/page.tsx` (2,973 lines)
- Extract tab contents: `OverviewTab.tsx`, `FixturesTab.tsx`, `StandingsTab.tsx`, `SessionsTab.tsx`, `SettingsTab.tsx`
- Extract modal state into `useLeagueModals.ts` hook
- Page file becomes ~200 lines of tab routing + data fetching

**Step 8**: Break up `events/[id]/page.tsx` (1,233 lines)
- Extract `EventSidebar.tsx`, `EventDiscussion.tsx`, `EventReviews.tsx`
- Extract modal components into `features/events/components/`

### Phase 4: Performance (Week 4)

**Step 9**: Convert key pages to server components
- `events/page.tsx` — fetch events server-side, pass to `EventListClient`
- `leagues/page.tsx` — fetch leagues server-side, pass to `LeagueListClient`
- `users/[id]/page.tsx` — public profile is read-only, ideal for SSR

**Step 10**: Add response compression + rate limiting to backend
- `npm install compression express-rate-limit`
- Add to middleware stack in `app.ts`

**Step 11**: Switch `ts-node` to `tsx` for faster dev restarts
- `npm install -D tsx`
- Update `package.json` dev script: `"dev": "nodemon --exec tsx src/index.ts"`

### Phase 5: Caching & Optimization (Week 5+)

**Step 12**: Add data caching on frontend
- Consider React Query or SWR for Supabase queries
- Or use Next.js `fetch` cache + `revalidateTag` for server-component data

**Step 13**: Dynamic imports for heavy client libraries
- `html2canvas` — `const html2canvas = (await import('html2canvas')).default`
- Modal components — lazy load on open

---

## 6. Quick Wins (1-2 Days)

| # | Change | Effort | Impact |
|---|--------|--------|--------|
| 1 | **Deduplicate `escapeHtml`, `getHostName`, `toRulesObject`** into `backend/src/utils/` | 1 hour | Eliminates 6 duplicate function definitions |
| 2 | **Add `compression` middleware** to `backend/src/app.ts` | 15 min | 60-80% smaller API responses |
| 3 | **Switch `ts-node` to `tsx`** in backend dev script | 10 min | 10-50x faster dev restart |
| 4 | **Add `"incremental": true`** to `backend/tsconfig.json` | 5 min | Faster `tsc` builds |
| 5 | **Fix API base URL fallback** — throw in production if env var missing | 10 min | Prevents silent production failures |
| 6 | **Add `frontend/.env.example`** | 10 min | Better DX for new contributors |
| 7 | **Add `nodemon.json`** with `"watch": ["src"]` | 5 min | No false restarts on doc edits |
| 8 | **Dynamic-import `html2canvas`** in `captureImage.ts` | 15 min | ~97KB off main bundle |
| 9 | **Add Vitest + first test file** for `fixture-schedule.service.ts` | 2 hours | Starts the testing foundation |
| 10 | **Extract `calculateStandings`** from `leagues.ts` into `standings.service.ts` | 1 hour | First step to splitting the god-file, testable in isolation |

---

## 7. Future-Proofing Checklist

### File Size Rules
- [ ] **No page/component file exceeds 400 lines.** If it does, extract sub-components or hooks.
- [ ] **No backend route file exceeds 300 lines.** Extract service logic or split into sub-routers.

### Architecture Rules
- [ ] **Backend route handlers are thin.** They validate input, call a service, return a response. Business logic lives in `services/` or `modules/*/service.ts`.
- [ ] **Frontend pages are thin.** They fetch data (ideally server-side) and compose feature components. No inline Supabase queries in page files.
- [ ] **Shared code lives in shared directories.** No function should be defined in more than one file. Use `utils/` (backend) or `lib/` (frontend).
- [ ] **Types are co-located or centralized.** Domain types go in `types/` or `features/*/types.ts`. Never inline complex type definitions in page files.

### Performance Rules
- [ ] **New pages default to server components.** Only add `"use client"` for interactive sub-components.
- [ ] **Heavy libraries are dynamically imported.** Any dependency > 50KB that isn't needed on initial render should use `import()`.
- [ ] **API responses are paginated.** No endpoint returns unbounded result sets.
- [ ] **Email sending is async.** Return 202 and process in background when recipient list > 10.

### Testing Rules
- [ ] **Every service file has a corresponding `.test.ts`.** Pure business logic (standings, schedule generation, validation) must have unit tests.
- [ ] **Critical API endpoints have integration tests.** At minimum: auth, schedule generation, fixture workflow, standings.
- [ ] **Test coverage is tracked.** Add coverage reporting to CI when CI is set up.

### Process Rules
- [ ] **New features follow the module pattern.** Create a directory under `modules/` (backend) or `features/` (frontend) with co-located routes/components, services/hooks, and types.
- [ ] **PRs that add > 200 lines to a single file require justification.** This prevents god-files from growing back.
- [ ] **Shared utilities are documented.** A brief JSDoc comment explaining what the function does and when to use it prevents re-invention.

### Scaling Prep
- [ ] **Database indexes are reviewed** for any table queried in standings/fixtures (these will be the first bottleneck).
- [ ] **Supabase RLS policies are in place** for all tables (defense in depth — backend uses service key, but frontend uses anon key).
- [ ] **Consider connection pooling** (Supabase's built-in PgBouncer or self-managed) before going beyond ~50 concurrent users.
- [ ] **Add structured logging** (pino) and request tracing before production traffic grows.

---

## Assumptions

1. The app is pre-launch or early-launch with a small user base (based on no CI/CD, no tests, hardcoded localhost URLs).
2. The frontend and backend are deployed separately (frontend on Vercel/similar, backend on Render per `DEPLOY_PLAN.md`).
3. Supabase is the sole database and the team is committed to it for the foreseeable future.
4. The league feature is the primary growth area (based on code volume and complexity).
5. There's currently a single developer or very small team (based on no branching strategy, no CI).

---

## Tradeoff Summary

| Recommendation | Benefit | Cost | Risk of Not Doing |
|---|---|---|---|
| Split god-files | Maintainability, parallel work | ~2 days refactoring per file | Every feature change gets slower and riskier |
| Add tests | Confidence in refactoring | ~3 days initial setup + ongoing | Any change can break production silently |
| Server components | Performance, SEO | ~1 day per converted page | Slower page loads, poor SEO for discoverable pages |
| Feature-based structure | Discoverability, scaling | ~2 days migration | Growing confusion as features multiply |
| Shared types package | Type safety across stack | ~1 day setup | Subtle bugs from type drift |
| Data access layer | Caching, single source of truth | ~2 days | Redundant fetches, hard-to-update queries |
