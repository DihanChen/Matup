# MatUp Frontend — Project Knowledge

## Purpose

Fitness partner matching web app. Users discover and create sports events, manage competitive leagues (racket sports, running), track standings, and connect socially.

## Stack

- Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS v4
- `@supabase/supabase-js` + `@supabase/ssr` for auth, database, and storage
- `maplibre-gl` + `react-map-gl` for interactive maps
- `html2canvas` for event share image generation
- Path alias: `@/*` maps to `src/*`

## Project Structure

```
src/
├── app/                              # Next.js routes (thin page shells)
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Landing page
│   ├── globals.css                   # Tailwind theme + custom utilities
│   │
│   ├── auth/callback/                # Supabase OAuth callback (Google SSO)
│   ├── api/push/                     # Web Push API routes (subscribe, unsubscribe, send, vapid-public-key)
│   │
│   ├── login/page.tsx                # Sign in
│   ├── signup/page.tsx               # Create account
│   ├── forgot-password/page.tsx      # Request password reset
│   ├── reset-password/page.tsx       # Set new password
│   │
│   ├── dashboard/page.tsx            # User dashboard (hosting / joining / past)
│   ├── profile/page.tsx              # Profile settings + avatar upload
│   ├── friends/page.tsx              # Friend requests and list
│   ├── users/[id]/page.tsx           # Public user profile
│   │
│   ├── courts/
│   │   ├── create/page.tsx           # Create/import court
│   │   └── [id]/page.tsx             # Court detail + reviews
│   │
│   ├── events/
│   │   ├── page.tsx                  # Event discovery (map + list)
│   │   ├── create/page.tsx           # Multi-step event creation
│   │   └── [id]/
│   │       ├── page.tsx              # Event detail
│   │       └── edit/page.tsx         # Edit event
│   │
│   └── leagues/
│       ├── page.tsx                  # League discovery
│       ├── create/page.tsx           # Multi-step league creation
│       ├── join/page.tsx             # Join via invite code
│       └── [id]/
│           ├── page.tsx              # League detail (overview, fixtures, standings)
│           ├── record/page.tsx       # Record match results
│           └── schedule/page.tsx     # League schedule calendar view
│
├── features/                         # Feature modules (components + hooks + types)
│   ├── events/
│   │   ├── components/
│   │   │   ├── EventsPageClient.tsx          # Events browse page (map + filters)
│   │   │   ├── EventDetailPageClient.tsx     # Event detail page
│   │   │   ├── EventDetailSidebar.tsx        # Sidebar: participants, host, actions
│   │   │   ├── EventDetailModals.tsx         # Join, cancel, email, review modals
│   │   │   ├── EventCreatePageClient.tsx     # Create event wizard
│   │   │   ├── EventEditPageClient.tsx       # Edit event form
│   │   │   └── create/                       # Create wizard step components
│   │   │       ├── EventCreateStepSport.tsx
│   │   │       ├── EventCreateStepWhenWhere.tsx
│   │   │       ├── EventCreateStepDetails.tsx
│   │   │       ├── CreateEventNavigation.tsx
│   │   │       ├── CreateEventLoadingState.tsx
│   │   │       ├── CreateEventSuccessState.tsx
│   │   │       ├── constants.ts              # Sport options, durations, cover images
│   │   │       └── types.ts                  # Form state types
│   │   └── hooks/
│   │       ├── useEventDetailPage.ts         # Data fetching + state for event detail
│   │       └── useEventEditPage.ts           # Data fetching + state for event edit
│   │
│   ├── leagues/
│   │   ├── components/
│   │   │   ├── LeaguesPageClient.tsx         # League browse/filter
│   │   │   ├── LeagueDetailPageClient.tsx    # League detail shell
│   │   │   ├── LeagueDetailContent.tsx       # Tab content router
│   │   │   ├── LeagueCreatePageClient.tsx    # Create league wizard
│   │   │   ├── RecordResultsPageClient.tsx   # Record results page
│   │   │   ├── RecordResultsTennisSection.tsx
│   │   │   ├── detail/                       # League detail sub-components
│   │   │   │   ├── HeaderCard.tsx
│   │   │   │   ├── StandingsCard.tsx
│   │   │   │   ├── UpcomingMatchesCard.tsx
│   │   │   │   ├── RecentResultsCard.tsx
│   │   │   │   ├── RunningSessionsCard.tsx
│   │   │   │   ├── PendingReviewsCard.tsx
│   │   │   │   ├── LeagueDetailSidebar.tsx
│   │   │   │   ├── SidebarInfoCard.tsx
│   │   │   │   ├── SidebarHostCard.tsx
│   │   │   │   ├── SidebarPlayersCard.tsx
│   │   │   │   ├── SidebarMembersDirectoryCard.tsx
│   │   │   │   ├── SidebarActionsCard.tsx
│   │   │   │   ├── SidebarAssignedTeamsCard.tsx
│   │   │   │   ├── SidebarInviteConsoleCard.tsx
│   │   │   │   ├── SidebarNotesCard.tsx
│   │   │   │   └── types.ts                  # Shared props types for detail cards
│   │   │   └── create/                       # Create wizard step components
│   │   │       ├── SportAndFormatStep.tsx
│   │   │       ├── LeagueDetailsStep.tsx
│   │   │       ├── ScheduleStep.tsx
│   │   │       ├── InviteFriendsStep.tsx
│   │   │       ├── CreateLeagueNavigation.tsx
│   │   │       ├── CreateLeagueLoadingState.tsx
│   │   │       ├── CreateLeaguePremiumState.tsx
│   │   │       └── types.ts
│   │   └── hooks/
│   │       ├── useLeagueDetailPage.ts        # Data fetching + state for league detail
│   │       └── useRecordResultsPage.ts       # Data fetching for result recording
│   │
│   ├── courts/
│   │   ├── components/
│   │   │   ├── CourtCreatePageClient.tsx     # Create/import court wizard
│   │   │   ├── CourtDetailPageClient.tsx     # Court detail page
│   │   │   └── detail/                       # Court detail sub-components
│   │   │       ├── CourtEditDetailsModal.tsx
│   │   │       ├── CourtReviewsSection.tsx
│   │   │       └── WriteReviewModal.tsx
│   │   ├── hooks/
│   │   │   └── useOsmCourts.ts               # Fetch courts from Overpass/OSM
│   │   ├── constants.ts
│   │   └── types.ts
│   │
│   └── social/
│       ├── components/
│       │   └── FriendsPageClient.tsx         # Friends list + request management
│       └── hooks/
│           └── useFriendsPage.ts             # Data fetching for friends page
│
├── components/                       # Shared UI components (cross-feature)
│   ├── Navbar.tsx                    # App header with auth state
│   ├── NavbarShell.tsx               # Static navbar for loading states
│   ├── EventCard.tsx                 # Reusable event card (default/hosting/past)
│   ├── CourtCard.tsx                 # Reusable court card
│   ├── LocationAutocomplete.tsx      # Nominatim-powered location search
│   ├── LocationLink.tsx              # Clickable map link
│   ├── auth/
│   │   └── GoogleOAuthButton.tsx     # Google SSO sign-in button
│   ├── create-event/                 # Shared create-event UI primitives
│   │   ├── ActivityCard.tsx
│   │   └── StepIndicator.tsx
│   ├── map/
│   │   ├── ExploreMap.tsx            # MapLibre GL explore map (events + courts)
│   │   └── MapDynamic.tsx            # Dynamic (no-SSR) map wrapper
│   ├── leagues/                      # League-specific modals
│   │   ├── SubmitResultModal.tsx
│   │   ├── InviteModal.tsx
│   │   ├── ManageTeamsModal.tsx
│   │   ├── EmailMembersModal.tsx
│   │   ├── CreateSessionModal.tsx
│   │   ├── RunEntryModal.tsx
│   │   ├── ResolveDisputeModal.tsx
│   │   ├── RejectModal.tsx
│   │   ├── DeleteLeagueModal.tsx
│   │   └── StatusBadge.tsx
│   └── share/                        # Event share functionality
│       ├── EventShareModal.tsx
│       ├── EventShareTemplate.tsx
│       └── useEventShare.ts
│
├── lib/                              # Shared utilities and data access
│   ├── supabase.ts                   # Supabase browser client (use in Client Components)
│   ├── supabase-server.ts            # Supabase SSR client (use in Server Components / Route Handlers)
│   ├── api.ts                        # Backend API base URL
│   ├── map-config.ts                 # MapLibre style/tile config
│   ├── courtName.ts                  # Court name formatting utility
│   ├── queries/                      # Data access functions (Supabase queries)
│   │   ├── events.ts                 # Event list queries
│   │   ├── event-detail.ts           # Single event + participants queries
│   │   ├── leagues.ts                # League queries
│   │   ├── courts.ts                 # Court list queries
│   │   ├── court-detail.ts           # Single court + amenities queries
│   │   ├── court-reviews.ts          # Court review queries
│   │   └── profile.ts                # User profile queries
│   ├── league-types.ts              # League, fixture, session, standing types
│   ├── league-rules.ts              # Sport-specific rule configurations
│   ├── league-utils.ts              # getInitials, formatDuration, formatDistance
│   ├── rankings.ts                  # Ranking data models
│   ├── formatAddress.ts             # Address shortening utility
│   ├── geo.ts                       # Haversine distance calculation
│   └── share/
│       ├── captureImage.ts          # html2canvas wrapper
│       └── sportEmojis.ts           # Sport-to-emoji mapping
│
└── public/                           # Static assets (cover images, icons)
```

