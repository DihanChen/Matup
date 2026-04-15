# MatUp Playwright E2E Testing Plan

## Context

MatUp is a fitness partner matching and league management platform (Next.js 16, React 19, Supabase). It currently has only basic unit tests — no end-to-end testing exists. This plan establishes comprehensive Playwright-based E2E testing using the Playwright MCP browser tools and Supabase MCP tools to seed test data and automate browser interactions. The goal is to find real bugs across authentication, events, leagues, courts, and social features.

## Approach

We will use **Playwright MCP tools** (browser_navigate, browser_snapshot, browser_click, browser_fill_form, etc.) for browser automation and **Supabase MCP tools** (execute_sql) for test data seeding. No formal Playwright test runner setup — we execute tests interactively via MCP.

---

## Phase 1: Test Data Setup (Seed via Supabase)

### 1.1 Create Test Users (via Supabase Auth + SQL)
- Create 6+ test player accounts with known credentials
- Ensure profiles exist in `profiles` table
- Players: `testplayer1@matup.test` through `testplayer6@matup.test`

### 1.2 Seed Test Courts
- Verify existing 56 courts are available
- Create 1-2 additional test courts with known coordinates if needed

### 1.3 Seed Test Events
- Create events with various sport types, dates, participant counts
- Ensure some events are in the future (joinable) and some in the past

### 1.4 Seed Test Leagues
- Create leagues for each sport type (Tennis, Pickleball, Running)
- Add members, generate fixtures, create seasons
- Set up various league states (active, with results, with disputes)

---

## Phase 2: Authentication Tests (P0 — Critical)

| # | Test | Steps | Expected |
|---|------|-------|----------|
| A1 | Signup with email/password | Navigate to `/signup`, fill form, submit | Account created, redirected to dashboard |
| A2 | Signup validation | Submit with mismatched passwords, short password, missing fields | Appropriate error messages shown |
| A3 | Login with valid credentials | Navigate to `/login`, enter credentials, submit | Logged in, redirected to dashboard |
| A4 | Login with invalid credentials | Wrong password, non-existent email | Error message, stays on login page |
| A5 | Logout | Click user menu → logout | Session cleared, redirected to landing |
| A6 | Protected route redirect | Visit `/events/create` while logged out | Redirect to `/login?next=/events/create` |
| A7 | Forgot password flow | Navigate to `/forgot-password`, submit email | Success message shown |
| A8 | Session persistence | Login, navigate away, return | Still authenticated |
| A9 | Google OAuth button | Click "Continue with Google" | OAuth popup/redirect initiates |

---

## Phase 3: Event Tests (P0/P1)

### 3.1 Event Discovery (P0)
| # | Test | Steps | Expected |
|---|------|-------|----------|
| E1 | Map view loads | Navigate to `/events` | Map renders, markers visible for events |
| E2 | Swipe view loads | Switch to swipe mode | Swipe cards displayed |
| E3 | Sport filter | Select "Tennis" from filter | Only tennis events shown |
| E4 | Search functionality | Type in search bar | Results filtered accordingly |
| E5 | Toggle Games/Courts | Click Courts toggle | Court markers shown on map |

### 3.2 Event Creation (P0)
| # | Test | Steps | Expected |
|---|------|-------|----------|
| E6 | Full event creation wizard | Login → `/events/create` → Step 1 (sport) → Step 2 (when/where) → Step 3 (details) → Submit | Event created, redirected to event detail |
| E7 | Step validation | Try to advance without required fields | Validation errors shown, can't proceed |
| E8 | Location autocomplete | Type location in Step 2 | Suggestions appear, selection sets coordinates |
| E9 | Back navigation in wizard | Go to Step 3, click back | Returns to Step 2 with data preserved |

