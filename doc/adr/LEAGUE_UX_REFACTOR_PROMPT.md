# Agent Prompt: League UX Refactor

You are refactoring the league feature in the MatUp frontend (`/Users/cventer/Documents/MatUp/frontend`). This is a Next.js 16 / React 19 / TypeScript strict / Tailwind v4 app with a Supabase backend. Read the project CLAUDE.md files at `frontend/.claude/CLAUDE.md` and `backend/.claude/CLAUDE.md` for conventions.

## Goal

1. **Enable participants to submit match results** directly from the league detail page (currently only admins can, via a separate `/record` page).
2. **Reduce score-logging friction** from 5+ clicks to ≤3 interactions.
3. **Extract the 3,131-line monolith** (`src/app/leagues/[id]/page.tsx`) into reusable components.
4. **Polish status badges, running time input, and match card UX**.
5. **Do NOT change any backend code or API contracts** — the backend already supports everything needed.

## Constraints

- No new npm dependencies.
- No backend changes — all APIs already support participant submission.
- Preserve all existing functionality (tennis singles/doubles, running, assigned teams, invite flows, email, disputes).
- Follow existing styling: Tailwind only, orange-500 accent, zinc neutrals, rounded-full buttons, rounded-2xl cards.
- All components use `"use client"` when they use hooks.
- Run `npm run lint` and `npm run build` after each phase to verify.

---

## Phase 1: Shared Types & Utilities

### Step 1.1: Create `src/lib/league-types.ts`

Read `src/app/leagues/[id]/page.tsx` lines 16-177. Move all type definitions AND the two constant maps to this new file, exported. The types to extract:

```
League, LeagueMember, LeagueMatch, ApiFixtureParticipant, ApiFixture, ApiStandingsResponse, RunningMode, LeagueInvite, ApiInvitesResponse, RunningSessionRun, RunningSession, ApiRunningSessionsResponse, AssignedTeamPair, ApiAssignedTeamsResponse
```

Also export the constants:
```
FORMAT_LABELS, ROTATION_LABELS, EMAIL_REGEX
```

Also move these helper functions from the detail page (lines 180-268) into this file:
```
mapFixtureStatusToMatchStatus, mapFixturesToLegacyMatches, sortMatchesByCreatedAt, mergeWorkflowMatches, getRunningModeFromRules
```

Add one new type for the submit result payload:
```typescript
export type SubmitResultPayload = {
  winner: "A" | "B";
  sets?: number[][];
  notes?: string;
};
```

Keep importing `ScoringFormat`, `Standing`, `TeamStanding` from `@/lib/rankings` — re-export them from `league-types.ts` for convenience.

### Step 1.2: Create `src/lib/league-utils.ts`

Extract these utility functions (duplicated in both page.tsx and record/page.tsx):

```typescript
export function getInitials(name: string | null): string {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function formatDistance(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)}km` : `${meters}m`;
}
```

### Step 1.3: Update existing pages

Update `src/app/leagues/[id]/page.tsx` and `src/app/leagues/[id]/record/page.tsx` to import types, constants, and helpers from the shared files instead of defining them locally. Remove the local definitions. Verify build passes.

---

## Phase 2: Extract Components

Create `src/components/leagues/` directory. Extract components one at a time, verifying the build after each.

### Step 2.1: `StatusBadge.tsx`

A small, standardized badge component that replaces the inconsistent inline badge styling across the page.

```typescript
"use client";

type StatusBadgeProps = {
  status: string;
  label?: string;
};

const STATUS_STYLES: Record<string, string> = {
  scheduled: "bg-blue-50 text-blue-700",
  awaiting_confirmation: "bg-amber-50 text-amber-700",
  completed: "bg-orange-50 text-orange-600",
  disputed: "bg-red-50 text-red-700",
  cancelled: "bg-zinc-100 text-zinc-500",
  open: "bg-emerald-50 text-emerald-700",
  closed: "bg-zinc-100 text-zinc-500",
  finalized: "bg-orange-50 text-orange-600",
  submitted: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-600",
  pending: "bg-amber-50 text-amber-700",
  accepted: "bg-emerald-50 text-emerald-700",
  expired: "bg-zinc-100 text-zinc-500",
  active: "bg-orange-50 text-orange-600",
  your_match: "bg-orange-50 text-orange-600",
  awaiting_opponent: "bg-amber-50 text-amber-700",
};

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] || "bg-zinc-100 text-zinc-500";
  const displayLabel = label || status.replace(/_/g, " ");
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${style}`}>
      {displayLabel}
    </span>
  );
}
```

