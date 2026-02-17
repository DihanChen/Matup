# MatUp Frontend

Frontend web app for MatUp — a fitness partner matching platform for events, leagues, and social connections.

## Stack

- Next.js 16 (App Router), React 19, TypeScript (strict)
- Tailwind CSS v4
- Supabase (auth + database + storage)
- html2canvas (event share image generation)

## Project Structure

```
src/
├── app/                          # Next.js routes (thin page shells)
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   ├── globals.css               # Tailwind theme
│   ├── login/ signup/            # Auth pages
│   ├── forgot-password/          # Password reset flow
│   ├── reset-password/
│   ├── dashboard/                # User dashboard
│   ├── profile/                  # Profile settings
│   ├── friends/                  # Friend management
│   ├── users/[id]/               # Public user profiles
│   ├── events/                   # Event discovery, create, detail, edit
│   └── leagues/                  # League discovery, create, join, detail, record
│
├── features/                     # Feature modules (domain-scoped)
│   ├── events/
│   │   ├── components/           # Event UI (pages, cards, modals, create wizard steps)
│   │   └── hooks/                # useEventDetailPage, useEventEditPage
│   ├── leagues/
│   │   ├── components/           # League UI (pages, detail cards, create wizard steps)
│   │   └── hooks/                # useLeagueDetailPage, useRecordResultsPage
│   └── social/
│       ├── components/           # FriendsPageClient
│       └── hooks/                # useFriendsPage
│
├── components/                   # Shared UI (cross-feature)
│   ├── Navbar.tsx                # App header with auth state
│   ├── EventCard.tsx             # Reusable event card
│   ├── LocationAutocomplete.tsx  # Nominatim location search
│   ├── leagues/                  # League modals (invite, results, teams, etc.)
│   └── share/                    # Event share image modal
│
└── lib/                          # Utilities and data access
    ├── supabase.ts               # Supabase browser client
    ├── api.ts                    # Backend API base URL
    ├── queries/                  # Supabase query functions (events, leagues)
    ├── league-types.ts           # League, fixture, session, standing types
    ├── league-rules.ts           # Sport-specific rule config
    ├── league-utils.ts           # Formatting helpers
    ├── geo.ts                    # Haversine distance calculation
    ├── formatAddress.ts          # Address shortening
    └── share/                    # Image capture + sport emojis
```

### How It's Organized

- **`app/`** contains route page files. They are thin shells that wrap feature components in Suspense boundaries.
- **`features/`** contains domain modules. Each feature (events, leagues, social) owns its components and hooks. This is where most logic lives.
- **`components/`** contains truly shared UI used across multiple features (Navbar, EventCard, modals).
- **`lib/`** contains utilities, type definitions, and data access functions (`queries/`).

## Core Features

- **Authentication**: sign up, login, forgot/reset password
- **Events**: browse with map, create (multi-step wizard), edit, join/leave, discussion, reviews, share as image
- **Leagues**: browse, create, join via invite code, standings, fixture results, running session submissions
- **Running leagues**: session-based run submissions, organizer review, finalize workflow
- **Social**: friends, public user profiles, profile editing with avatar upload
- **Host messaging**: event hosts and league owners trigger group email via backend API

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Landing page |
| `/login` | Sign in |
| `/signup` | Create account |
| `/forgot-password` | Request reset email |
| `/reset-password` | Set new password |
| `/dashboard` | User dashboard (hosting / joining / past) |
| `/events` | Event discovery (map + list + filters) |
| `/events/create` | Create event (multi-step) |
| `/events/[id]` | Event detail |
| `/events/[id]/edit` | Edit event |
| `/leagues` | League discovery |
| `/leagues/create` | Create league (multi-step) |
| `/leagues/join` | Join league via invite code |
| `/leagues/[id]` | League detail (overview, fixtures, standings, sessions) |
| `/leagues/[id]/record` | Record match results |
| `/friends` | Friend management |
| `/profile` | Profile settings |
| `/users/[id]` | Public user profile |

## Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

Notes:
- `NEXT_PUBLIC_API_BASE_URL` must point to the deployed backend in production.
- Do not expose server-only secrets in client environment files.

## Local Development

Requirements: Node.js 20+, npm 10+

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Build and run for production:

```bash
npm run build
npm run start
```

## Deployment

- Deploy on Vercel.
- Set `NEXT_PUBLIC_API_BASE_URL` to your backend URL (e.g. `https://matup-backend.onrender.com`).
- In Supabase Auth settings, add redirect URLs:
  - `https://<your-frontend-domain>/reset-password`
  - `http://localhost:3000/reset-password`