### 3.3 Event Detail & Interactions (P0)
| # | Test | Steps | Expected |
|---|------|-------|----------|
| E10 | View event detail | Navigate to `/events/[id]` | Event info, participants, host info displayed |
| E11 | Join event | Click join as non-host user | Added to participants list, count updates |
| E12 | Leave event | Click cancel participation | Removed from participants, count updates |
| E13 | Join full event | Try to join event at max capacity | Appropriate error/disabled state |
| E14 | Host actions visible | View event as host | Email, edit, cancel buttons visible |
| E15 | Non-host can't edit | View event as participant | No edit/manage controls shown |
| E16 | Add comment | Type and submit comment | Comment appears in list |
| E17 | Submit review | Submit review for participant | Rating saved, review shown |

### 3.4 Event Edit (P1)
| # | Test | Steps | Expected |
|---|------|-------|----------|
| E18 | Edit event | Host navigates to edit, changes title | Event updated successfully |
| E19 | Cancel event | Host cancels event | Event cancelled, participants notified |
| E20 | Non-host can't access edit | Non-host navigates to `/events/[id]/edit` | Redirect or error |

---

## Phase 4: League Tests (P0/P1) — Most Complex

### 4.1 League Creation (P0)
| # | Test | Steps | Expected |
|---|------|-------|----------|
| L1 | Create Tennis season league | Full 4-step wizard: Sport→Details→Schedule→Invite | League created with correct settings |
| L2 | Create Pickleball doubles league | Select doubles format | Doubles-specific options shown |
| L3 | Create Running league | Select running sport | Running-specific options (comparison mode) shown |
| L4 | Create Tournament league | Select tournament type | Tournament-specific options shown |
| L5 | Wizard validation | Skip required fields | Validation prevents advancement |
| L6 | Invite friends in Step 4 | Enter email addresses | Invites sent |

### 4.2 League Join & Membership (P0)
| # | Test | Steps | Expected |
|---|------|-------|----------|
| L7 | Join via invite code | Navigate to `/leagues/join`, enter code | Joined league, appears in members |
| L8 | Join via invite link | Click invite link | Joined league |
| L9 | Leave league | Click leave button | Removed from members |
| L10 | Max members enforcement | Join when league is full | Rejection message |
| L11 | Owner vs member views | Compare views | Owner sees admin controls, member doesn't |

### 4.3 Fixtures & Matches (P0)
| # | Test | Steps | Expected |
|---|------|-------|----------|
| L12 | Generate fixtures | Owner clicks generate | Fixtures created for all weeks |
| L13 | View fixture schedule | Navigate to schedule tab | Calendar/list of matches shown |
| L14 | Submit match result | Player submits result | Result saved as pending |
| L15 | Confirm result (other side) | Opponent confirms | Result confirmed, standings update |
| L16 | Dispute result | Opponent disagrees | Fixture marked as disputed |
| L17 | Resolve dispute (admin) | Owner resolves dispute | Dispute resolved, standings update |
| L18 | Reject submission | Admin rejects result with reason | Result rejected, notification shown |
| L19 | Reschedule match | Reschedule fixture | Date/time updated |

### 4.4 Standings & Seasons (P1)
| # | Test | Steps | Expected |
|---|------|-------|----------|
| L20 | View standings | Navigate to standings tab | Rankings shown with correct order |
| L21 | Standings after results | Submit results, check standings | Points/ranking updated correctly |
| L22 | Season management | Create new season | New season available, fixtures reset |
| L23 | Switch between seasons | Use season picker | Correct fixtures/standings shown |

### 4.5 Running League Features (P1)
| # | Test | Steps | Expected |
|---|------|-------|----------|
| L24 | Create running session | Owner creates time trial session | Session created, visible to members |
| L25 | Submit run entry | Member submits time/distance | Entry recorded |
| L26 | Finalize session | Owner finalizes session | Results locked, standings update |

### 4.6 Team Management — Doubles (P1)
| # | Test | Steps | Expected |
|---|------|-------|----------|
| L27 | Assign teams | Owner assigns partner pairs | Teams saved correctly |
| L28 | View assigned teams | Members see their team | Team displayed in sidebar |

### 4.7 League Communication (P2)
| # | Test | Steps | Expected |
|---|------|-------|----------|
| L29 | Post announcement | Owner creates announcement | Visible to all members |
| L30 | Email members | Owner sends email via template | Email sent successfully |
| L31 | Invite via email | Send invite to new email | Invite created in league_invites |