### Step 2.2: Extract Modal Components

For EACH of the following modals, read the exact JSX from `src/app/leagues/[id]/page.tsx` at the noted line ranges, then create a self-contained component file. Each modal:
- Takes `isOpen: boolean` and `onClose: () => void` props
- Returns `null` if `!isOpen`
- Manages its own form field state internally (subject, message, emails, etc.)
- Calls the parent's action callback on submit
- Uses an SVG X icon for the close button (not literal "X" text):
  ```tsx
  <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg" aria-label="Close">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  </button>
  ```

**`DeleteLeagueModal.tsx`** (source: lines 3097-3127)
Props: `isOpen`, `onClose`, `onConfirm: () => void`, `deleting: boolean`, `leagueName: string`, `memberCount: number`

**`EmailMembersModal.tsx`** (source: lines 2532-2598)
Props: `isOpen`, `onClose`, `recipientCount: number`, `onSend: (subject: string, message: string) => Promise<void>`, `sending: boolean`, `error: string | null`, `success: string | null`
Internal state: `subject`, `message`

**`InviteModal.tsx`** (source: lines 2600-2690)
Props: `isOpen`, `onClose`, `onSend: (emails: string[]) => Promise<void>`, `sending: boolean`, `error: string | null`, `success: string | null`
Internal state: `emailInput`, `emails[]`
Keep the email validation regex and add-from-input logic inside this component.

**`RejectModal.tsx`** (source: lines 2865-2894 and 2896-2926 — combine into one generic modal)
Props: `isOpen`, `onClose`, `onConfirm: (reason: string) => void`, `title: string`, `subtitle?: string`, `submitting: boolean`
Internal state: `reason`
This replaces both the reject-submission modal and the reject-run modal.

**`ResolveDisputeModal.tsx`** (source: lines 2928-2989)
Props: `isOpen`, `onClose`, `onResolve: (winner: "A" | "B", reason: string) => void`, `sideANames: string`, `sideBNames: string`, `resolving: boolean`
Internal state: `winner`, `reason`
**Improvement**: Label the buttons with player names instead of "Side A" / "Side B".

**`CreateSessionModal.tsx`** (source: lines 2752-2814)
Props: `isOpen`, `onClose`, `onCreate: (params: { weekNumber: number; distanceMeters: number; startsAt?: string; deadline?: string }) => void`, `creating: boolean`, `defaultWeek: number`
Internal state: `week`, `distance`, `startsAt`, `deadline`
**Improvement**: Use `<input type="datetime-local">` instead of raw ISO text input. Convert to ISO on submit.

**`RunEntryModal.tsx`** (source: lines 2816-2863)
Props: `isOpen`, `onClose`, `onSubmit: (elapsedSeconds: number, distanceMeters: number) => void`, `submitting: boolean`, `weekLabel: string`, `defaultDistanceMeters: number`, `existingRun?: { elapsed_seconds: number; distance_meters: number } | null`
Internal state: `minutes`, `seconds`, `distance`
**Improvement**: Replace "Elapsed Seconds" single input with MM:SS split fields. Convert to/from total seconds internally. Show distance using `formatDistance()`.

**`ManageTeamsModal.tsx`** (source: lines 2991-3094)
Props: `isOpen`, `onClose`, `onSave: (pairs: Array<{ playerAId: string; playerBId: string }>) => Promise<void>`, `saving: boolean`, `members: Array<{ user_id: string; name: string | null }>`, `initialPairs: Array<{ playerAId: string; playerBId: string }>`, `error: string | null`
Internal state: `drafts[]`
Keep the duplicate detection and validation logic inside the component.

### Step 2.3: Extract Section Components

**`StandingsTable.tsx`** (source: lines 1783-1963)
Props:
```typescript
{
  standings: Standing[];
  teamStandings: TeamStanding[];
  scoringFormat: ScoringFormat;
  isDoubles: boolean;
  isTennis: boolean;
  isRunningProgressMode: boolean;
}
```
Uses `getInitials` from `@/lib/league-utils`. Links player names to `/users/{user_id}`. Renders both team standings (if doubles) and individual standings.

**`MatchCard.tsx`** (critical — this is where submit buttons will live)
Source: combines logic from the Upcoming Matches section (lines 2199-2263), Pending Reviews section (lines 2138-2197), and Recent Results section (lines 1966-1999).

