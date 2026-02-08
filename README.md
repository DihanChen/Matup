# MatUp Frontend

A fitness partner matching web app for discovering events and leagues, meeting partners, and building a local community.

## Tech Stack
- Next.js 16 (App Router) + React 19
- TypeScript (strict)
- Tailwind CSS v4
- Supabase (auth, data, storage)
- Prisma + web-push (push subscription storage and delivery)
- html2canvas (shareable event images)

## Features
- Auth and profiles with avatar upload and activity preferences.
- Events: browse, create, edit, join/leave, reviews/comments, and shareable templates.
- Leagues: create, join/leave, record matches, and view standings across formats.
- Friends and public user profiles.
- Push notifications for nearby events (service worker + VAPID).
- Location autocomplete via Nominatim (debounced to 1 req/sec).

## Design References
- Latest UI screenshots live in `design/` (Intro, Explore, CreateEvent, EventDetail).

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production (includes prisma generate)
npm run build

# Start production server
npm start
```

Open http://localhost:3000 in your browser.

## Project Structure

```
src/
├── app/
│   ├── api/push/          # Push notification routes
│   ├── events/            # Event pages (list/create/detail/edit)
│   ├── leagues/           # League pages (list/create/detail/record)
│   ├── dashboard/         # User dashboard
│   ├── friends/           # Friend management
│   ├── profile/           # Profile editor
│   ├── users/[id]/        # Public user profile
│   ├── login/             # Auth (sign in)
│   └── signup/            # Auth (sign up)
├── components/            # Reusable UI components
├── hooks/                 # Client hooks (push notifications)
└── lib/                   # Utilities, API clients, push helpers
```

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/login` | Sign in |
| `/signup` | Sign up |
| `/dashboard` | User dashboard |
| `/events` | Browse events |
| `/events/create` | Create event |
| `/events/[id]` | Event detail |
| `/events/[id]/edit` | Edit event |
| `/leagues` | Browse leagues |
| `/leagues/create` | Create league |
| `/leagues/[id]` | League detail |
| `/leagues/[id]/record` | Record league results |
| `/friends` | Friends |
| `/profile` | Profile editor |
| `/users/[id]` | Public user profile |

## API Routes

| Route | Description |
|-------|-------------|
| `/api/push/vapid-public-key` | Get VAPID public key |
| `/api/push/subscribe` | Save push subscription |
| `/api/push/unsubscribe` | Remove push subscription |
| `/api/push/send` | Notify nearby users |

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
DATABASE_URL=
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=
```

Notes:
- `SUPABASE_SERVICE_KEY` is server-only (used in API routes).
- `DATABASE_URL` is required for Prisma (push subscriptions).

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