### 4.8 League Admin (P1)
| # | Test | Steps | Expected |
|---|------|-------|----------|
| L32 | Edit league details | Owner edits name/description | Changes saved |
| L33 | Delete league | Owner deletes league | League removed |
| L34 | Generate playoffs | Owner generates playoff bracket | Bracket created |

---

## Phase 5: Court Tests (P2)

| # | Test | Steps | Expected |
|---|------|-------|----------|
| C1 | View court detail | Navigate to `/courts/[id]` | Court info, map, reviews displayed |
| C2 | Submit court review | Submit rating + comment | Review saved, rating updates |
| C3 | Courts on map | Toggle courts in explore view | Court markers visible |

---

## Phase 6: Social & Profile Tests (P1)

| # | Test | Steps | Expected |
|---|------|-------|----------|
| S1 | View own profile | Navigate to `/profile` | Redirects to `/users/[id]` with user info |
| S2 | View other profile | Navigate to `/users/[other-id]` | Public profile displayed |
| S3 | Send friend request | Click add friend | Request created as pending |
| S4 | Accept friend request | Accept incoming request | Friendship established |
| S5 | Decline friend request | Decline request | Request removed |
| S6 | View friends list | Navigate to `/friends` | Friends and pending requests shown |

---

## Phase 7: Navigation & UI Tests (P1)

| # | Test | Steps | Expected |
|---|------|-------|----------|
| N1 | Navbar logged out | Visit site logged out | Shows Explore, Host, Login links |
| N2 | Navbar logged in | Login and check navbar | Shows user menu, dashboard link |
| N3 | Dashboard loads | Navigate to `/dashboard` | User's events categorized correctly |
| N4 | 404 handling | Navigate to invalid route | Appropriate error page |
| N5 | Loading states | Navigate to data-heavy pages | Skeletons/spinners shown during load |
| N6 | Footer links | Check privacy, terms, contact | Links present and functional |

---

## Phase 8: Edge Cases & Bug Hunting (P1)

| # | Test | Steps | Expected |
|---|------|-------|----------|
| X1 | Double join event | Click join twice rapidly | Only one participation record |
| X2 | Edit non-owned event | Directly navigate to edit URL | Access denied |
| X3 | Join own event | Host tries to join | Appropriate handling |
| X4 | Empty state handling | View leagues/events with no data | "No results" messages shown |
| X5 | Form XSS | Submit `<script>` in event title | Input sanitized, no execution |
| X6 | Long text inputs | Submit very long descriptions | Handled gracefully (truncation or scroll) |
| X7 | Past event interactions | Try to join past event | Join disabled |
| X8 | Concurrent result submission | Both sides submit different results | Dispute workflow triggers |

---

## Execution Order

1. **Seed data** via Supabase (create test users, ensure events/leagues exist)
2. **Auth tests** (A1-A9) — establishes working login for all subsequent tests
3. **Event discovery** (E1-E5) — verify browse works
4. **Event CRUD** (E6-E20) — create, join, edit, review
5. **League creation** (L1-L6) — create leagues of each type
6. **League membership** (L7-L11) — join/leave
7. **Fixtures & results** (L12-L19) — core league gameplay
8. **Standings & seasons** (L20-L23) — verification
9. **Running/doubles** (L24-L28) — sport-specific features
10. **Social** (S1-S6) — friends and profiles
11. **Courts** (C1-C3) — venue features
12. **Navigation & UI** (N1-N6) — general UX
13. **Edge cases** (X1-X8) — bug hunting

## Verification

After each test phase:
- Check Supabase tables for correct data state via `execute_sql`
- Take browser snapshots/screenshots for visual verification
- Document any bugs found with reproduction steps

## Key Files to Monitor
- `src/features/events/` — Event components and logic
- `src/features/leagues/` — League components (most complex area)
- `src/features/courts/` — Court features
- `src/features/social/` — Friends system
- `src/lib/queries/` — Data access layer
- `src/app/` — Route definitions and page shells