```typescript
type MatchCardProps = {
  match: LeagueMatch;
  league: League;
  currentUserId: string | null;
  isOwnerOrAdmin: boolean;
  variant: "scheduled" | "pending_review" | "completed";
  onSubmitResult?: (match: LeagueMatch) => void;
  onConfirmResult?: (match: LeagueMatch) => void;
  onRejectResult?: (match: LeagueMatch) => void;
  onResolveDispute?: (match: LeagueMatch) => void;
  reviewingSubmissionId?: string | null;
  resolvingFixtureId?: string | null;
};
```

Rendering logic per variant:

**`variant === "scheduled"`:**
- Show week number, player names (Side A vs Side B), date, status badge
- Determine actions:
  - `const userIsParticipant = match.participants.some(p => p.user_id === currentUserId);`
  - `const isWorkflow = match.source === "workflow";`
  - `const canSubmit = isWorkflow && (userIsParticipant || isOwnerOrAdmin) && match.workflow_status === "scheduled";`
  - If `canSubmit`: show orange "Submit Result" button calling `onSubmitResult`
  - If match has pending submission and user is opponent (not submitter): show Confirm/Reject
  - If match is disputed and admin: show "Resolve Dispute" button
- Contextual badge: show "Your match" if `userIsParticipant`

**`variant === "pending_review"`:**
- Show week number, player names, date, "Awaiting Confirmation" badge
- **NEW: Show submitted result details** — extract winner and set scores from `match.latest_submission.payload`:
  ```tsx
  {match.latest_submission?.payload && (
    <div className="mt-2 p-2.5 bg-white rounded-lg border border-zinc-100">
      <div className="text-xs text-zinc-500 mb-1">
        Submitted result:
      </div>
      <div className="text-sm font-medium">
        Winner: <span className="text-orange-500">
          {match.latest_submission.payload.winner === "A" ? sideANames : sideBNames}
        </span>
      </div>
      {match.latest_submission.payload.sets && (
        <div className="text-xs text-zinc-500 mt-0.5">
          {match.latest_submission.payload.sets.map((s: number[]) => `${s[0]}-${s[1]}`).join(", ")}
        </div>
      )}
    </div>
  )}
  ```
- Show Confirm / Reject buttons

**`variant === "completed"`:**
- Reuse the `formatMatchResult` logic from the detail page (lines 1617-1728)
- Show completed badge

**`RunningSessionCard.tsx`** (source: lines 2029-2131)
Props:
```typescript
{
  session: RunningSession;
  isOwnerOrAdmin: boolean;
  onSubmitRun: (session: RunningSession) => void;
  onFinalizeSession: (sessionId: string) => void;
  onApproveRun: (sessionId: string, runId: string) => void;
  onRejectRun: (sessionId: string, runId: string, runnerName: string) => void;
  submittingRunSessionId: string | null;
  finalizingSessionId: string | null;
  reviewingRunId: string | null;
}
```
Uses `formatDuration` and `formatDistance` from `@/lib/league-utils`.

**`MembersList.tsx`** (source: lines 2268-2317)
Props: `members: LeagueMember[]`, `currentUserId: string | null`, `maxMembers: number`
Links to `/users/{user_id}`. Shows avatar/initials, name, role badge.

**`LeagueActions.tsx`** (source: lines 2319-2410)
Props for all the action button states and callbacks (record results, manage teams, email, generate schedule, join, leave, delete).

**`InviteSection.tsx`** (source: lines 2412-2478)
Props: invite code, invites list, copy handlers, invite-by-email trigger, error/success.

### Step 2.4: Update `LeagueMatch` type

In `src/lib/league-types.ts`, update the `latest_submission` field on `LeagueMatch` to include `payload`:

```typescript
latest_submission?: {
  id: string;
  submitted_by: string;
  source: "organizer" | "participant";
  status: "pending" | "accepted" | "rejected" | "superseded";
  payload?: {
    winner?: "A" | "B";
    sets?: number[][];
  };
} | null;
```

Update `mapFixturesToLegacyMatches` to carry the payload through for pending submissions:

In the mapping, change the `latest_submission` construction to include payload when status is pending:
```typescript
latest_submission: fixture.latest_submission?.id && fixture.latest_submission?.submitted_by && fixture.latest_submission?.source && fixture.latest_submission?.status
  ? {
      id: fixture.latest_submission.id,
      submitted_by: fixture.latest_submission.submitted_by,
      source: fixture.latest_submission.source,
      status: fixture.latest_submission.status,
      payload: fixture.latest_submission.status === "pending" ? fixture.latest_submission.payload : undefined,
    }
  : null,
```

