# League UX Improvements

Three targeted improvements to the league workflow that reduce friction for hosts and joiners.

---

## 1. Prominent Team Setup for Assigned Doubles

### Current State

When a host creates an assigned doubles league (`scoring_format === "doubles"` and `rotation_type === "assigned"`), the tooling for team setup already exists:

- **`ManageTeamsModal`** (`src/components/leagues/ManageTeamsModal.tsx`) — a fully functional modal with a grid UI for pairing players into teams via dropdown selects, with duplicate-assignment prevention.
- **`SidebarActionsCard`** (`SidebarActionsCard.tsx`) — renders a "Manage Teams" button when `showManageTeamsAction` is true (i.e. `isOwnerOrAdmin && isAssignedDoubles`).
- **`SidebarAssignedTeamsCard`** (`SidebarAssignedTeamsCard.tsx`) — displays saved team pairs and shows a small amber warning when fewer than 2 teams exist:
  ```tsx
  <p className="mt-3 text-xs text-amber-600">
    Add at least 2 teams before generating the schedule.
  </p>
  ```

The warning is `text-xs` (12px) amber text tucked inside a sidebar card — easy to miss.

### Problem

When a host creates an assigned doubles league, there is no prominent indicator that teams need to be configured before a schedule can be generated. The only signal is the tiny sidebar warning. A new host is likely to look at the main content area, see no matches and no obvious call-to-action, and not understand what to do next.

### Proposed Solution

Add a prominent banner card in the **main content area** (above standings/matches) that appears when teams are not yet configured.

**Implementation:**

1. **`useLeagueDetailPage.ts`** — compute a new flag:
   ```ts
   const needsTeamSetup = isAssignedDoubles && assignedTeams.length < 2 && isOwnerOrAdmin;
   ```

2. **`types.ts`** — add `needsTeamSetup: boolean` to `LeagueDetailContentProps`.

3. **`LeagueDetailPageClient.tsx`** — pass `needsTeamSetup` through to `LeagueDetailContent`.

4. **`LeagueDetailContent.tsx`** — render a banner card when `needsTeamSetup` is true:
   - Positioned above the standings/matches section in the main content column.
   - Visually distinct: amber/orange background, icon, clear heading ("Set Up Your Doubles Teams").
   - Brief explanation: "Pair your members into fixed teams before generating the schedule."
   - A prominent "Set Up Teams" button that calls `onOpenAssignedTeamsModal` (reusing the existing modal).
   - The banner disappears once `assignedTeams.length >= 2`.

**Files involved:**

| File | Change |
|------|--------|
| `src/features/leagues/hooks/useLeagueDetailPage.ts` | Add `needsTeamSetup` computed flag |
| `src/features/leagues/components/detail/types.ts` | Add `needsTeamSetup` to props type |
| `src/features/leagues/components/detail/LeagueDetailContent.tsx` | Render banner when flag is true |
| `src/features/leagues/components/detail/LeagueDetailPageClient.tsx` | Pass prop through |

---

## 2. Always Show Generate Schedule Button

### Current State

The "Generate Schedule" button in `SidebarActionsCard` is **conditionally rendered** based on a single `canGenerateSchedule` flag that combines both visibility and eligibility:

```ts
// useLeagueDetailPage.ts
const hasConfiguredAssignedTeams = !isAssignedDoubles || assignedTeams.length >= 2;
const canGenerateSchedule =
  isOwnerOrAdmin &&
  ((isRacketLeague &&
    scheduledMatches.length === 0 &&
    (isDoubles
      ? members.length >= 4 && hasConfiguredAssignedTeams
      : members.length >= 2)) ||
    (isRunningLeague && sortedRunningSessions.length === 0 && members.length >= 1));
```

In `SidebarActionsCard.tsx`, the button is only rendered when `canGenerateSchedule` is true:

```tsx
{canGenerateSchedule && (
  <button onClick={onHandleGenerateSchedule} disabled={generating} ...>
    {generating ? "Generating..." : "Generate Schedule"}
  </button>
)}
```

This means the button is **completely hidden** when the member count is too low or teams aren't configured — the host sees no indication that the button exists or what prerequisites are needed.

