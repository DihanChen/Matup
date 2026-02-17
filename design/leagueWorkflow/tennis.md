# Tennis League Workflow

## Overview

A MatUp tennis league is a recurring competitive season where players compete in weekly fixtures, track results, and climb a standings table. Leagues support both **singles** (1v1) and **doubles** (2v2) formats.

A league is run by a **host** (the creator) and optionally co-managed by **admins**. Players join via invite, play scheduled fixtures each week, and submit set-by-set scores that feed into an automatic standings table.

---

## 1. Creating a League (Host)

League creation is a 4-step wizard.

### Step 1 — Sport & Format

| Setting | Options | Notes |
|---------|---------|-------|
| Sport | Tennis | Also available: Pickleball, Running |
| Match type | **Singles** (1v1) or **Doubles** (2v2) | |
| Rotation type | **Random** (random partners each week) or **Assigned** (fixed partner all season) | Doubles only |

### Step 2 — League Details

| Setting | Constraints | Default |
|---------|-------------|---------|
| Name | Required | — (placeholder: "Weekend Tennis Singles") |
| Description | Optional | — |
| Max members | 4–50 (slider) | — |

### Step 3 — Schedule

| Setting | Constraints |
|---------|-------------|
| Start date | Any future date |
| Season length | 4–52 weeks (slider) |

### Step 4 — Invite Friends

Optionally select friends from your friends list to invite at creation time. Friends can also be invited after the league is created.

### Default Tennis Config

These values are set automatically when a tennis league is created (from `league-rules.ts`):

| Setting | Default |
|---------|---------|
| Scoring input | Set-by-set |
| Best of | 3 sets |
| Tiebreak at | 6 games all |
| Points for win | 3 |
| Points for loss | 0 |
| Tiebreaker order | Points > Head-to-head > Set differential > Game differential |
| Participant submission | Allowed |
| Opponent confirmation | Required |
| Check-in required | No |

---

## 2. Joining a League (Player)

Players can join a league in three ways:

1. **Invite link** — The host copies a shareable link: `/leagues/join?leagueId={id}&code={CODE}`
2. **Invite code** — The host shares the code directly; the player enters the league ID and code on the join page
3. **Email invite** — The host sends invites via email from the Invite Console

### Invite Statuses

| Status | Meaning |
|--------|---------|
| `pending` | Invite sent, not yet accepted |
| `accepted` | Player has joined the league |
| `expired` | Invite was not accepted before expiry |

---

## 3. Match Formats

### Singles

Standard 1v1 matches. Each player is assigned to Side A or Side B in a fixture.

### Doubles

2v2 matches. Two partner modes are available:

| Mode | Behaviour |
|------|-----------|
| **Random** (`random_weekly`) | Partners are randomly shuffled each week when the schedule is generated |
| **Assigned** (`fixed_pairs`) | The host pre-configures fixed pairs via the **Manage Teams** modal. These pairs stay together for the entire season |

For assigned pairs, the host configures teams through the sidebar's "Assigned Teams" card. Unpaired members are listed separately until paired.

---

## 4. Schedule & Fixtures

### Generating a Schedule

The host generates the schedule from the league detail page. Requirements:

- **Singles:** minimum 2 members
- **Doubles:** minimum 4 members

The schedule creates one fixture per pair per round, on a **weekly cadence**.

### Fixture Lifecycle

```
scheduled → awaiting_confirmation → finalized
                                  → disputed
         → cancelled
```

| Status | Meaning |
|--------|---------|
| `scheduled` | Fixture created, no result submitted yet |
| `awaiting_confirmation` | A result has been submitted and is pending review/confirmation |
| `finalized` | Result accepted and locked in |
| `disputed` | Two conflicting submissions exist; host must resolve |
| `cancelled` | Fixture will not be played |

---

## 5. Recording Results

There are two paths to record a result:

### Path A — Scheduled Match

1. Navigate to the league's **Record Results** page
2. Select a scheduled fixture from the dropdown
3. The players/teams are pre-filled from the fixture

### Path B — Ad-hoc Match

1. Navigate to the league's **Record Results** page
2. Choose "Ad-hoc match"
3. Select players and assign them to Side A and Side B
4. Optionally enter a week number and match date

### Scoring Entry

Two scoring modes are available:

| Mode | Description |
|------|-------------|
| **Simple** | Click the winning side (Side A or Side B) — no set scores |
| **Detailed** (default for tennis) | Enter set-by-set game scores (e.g. 6-4, 4-6, 7-5) |