---

## Phase 3: SubmitResultModal (Biggest UX Win)

### Step 3.1: Create `src/components/leagues/SubmitResultModal.tsx`

This is the critical new component. It enables inline score submission directly from match cards — no separate page navigation.

```typescript
"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { getApiBaseUrl } from "@/lib/api";

type SetScore = { a: string; b: string };

type SubmitResultModalProps = {
  isOpen: boolean;
  onClose: () => void;
  fixtureId: string;
  weekNumber: number | null;
  sideA: { userId: string; name: string | null }[];
  sideB: { userId: string; name: string | null }[];
  onSuccess: () => void;
};
```

**Internal state:**
- `scoreMode: "simple" | "detailed"` (default "simple")
- `winner: "A" | "B" | ""`
- `sets: SetScore[]` (default `[{ a: "", b: "" }]`)
- `notes: string`
- `submitting: boolean`
- `error: string | null`

**UI structure:**
```
┌─────────────────────────────────────────┐
│ Submit Result                       [X] │
│ Week {weekNumber}                       │
│                                         │
│ {sideA names}  vs  {sideB names}        │
│                                         │
│ [ Winner Only ] [ Set Scores ]          │
│                                         │
│ (Winner Only mode):                     │
│ ┌──────────────┐ ┌──────────────┐       │
│ │ {sideA names}│ │ {sideB names}│       │
│ │    wins      │ │    wins      │       │
│ └──────────────┘ └──────────────┘       │
│                                         │
│ (Set Scores mode):                      │
│ Set 1:  [6] - [4]                       │
│ Set 2:  [3] - [6]                       │
│ + Add Set                               │
│ Winner: {detected winner names}         │
│                                         │
│ Notes (optional): [____________]        │
│                                         │
│ [  Submit Result  ] [  Cancel  ]        │
└─────────────────────────────────────────┘
```

**Submit handler:**
- Get auth session from Supabase
- Determine final winner (from explicit selection in simple mode, or auto-detected from set scores in detailed mode)
- Parse set scores if in detailed mode
- Call `POST ${getApiBaseUrl()}/api/fixtures/${fixtureId}/results/submit` with:
  ```json
  { "payload": { "winner": "A", "sets": [[6,4],[6,3]], "notes": "..." } }
  ```
- On success: call `onSuccess()`, close modal
- On error: show error message in modal

**Copy the score entry patterns exactly from** `src/app/leagues/[id]/record/page.tsx` (lines 846-977): the score mode toggle, the simple winner selection buttons, the set score grid with add/remove, and the `getWinnerFromSets()` auto-detection logic. But replace "Side A" / "Side B" labels with the actual player names from the `sideA`/`sideB` props.

### Step 3.2: Wire into detail page

In `src/app/leagues/[id]/page.tsx`, add state:
```typescript
const [submitResultMatch, setSubmitResultMatch] = useState<LeagueMatch | null>(null);
```

Pass `onSubmitResult={(match) => setSubmitResultMatch(match)}` to `MatchCard` components with `variant="scheduled"`.

Render the modal at the bottom of the page:
```tsx
{submitResultMatch && (
  <SubmitResultModal
    isOpen={true}
    onClose={() => setSubmitResultMatch(null)}
    fixtureId={submitResultMatch.id}
    weekNumber={submitResultMatch.week_number}
    sideA={submitResultMatch.participants
      .filter(p => p.team === "A")
      .map(p => ({ userId: p.user_id, name: p.name }))}
    sideB={submitResultMatch.participants
      .filter(p => p.team === "B")
      .map(p => ({ userId: p.user_id, name: p.name }))}
    onSuccess={async () => {
      setSubmitResultMatch(null);
      setSuccessMessage("Result submitted successfully.");
      // Refresh fixtures + standings
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const workflowMatches = await loadWorkflowFixtures(session.access_token);
        setMatches(prev => mergeWorkflowMatches(prev, workflowMatches));
        const backendStandings = await loadBackendStandings(session.access_token);
        if (backendStandings?.standings) setStandings(backendStandings.standings);
        if (backendStandings?.teamStandings) setTeamStandings(backendStandings.teamStandings);
      }
    }}
  />
)}
```

### Step 3.3: Add success toast

Add to the detail page:
```typescript
const [successMessage, setSuccessMessage] = useState<string | null>(null);

useEffect(() => {
  if (!successMessage) return;
  const timeout = setTimeout(() => setSuccessMessage(null), 3000);
  return () => clearTimeout(timeout);
}, [successMessage]);
```