### Problem

Hosts don't know the "Generate Schedule" button exists until all prerequisites are met. There is no feedback about what's needed. A host with 1 member in a singles league sees an empty actions card and has no idea that adding one more member will unlock schedule generation.

### Proposed Solution

Split the single flag into two: one for **visibility** and one for **enabled state**. The button is always visible to owner/admins (when no schedule exists), but disabled with a helpful message when requirements aren't met.

**Implementation:**

1. **`useLeagueDetailPage.ts`** — split into two flags and add a message:

   ```ts
   // Visibility: owner/admin + no existing schedule/sessions
   const showGenerateSchedule =
     isOwnerOrAdmin &&
     ((isRacketLeague && scheduledMatches.length === 0) ||
      (isRunningLeague && sortedRunningSessions.length === 0));

   // Enabled: full prerequisite check
   const canGenerateSchedule =
     showGenerateSchedule &&
     ((isRacketLeague &&
       (isDoubles
         ? members.length >= 4 && hasConfiguredAssignedTeams
         : members.length >= 2)) ||
      (isRunningLeague && members.length >= 1));

   // Disabled reason message
   const generateScheduleMessage: string | null = showGenerateSchedule && !canGenerateSchedule
     ? isRunningLeague
       ? "You need at least 1 member to generate sessions."
       : isDoubles
         ? isAssignedDoubles && assignedTeams.length < 2
           ? "Set up your doubles teams before generating the schedule."
           : members.length < 4
             ? "You need at least 4 members to generate a schedule."
             : null
         : members.length < 2
           ? "You need at least 2 members to generate a schedule."
           : null
     : null;
   ```

2. **`types.ts`** — add to `LeagueDetailContentProps`:
   ```ts
   showGenerateSchedule: boolean;
   generateScheduleMessage: string | null;
   ```
   (Keep the existing `canGenerateSchedule` for the enabled/disabled state.)

3. **`SidebarActionsCard.tsx`** — update rendering:
   ```tsx
   {showGenerateSchedule && (
     <div className="sm:col-span-2">
       <button
         onClick={onHandleGenerateSchedule}
         disabled={generating || !canGenerateSchedule}
         className="w-full inline-flex items-center justify-center px-3 py-2.5
           border border-orange-500 text-orange-500 rounded-full text-sm font-medium
           hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
       >
         {generating
           ? "Generating..."
           : isRunningLeague
             ? "Generate Sessions"
             : "Generate Schedule"}
       </button>
       {generateScheduleMessage && (
         <p className="mt-1.5 text-xs text-amber-600 text-center">
           {generateScheduleMessage}
         </p>
       )}
     </div>
   )}
   ```

**Files involved:**

| File | Change |
|------|--------|
| `src/features/leagues/hooks/useLeagueDetailPage.ts` | Split flags, add `generateScheduleMessage` |
| `src/features/leagues/components/detail/types.ts` | Add `showGenerateSchedule`, `generateScheduleMessage` |
| `src/features/leagues/components/detail/SidebarActionsCard.tsx` | Use split flags, render disabled state + message |

---

## 3. Simplify Join by Invite Code Only

### Current State

The join page (`src/app/leagues/join/page.tsx`) presents **three input fields**:

| Field | Label | Placeholder |
|-------|-------|-------------|
| `leagueId` | "League ID" | `"league UUID"` |
| `inviteCode` | "Invite Code" | `"e.g. A1B2C3D4"` or `"Optional when invite token exists"` |
| `inviteToken` | "Invite Token (optional)" | `"auto-filled from invite email"` |

The current invite link format (generated in `useLeagueDetailPage.ts` `handleCopyInviteLink`) is:

```
{origin}/leagues/join?leagueId={league.id}&code={inviteCode}
```

Email invite links (generated in `backend/src/routes/league-invites.ts`) add the token:

```
{origin}/leagues/join?leagueId={league.id}&code={inviteCode}&inviteToken={token}
```

Invite codes are 8-character uppercase hex strings generated via `randomBytes(4).toString('hex').toUpperCase()` in `league.service.ts`. They are stored in the `leagues.invite_code` column and are unique per league.