### Key Patterns

- **Page files are thin shells**: `app/**/page.tsx` files delegate to `features/**/components/*Client.tsx` components. Pages handle Suspense boundaries; client components handle state and rendering.
- **Feature modules own their domain**: each feature (`events`, `leagues`, `courts`, `social`) has its own `components/`, `hooks/`, and types. This keeps related code together.
- **Data access lives in `lib/queries/`**: Supabase calls are centralized here rather than inline in components.
- **Shared components are cross-feature only**: `components/` contains UI that's used across multiple features (Navbar, EventCard, modals).
- **Two Supabase clients**: use `lib/supabase.ts` (browser) in Client Components; use `lib/supabase-server.ts` (`@supabase/ssr`) in Server Components and Route Handlers. Mixing them up causes auth issues.
- **Map is always dynamically imported**: `MapDynamic.tsx` wraps the MapLibre map with `next/dynamic` + `ssr: false` — import it instead of `ExploreMap.tsx` directly to avoid SSR crashes.

## Coding Conventions

- App Router conventions: pages in `src/app/**/page.tsx`.
- Add `"use client"` only on components that use hooks, `useRouter`, or `useSearchParams`.
- Prefer `next/link` and `next/image` over raw anchors/images.
- Keep TypeScript types explicit; repo runs in `strict` mode.
- Follow existing file-local style (quote style, formatting).

## Styling

- Tailwind CSS v4 is the default. Theme defined in `src/app/globals.css`.
- Primary: `zinc-900`, Accent: `orange-500`, Background: `zinc-50`.
- Inline styles only for dynamic values; Tailwind classes for everything else.

## Supabase and Environment

- Browser client: `src/lib/supabase.ts` uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- SSR client: `src/lib/supabase-server.ts` uses the same vars via `@supabase/ssr` `createServerClient`.
- Backend API base: `src/lib/api.ts` reads `NEXT_PUBLIC_API_BASE_URL`.
- Never expose service keys or secrets in client components.

## Tests

- Test runner: Node.js built-in (`node --test --experimental-strip-types`)
- Test files: `src/_tests_/lib/*.test.ts`
- Run: `pnpm test`

## Commands

- `pnpm dev` — dev server
- `pnpm build` — production build
- `pnpm start` — run production server
- `pnpm lint` — ESLint (Next core-web-vitals + TypeScript)
- `pnpm test` — run unit tests