Render at the top of main content:
```tsx
{successMessage && (
  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 flex items-center gap-2">
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
    {successMessage}
  </div>
)}
```

---

## Phase 4: Final Polish

### Step 4.1: Update `/record` page

In `src/app/leagues/[id]/record/page.tsx`, add an info banner below the error display (after line 668):

```tsx
{isTennis && (
  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700 mb-4">
    You can also submit results directly from match cards on the league page.
  </div>
)}
```

Import shared types from `@/lib/league-types` and utils from `@/lib/league-utils`.

### Step 4.2: Reassemble detail page

The final `src/app/leagues/[id]/page.tsx` should be ~500-600 lines total:
- Imports (types, components, hooks)
- State management (~15-20 hooks: core data + modal visibility toggles)
- Data loading functions (loadWorkflowFixtures, loadBackendStandings, loadRunningSessions, loadAssignedTeams, loadLeagueInvites)
- Action handlers that delegate to modals (handleReviewSubmission, handleGenerateSchedule, handleJoin, handleLeave, handleDelete, handleSendEmail, handleSendInvites, etc.)
- Clean JSX composing the extracted components

**JSX structure:**
```tsx
return (
  <div className="min-h-screen bg-white">
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <Link href="/leagues">← Back to leagues</Link>

      {successMessage && <SuccessToast />}

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Header Card (inline - simple JSX) */}
          <StandingsTable ... />
          {completedMatches.length > 0 && (
            <section>
              <h2>Recent Results</h2>
              {completedMatches.slice(0, 5).map(m => <MatchCard key={m.id} variant="completed" ... />)}
            </section>
          )}
          {isRunningLeague && (
            <section>
              <h2>Running Sessions</h2>
              {sortedRunningSessions.map(s => <RunningSessionCard key={s.id} ... />)}
            </section>
          )}
          {pendingReviewMatches.length > 0 && (
            <section>
              <h2>Pending Result Reviews</h2>
              {pendingReviewMatches.map(m => <MatchCard key={m.id} variant="pending_review" ... />)}
            </section>
          )}
          {scheduledMatches.length > 0 && (
            <section>
              <h2>Upcoming Matches</h2>
              {scheduledMatches.map(m => <MatchCard key={m.id} variant="scheduled" ... />)}
            </section>
          )}
        </div>
        <div className="space-y-6">
          <MembersList ... />
          <LeagueActions ... />
          {isOwnerOrAdmin && <InviteSection ... />}
          {isAssignedDoubles && <AssignedTeamsSidebar />}
          {/* League Info (inline - simple JSX) */}
        </div>
      </div>
    </main>

    {/* Modals */}
    <SubmitResultModal ... />
    <DeleteLeagueModal ... />
    <EmailMembersModal ... />
    <InviteModal ... />
    <RejectModal ... />
    <ResolveDisputeModal ... />
    <CreateSessionModal ... />
    <RunEntryModal ... />
    <ManageTeamsModal ... />
  </div>
);
```

---

## Verification Checklist

After ALL changes, run:
```bash
cd /Users/cventer/Documents/MatUp/frontend
npm run lint
npm run build
```

Both must pass with zero errors.

**Manual test scenarios (for the developer to verify):**

Organizer flow:
- [ ] Create tennis league → invite friends → generate schedule
- [ ] Click "Submit Result" on a scheduled match card → fill score → submit
- [ ] Verify standings update after submission
- [ ] Record Results page still works for ad-hoc matches

Participant flow:
- [ ] View scheduled match where user is a participant
- [ ] See "Submit Result" button and "Your match" badge
- [ ] Submit result → see "Awaiting opponent" badge
- [ ] Opponent views pending review → sees submitted result details (winner, sets)
- [ ] Opponent confirms → match completes → standings update

Running flow:
- [ ] Create running session
- [ ] Submit run using MM:SS input (not raw seconds)
- [ ] Distance shows in km when >= 1000m

Dispute flow:
- [ ] Opponent rejects result → match becomes disputed
- [ ] Admin sees "Resolve Dispute" button
- [ ] Admin resolves with player names (not "Side A/B")

General:
- [ ] All modals open and close correctly
- [ ] Status badges are consistent across all sections
- [ ] Mobile responsive (375px width) — modals, cards, tables scroll correctly
- [ ] Invite code copy, invite link copy, email invites all work
- [ ] Leave league, delete league, join league all work
