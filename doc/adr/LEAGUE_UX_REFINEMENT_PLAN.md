# League UX Refinement Plan

## Context

The league feature works functionally but trails the event pages in UX quality. The event pages set the bar: clean hierarchy, rich card components, structured info grids, polished empty states, skeleton loading, and extracted components. The league pages are a 3,001-line monolith with 8 inline modals, raw technical inputs, inconsistent badges, and no visual discovery tools. This plan closes that gap while staying within the existing MatUp theme (orange-500, zinc neutrals, rounded-full buttons, rounded-2xl cards, Tailwind-only).

**What already exists (from prior refactor):** `StatusBadge`, `SubmitResultModal`, `league-types.ts`, `league-utils.ts` — these are good foundations. The current plan builds on them.

---

## 1. UX Audit Summary — Top 10 Friction Points

| # | Severity | Issue | Page | User Impact |
|---|----------|-------|------|-------------|
| 1 | CRITICAL | Detail page is a 3,001-line monolith with 8 inline modals and 65+ useState hooks | `[id]/page.tsx` | Unmaintainable; every edit risks regressions across unrelated features |
| 2 | HIGH | Run entry modal asks for "Elapsed Seconds" as a raw number | `[id]/page.tsx` :2695 | Runners must mental-math convert MM:SS to seconds (e.g. "1500" for 25:00) |
| 3 | HIGH | Create Session modal uses raw ISO string inputs ("2026-02-14T15:00:00Z") | `[id]/page.tsx` :2648-2663 | Organizers must hand-type ISO 8601 timestamps |
| 4 | HIGH | Resolve Dispute modal uses "Side A" / "Side B" labels instead of player names | `[id]/page.tsx` :2815-2826 | Admin can't tell which side is which without scrolling back to the match card |
| 5 | HIGH | Modal close buttons use literal text "X" instead of SVG icon | `[id]/page.tsx` :2401, 2469, 2877 | Inconsistent with SubmitResultModal; looks unfinished |
| 6 | MEDIUM | League listing has no search, no sport filter, no sort | `leagues/page.tsx` | Users with 5+ leagues can't quickly find the one they need |
| 7 | MEDIUM | LeagueCard is visually plain vs EventCard (no icon, no cover, no at-a-glance stats) | `leagues/page.tsx` :233-292 | Leagues feel like an afterthought compared to events |
| 8 | MEDIUM | No skeleton loading states — shows flat "Loading..." text | All league pages | Perceived slowness; layout shift when data loads |
| 9 | MEDIUM | Join page requires raw UUID entry for league ID | `leagues/join/page.tsx` | Confusing for users clicking invite links (though URL params help) |
| 10 | LOW | Invite status badges in sidebar are manually styled instead of using StatusBadge | `[id]/page.tsx` :2316-2322 | Inconsistent badge colors across the page |

---

## 2. Design Direction — UX Principles

1. **Match the event-page bar** — Leagues should feel as polished as events. Same card structures, same info-grid patterns, same badge conventions.
2. **No technical inputs** — Replace ISO strings, raw seconds, UUIDs with `datetime-local`, MM:SS fields, auto-filled IDs.
3. **Components first** — Every section and modal should be an extracted component. The detail page should be a ~400-line orchestrator.
4. **Contextual actions** — Action buttons appear where the data is, not in a separate sidebar. Match cards show their own submit/confirm/reject buttons.
5. **Consistent badge language** — Use `StatusBadge` everywhere a status pill appears. One component, one styling source.
6. **Progressive disclosure** — Don't show admin tools to participants. Don't show empty sections. Use skeletons instead of blank states for loading.
7. **Mobile-first details** — All modals, tables, and cards must work at 375px. Tables scroll horizontally. Modals cap at `max-h-[85vh]` with overflow scroll.

---

## 3. Proposed Information Architecture

