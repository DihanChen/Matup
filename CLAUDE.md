# MatUp Frontend — Project Knowledge

## Purpose
- Fitness partner matching web app built with Next.js App Router.

## Stack
- Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS v4.
- Supabase client + Prisma (build runs `prisma generate`).

## Repo Layout
- `src/app/` routes, layouts, and API handlers (`app/api/**/route.ts`).
- `src/components/` reusable UI components.
- `src/lib/` shared utilities and API clients.
- `public/`, `prisma/`, `supabase/` for assets and backend tooling.
- Path alias: `@/*` → `src/*`.

## Coding Conventions
- Follow existing file-local style (quote style, formatting).
- App Router conventions: pages live in `src/app/**/page.tsx`.
- Add `"use client"` at the top of components using React hooks, `useRouter`, or `useSearchParams`.
- Prefer `next/link` and `next/image` over raw anchors/images unless there is a clear reason.
- Keep TypeScript types explicit where helpful; repo runs in `strict` mode.

## Styling
- Tailwind is the default. Use globals in `src/app/globals.css` for theme variables.
- Inline styles are acceptable for dynamic values, but prefer Tailwind classes for static styling.

## Supabase & Env
- Browser client: `src/lib/supabase.ts` uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Admin client: `src/lib/supabase-admin.ts` uses `SUPABASE_SERVICE_KEY` and must remain server-only.
- Never expose service keys or secrets in client components.

## Commands
- `npm run dev` — dev server
- `npm run build` — production build (includes `prisma generate`)
- `npm run start` — run production server
- `npm run lint` — ESLint (Next core-web-vitals + TypeScript)