In detailed mode:

- Each set is entered as a pair of game scores (one per side)
- Max game score per set: 7
- The winner is **auto-detected** from the set scores (best-of-3)
- The calculated winner is displayed for confirmation before submission

### Who Can Submit

| Role | Can submit? |
|------|-------------|
| Host / Admin | Always |
| Participant | Yes, if `allow_participant_submission` is enabled (default: yes) |

---

## 6. Confirmation & Review

When a result is submitted, it follows a confirmation workflow:

### Participant Submission Flow

1. Participant submits result via the **Submit Result** modal
2. The fixture moves to `awaiting_confirmation`
3. The opponent (or host/admin) must confirm or reject

### Host Review

Hosts and admins see pending submissions in the **"Pending Result Reviews"** card on the league overview. For each pending result they can:

- **Confirm** — accepts the result and finalizes the fixture
- **Reject** — rejects the submission with a reason (via the Reject modal)

Participants see these pending reviews as **"Awaiting Your Confirmation"**.

### Submission Statuses

| Status | Meaning |
|--------|---------|
| `pending` | Submitted, awaiting confirmation |
| `accepted` | Confirmed by opponent or host |
| `rejected` | Rejected by opponent or host (with reason) |
| `superseded` | Replaced by a newer submission |

---

## 7. Disputes

### When Does a Dispute Occur?

A fixture is marked `disputed` when two conflicting submissions exist for the same fixture (e.g. both sides claim to have won).

### Resolution

The host/admin resolves a dispute using the **Resolve Dispute** modal:

1. Select the correct winner (Side A or Side B)
2. Enter an optional resolution note explaining the decision
3. Click **Resolve**

The fixture moves to `finalized` with the host's decision as the final result.

---

## 8. Standings & Rankings

### Points System

| Result | Points |
|--------|--------|
| Win | 3 |
| Loss | 0 |

### Tiebreaker Order

When two or more players/teams are tied on points, the tiebreaker is applied in this order:

1. **Head-to-head** — direct record between tied players
2. **Set differential** — sets won minus sets lost
3. **Game differential** — games won minus games lost

### Singles Standings Table

| Column | Description |
|--------|-------------|
| Rank | Position in the standings |
| Player | Player name |
| P | Matches played |
| W | Wins |
| L | Losses |
| Pts | Points total |
| +/- (sets) | Set differential |
| +/- (games) | Game differential |

### Doubles Standings Table

| Column | Description |
|--------|-------------|
| Rank | Position in the standings |
| Team | Player names in the pair |
| P | Matches played |
| W | Wins |
| L | Losses |
| Win% | Win percentage |

---

## 9. Roles & Permissions

| Role | Capabilities |
|------|-------------|
| **Owner** | Full control. Can delete the league, manage all settings, promote/demote members, and perform all admin actions |
| **Admin** | Record results, review/confirm/reject submissions, resolve disputes, email members, manage teams |
| **Member** | View standings and schedule, submit own match results (if enabled), leave the league |

---

## 10. Attendance / Check-in

Check-in is **optional** and disabled by default.

When enabled, the following settings apply:

| Setting | Default | Options |
|---------|---------|---------|
| Check-in required | No | Yes / No |
| Check-in window | 30 minutes before start | Configurable (minutes) |
| Self check-in | Allowed | Yes / No |
| Late check-in policy | Allow | `allow`, `block_result_submission`, `mark_late` |

---

## 11. Status Reference

Quick-reference table of all statuses used across the tennis league system.

### League Status

| Status | Description |
|--------|-------------|
| `active` | League is currently running |

### Fixture Status

| Status | Description |
|--------|-------------|
| `scheduled` | Fixture created, awaiting play |
| `awaiting_confirmation` | Result submitted, pending review |
| `finalized` | Result confirmed and final |
| `disputed` | Conflicting submissions, needs host resolution |
| `cancelled` | Fixture will not be played |

### Submission Status

| Status | Description |
|--------|-------------|
| `pending` | Awaiting confirmation |
| `accepted` | Confirmed |
| `rejected` | Rejected (with reason) |
| `superseded` | Replaced by a newer submission |

### Invite Status

| Status | Description |
|--------|-------------|
| `pending` | Sent, not yet accepted |
| `accepted` | Player joined |
| `expired` | Not accepted in time |