### `/leagues` — League Listing
**Current:** Two flat sections (Owned, Joined), no filtering.
**Proposed:**
- Add a search bar (pill-shaped, same pattern as events search)
- Add sport filter chips (All, Tennis, Running)
- Upgrade `LeagueCard` to show: sport icon, format badge, status badge (using StatusBadge), member count with avatar stack (top 3), season progress indicator (e.g., "Week 3 of 10")
- Skeleton loading (3 cards per section while loading)
- Better empty states: icon + message + CTA (like events empty state)

### `/leagues/[id]` — League Detail
**Current:** 3,001-line monolith with everything inline.
**Proposed structure (after extraction):**
```
Header Card (inline, ~40 lines)
├── StandingsSection (component)
├── RecentResults (component or section with MatchCard components)
├── RunningSessionsSection (component with RunningSessionCard components)
├── PendingReviews (section with MatchCard variant="pending_review")
├── UpcomingMatches (section with MatchCard variant="scheduled")
Sidebar:
├── MembersList (component)
├── ActionsPanel (component)
├── InviteSection (component)
├── AssignedTeamsPanel (component, conditional)
├── LeagueInfoPanel (inline, ~30 lines)
Modals (all extracted):
├── SubmitResultModal (already done)
├── DeleteLeagueModal
├── EmailMembersModal
├── InviteModal
├── RejectModal (generic — serves reject-submission + reject-run)
├── ResolveDisputeModal (with player names, not Side A/B)
├── CreateSessionModal (with datetime-local inputs)
├── RunEntryModal (with MM:SS split fields)
├── ManageTeamsModal
```

### `/leagues/[id]/record` — Record Results
**Current:** Admin-only, functional but with "Side A/B" labels.
**Proposed:**
- Keep as admin power tool (it supports ad-hoc matches and legacy formats)
- Already has info banner pointing to inline submit
- Replace `getInitials` local copy with import from `league-utils` (already done)
- No major layout changes needed — focus improvements on the modals/detail page instead

### `/leagues/create` — Create League
**Current:** Good 4-step wizard, reasonable quality.
**Proposed:** Minor polish only:
- Skeleton loading state instead of "Loading..."
- No structural changes

### `/leagues/join` — Join League
**Current:** Manual UUID + code entry.
**Proposed:**
- When URL params are pre-filled (from invite link), auto-submit on load if user is logged in
- Hide the "League ID" field when it's pre-filled from URL (show as read-only summary instead)
- Show league name + sport after validation (fetch league info on param load)

---

## 4. Interaction Simplification Plan

### Organizer Journey

| Action | Before (clicks) | After (clicks) | How |
|--------|:---:|:---:|-----|
| Submit result for scheduled match | 5+ (navigate to /record → select match → confirm players → enter score → submit) | 2 (tap "Submit Result" on match card → enter score → submit) | SubmitResultModal on match cards (already done) |
| Create running session | 3 (click Create Session → type raw ISO dates → save) | 3 (click Create Session → use datetime-local pickers → save) | Fix modal inputs |
| Resolve dispute | 3 (click Resolve → pick "Side A" or "Side B" → submit) | 3 (click Resolve → pick player names → submit) | Fix modal labels |

### Participant Journey

| Action | Before | After | How |
|--------|--------|-------|-----|
| Submit match result | Not possible from detail page (admin-only /record page) | 2 clicks from match card | SubmitResultModal (already done) |
| Confirm opponent's result | 2 (see pending review → click Confirm) | 2 (same, but now shows submitted result details in pending card) | Already done |
| Submit running time | 3 (click Submit My Run → type raw seconds → submit) | 3 (click Submit My Run → type MM:SS → submit) | Fix run entry modal |

### Running League Journey

| Action | Before | After | How |
|--------|--------|-------|-----|
| Log run time | Type raw elapsed seconds | Type minutes + seconds in split fields | RunEntryModal extraction |
| Create session with deadline | Type raw ISO string | Use `datetime-local` picker | CreateSessionModal extraction |
| View session status | Manual status text | StatusBadge | Already uses it for some badges |

### Invite/Join Journey

| Action | Before | After | How |
|--------|--------|-------|-----|
| Join via invite link | Link pre-fills form → manual submit | Link pre-fills + auto-joins if logged in | Join page enhancement |
| Copy invite link | Works | Same | No change needed |
| Send email invites | Works | Same | No change needed |