The join endpoint (`POST /api/leagues/:leagueId/join`) requires the `leagueId` as a URL parameter and accepts `{ inviteCode, inviteToken }` in the body.

### Problem

Requiring users to provide a League ID (a UUID like `550e8400-e29b-41d4-a716-446655440000`) alongside an invite code is unnecessary friction. The invite code is already unique per league, so the league can be resolved from the code alone. When a user receives a code verbally (e.g. "join my league, the code is A1B2C3D4"), they currently also need the UUID — which nobody can remember or type.

### Proposed Solution

Allow joining with just the invite code by adding a backend endpoint that resolves a league from its code.

**Backend changes:**

1. **New endpoint** in `league-invites.ts`:

   ```
   GET /api/leagues/preview-by-code/:code
   ```

   - Requires authentication (logged-in user).
   - Looks up `leagues` table by `invite_code` (case-insensitive comparison).
   - Returns `{ id, name, sport_type, scoring_format }` — enough for a preview.
   - Returns 404 if no league matches.
   - This is a read-only preview; joining still uses the existing `POST /:id/join` endpoint.

2. **Update email invite link format** to omit `leagueId`:

   ```
   {FRONTEND_URL}/leagues/join?code={inviteCode}&inviteToken={token}
   ```

**Frontend changes:**

3. **Simplify `src/app/leagues/join/page.tsx`**:

   - **Single visible input**: "Invite Code" — an 8-character uppercase hex field.
   - On input (debounced or on submit), call `GET /api/leagues/preview-by-code/:code`.
   - Display a league preview card (name, sport type, format) once resolved.
   - "Join League" button calls the existing `POST /api/leagues/:id/join` using the `id` returned from the preview.
   - **Backwards compatibility**: If `?leagueId=` is present in the URL (old-format links), use it directly for the join call without requiring the preview lookup. Don't show the League ID field in the UI.
   - **Invite token handling**: If `?inviteToken=` is present (email links), read it from the URL silently and include it in the join request body. Don't show the field in the UI.

4. **Update `handleCopyInviteLink`** in `useLeagueDetailPage.ts`:

   ```ts
   const link = `${window.location.origin}/leagues/join?code=${inviteCode}`;
   ```

   Simplified from the current format that includes `leagueId`.

**Join flow after changes:**

```
User enters code "A1B2C3D4"
  -> GET /api/leagues/preview-by-code/A1B2C3D4
  <- { id: "550e...", name: "Tuesday Tennis", sport_type: "tennis", scoring_format: "singles" }
  -> UI shows: "Tuesday Tennis - Tennis Singles"
  -> User clicks "Join League"
  -> POST /api/leagues/550e.../join { inviteCode: "A1B2C3D4" }
  <- Success -> redirect to /leagues/550e...
```

**Files involved:**

| File | Change |
|------|--------|
| `backend/src/routes/league-invites.ts` | Add `GET /preview-by-code/:code` endpoint, update email link format |
| `src/app/leagues/join/page.tsx` | Simplify to single input + preview-based flow |
| `src/features/leagues/hooks/useLeagueDetailPage.ts` | Update `handleCopyInviteLink` to omit `leagueId` |

---

## Source Files Referenced

| File | Purpose |
|------|---------|
| `src/features/leagues/hooks/useLeagueDetailPage.ts` | All computed flags, handlers, state for league detail page |
| `src/features/leagues/components/detail/SidebarActionsCard.tsx` | League Actions card — Generate Schedule + Manage Teams buttons |
| `src/features/leagues/components/detail/SidebarAssignedTeamsCard.tsx` | Assigned teams display + `text-xs` amber warning |
| `src/features/leagues/components/detail/types.ts` | `LeagueDetailContentProps` type definition |
| `src/components/leagues/ManageTeamsModal.tsx` | Team assignment modal (grid of player pair dropdowns) |
| `src/app/leagues/join/page.tsx` | Join page with League ID, Invite Code, Invite Token fields |
| `backend/src/routes/league-invites.ts` | Join endpoint + email invite link construction |
| `backend/src/services/league.service.ts` | `ensureLeagueInviteCode()` — 8-char hex code generation via `randomBytes(4)` |
