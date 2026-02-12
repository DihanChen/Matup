# MatUp Frontend

Frontend web app for MatUp (events, leagues, social, auth, and host tools).

## Stack
- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS v4
- Supabase (auth + data + storage)
- html2canvas (event share image generation)

## Core Features
- Authentication: sign up, login, forgot password, reset password
- Events: browse, create, edit, join/leave, discussion, share
- Leagues: browse, create, join/leave, standings, record results
- Running leagues: session-based submissions, organizer review, and finalize workflow
- Social: friends, profile editing, public user pages
- Host messaging: event hosts and league owners can trigger group email via backend API

## Local Development

Requirements:
- Node.js 20+
- npm 10+

Run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Build / start:

```bash
npm run build
npm run start
```

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

## Important Routes

| Route | Purpose |
|---|---|
| `/` | Landing page |
| `/login` | Sign in |
| `/signup` | Create account |
| `/forgot-password` | Request reset email |
| `/reset-password` | Set new password from recovery link |
| `/dashboard` | User dashboard |
| `/events` | Event discovery |
| `/events/create` | Create event |
| `/events/[id]` | Event detail |
| `/leagues` | League discovery |
| `/leagues/create` | Create league |
| `/leagues/join` | Join a league via invite code |
| `/leagues/[id]` | League detail |
| `/friends` | Friend management |
| `/profile` | Profile settings |

## Deployment Notes
- Deploy frontend on Vercel.
- Set `NEXT_PUBLIC_API_BASE_URL` to your backend URL (for example: `https://matup-backend.onrender.com`).
- In Supabase Auth settings, add redirect URLs for:
  - `https://<your-frontend-domain>/reset-password`
  - `http://localhost:3000/reset-password`