---

## 5. UI Component Strategy

### Components to Extract (new files in `src/components/leagues/`)

| Component | Source | Priority | Notes |
|-----------|--------|----------|-------|
| `MatchCard.tsx` | Detail page sections (Recent, Pending, Upcoming) | P0 | Variant-driven: "scheduled" / "pending_review" / "completed". Replaces 3 inline sections. |
| `RunningSessionCard.tsx` | Detail page :1826-1928 | P0 | Encapsulates session rendering + run list + admin review buttons |
| `StandingsTable.tsx` | Detail page :1581-1760 | P1 | Handles team standings, individual standings, doubles sub-table, running progress mode |
| `MembersList.tsx` | Detail page sidebar :2123-2171 | P1 | Avatar list with role badges |
| `ActionsPanel.tsx` | Detail page sidebar :2174-2263 | P1 | Context-sensitive action buttons |
| `InviteSection.tsx` | Detail page sidebar :2266-2331 | P1 | Code display, copy buttons, email invite trigger, invite status list |
| `DeleteLeagueModal.tsx` | Detail page :2967-2997 | P2 | Simple confirm modal |
| `EmailMembersModal.tsx` | Detail page :2386-2452 | P2 | Fix "X" close → SVG icon |
| `InviteModal.tsx` | Detail page :2454-2544 | P2 | Fix "X" close → SVG icon |
| `RejectModal.tsx` | Combine :2735-2763 + :2766-2795 | P2 | Generic reject modal (serves both result rejection and run rejection) |
| `ResolveDisputeModal.tsx` | Detail page :2798-2859 | P2 | Replace "Side A"/"Side B" with player names |
| `CreateSessionModal.tsx` | Detail page :2622-2684 | P2 | Replace ISO inputs with `datetime-local` |
| `RunEntryModal.tsx` | Detail page :2686-2733 | P2 | Replace "Elapsed Seconds" with MM:SS split fields |
| `ManageTeamsModal.tsx` | Detail page :2861-2963 | P2 | Fix "X" close → SVG icon |

### Components to Improve (existing)

| Component | File | Change |
|-----------|------|--------|
| `StatusBadge` | `src/components/leagues/StatusBadge.tsx` | No change needed |
| `SubmitResultModal` | `src/components/leagues/SubmitResultModal.tsx` | No change needed |
| `LeagueCard` | Currently inline in `leagues/page.tsx` | Extract + enhance with sport icon, avatar stack, season progress |

### Reuse from Events

| Pattern | Event source | League application |
|---------|-------------|-------------------|
| Search bar | `events/page.tsx` :262-273 | League listing search |
| Skeleton loading | `events/page.tsx` :318-327 | All league pages |
| Empty state with icon + CTA | `events/page.tsx` :329-342 | League listing empty states |
| Info row grid | `events/[id]/page.tsx` :684-722 | League detail info section (replaces plain key-value list) |
| SVG close button | `SubmitResultModal.tsx` :166-179 | All league modals |

---

## 6. Rollout Plan

### Phase 1: Quick Wins (low risk, high visibility)
**Scope:**
- Fix all modal close buttons ("X" text → SVG icon) in the 5 modals that still use text
- Fix RunEntryModal: replace "Elapsed Seconds" input with MM:SS split fields
- Fix CreateSessionModal: replace ISO text inputs with `<input type="datetime-local">`
- Fix ResolveDisputeModal: replace "Side A"/"Side B" labels with player names from match participants
- Replace manually-styled invite status badges with `StatusBadge` component
- Add skeleton loading states to league listing and detail pages

**Expected UX outcome:** Removes the 4 worst friction points. Modals feel finished. Loading feels faster.
**Risk:** Low — mostly input replacements and component swaps within existing code.
**Dependencies:** None.

### Phase 2: Component Extraction (medium risk, architectural)
**Scope:**
- Extract all 8 remaining inline modals into `src/components/leagues/` files
- Extract `MatchCard`, `RunningSessionCard`, `StandingsTable`, `MembersList`, `ActionsPanel`, `InviteSection` components
- Reduce detail page from ~3,001 to ~400-500 lines
- Extract `LeagueCard` from listing page and enhance with sport icon + avatar stack

**Expected UX outcome:** No visible change to users — this is a refactor for maintainability. But it enables Phase 3.
**Risk:** Medium — large refactor touching the core detail page. Must verify all interactions still work.
**Dependencies:** Phase 1 modal fixes should land first (so we extract the fixed versions).

### Phase 3: Full Polish (medium risk, feature additions)
**Scope:**
- League listing: add search bar + sport filter chips
- League listing: upgrade LeagueCard with richer layout (sport icon, avatar stack, progress indicator)
- League detail: upgrade info section to event-style info-row grid format
- Join page: auto-join when params are pre-filled, show league name preview
- Empty states: add icon + message + CTA (matching events pattern)
- Consider: add a cover/header image to league cards (using sport type fallback like events)

**Expected UX outcome:** Leagues feel on par with events. Discovery is easier. Join flow is seamless.
**Risk:** Medium — new features that need testing across tennis singles, tennis doubles (random + assigned), running leagues.
**Dependencies:** Phase 2 component extraction should be done first.

---

## 7. Acceptance Criteria

### Speed
- [ ] League listing renders skeleton within 100ms, data within 1s
- [ ] Detail page renders skeleton within 100ms, data within 2s
- [ ] Run entry modal: time input uses MM:SS, not raw seconds
- [ ] Create session modal: datetime inputs use native pickers, not raw ISO strings

### Comprehension
- [ ] Resolve dispute modal shows player names, not "Side A" / "Side B"
- [ ] All status badges use the `StatusBadge` component (no manual inline styling)
- [ ] Pending reviews show the submitted result details (winner + set scores)

### Consistency
- [ ] All modals use SVG close icon (no text "X")
- [ ] All modals follow same layout: title + subtitle top-left, close button top-right, form body, button row at bottom
- [ ] All action buttons use consistent sizing: `rounded-full`, `text-sm font-medium`
- [ ] Empty states use icon + message + CTA pattern

### Error Reduction
- [ ] `datetime-local` inputs prevent invalid date entry
- [ ] MM:SS fields validate range (seconds 0-59)
- [ ] Run entry auto-fills previous distance from session default

### Mobile (375px)
- [ ] All modals cap at `max-h-[85vh]` with `overflow-y-auto`
- [ ] Standings tables scroll horizontally
- [ ] Match cards stack actions vertically on small screens
- [ ] League listing cards are full-width on mobile

### Code Health
- [ ] Detail page is under 600 lines after refactor
- [ ] All extracted components have TypeScript props types
- [ ] `npm run lint` and `npm run build` pass with zero errors

---

## Critical Files

| File | Role | Action |
|------|------|--------|
| `src/app/leagues/[id]/page.tsx` | Main detail page (3,001 lines) | Refactor: extract components, fix modals |
| `src/app/leagues/page.tsx` | League listing (293 lines) | Enhance: search, filter, better cards, skeletons |
| `src/app/leagues/[id]/record/page.tsx` | Admin record page (~1,100 lines) | Minor: already has info banner |
| `src/app/leagues/create/page.tsx` | Create wizard (~500 lines) | Minor: skeleton loading only |
| `src/app/leagues/join/page.tsx` | Join page (171 lines) | Enhance: auto-join, league preview |
| `src/components/leagues/StatusBadge.tsx` | Status badge component | No changes |
| `src/components/leagues/SubmitResultModal.tsx` | Submit result modal | No changes |
| `src/lib/league-types.ts` | Shared types | No changes |
| `src/lib/league-utils.ts` | Shared utilities | May add new helpers |
| `src/components/EventCard.tsx` | Reference for card patterns | Read-only reference |

## Verification

After each phase:
```bash
cd /Users/cventer/Documents/MatUp/frontend
npm run lint
npm run build
```

Both must pass with zero errors. Manual test: open the detail page for a tennis league, a doubles league, and a running league. Verify all modals open/close, all actions work, standings render, and the page is responsive at 375px.
