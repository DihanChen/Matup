# ADR: Google OAuth Sign-In

- Status: Proposed
- Date: 2026-02-16
- Owner: Engineering

## Context

MatUp currently supports email/password authentication only. New users must fill out a form and verify their email before they can use the app. This adds friction and reduces conversion.

Google OAuth lets users sign up or sign in with one click using their existing Google account. Supabase Auth has built-in Google provider support, and the feature is free on both Supabase (up to 50K MAU) and Google Cloud.

The backend requires zero changes — it validates Supabase JWT tokens regardless of how the user authenticated.

## Decision

Add Google OAuth using the **redirect flow** (`signInWithOAuth`). This is the simplest approach: no external scripts, no extra dependencies, and it works reliably across all browsers.

### Why redirect flow over Google One Tap

| Factor | Redirect (`signInWithOAuth`) | One Tap (`signInWithIdToken`) |
|--------|------------------------------|-------------------------------|
| Dependencies | None — built into Supabase SDK | Requires Google Identity Services `<script>` tag |
| UX | Redirects to Google, then back | Inline popup/button (slicker) |
| Complexity | Minimal — one function call + callback route | More setup — script loading, callback wiring, CSP |
| Reliability | Works everywhere | Blocked by some ad blockers and privacy extensions |
| Upgrade path | Can add One Tap later as enhancement | — |

**Decision**: Start with the redirect flow. One Tap can be layered on later if conversion data shows it's worth the added complexity.

## Implementation

### New files

#### 1. `src/lib/supabase-server.ts` — Server-side Supabase client

The auth callback runs as a Next.js Route Handler (server-side). It needs a server Supabase client that reads/writes cookies to establish the session.

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )
}
```

**Why a separate file**: The existing `src/lib/supabase.ts` uses `createBrowserClient` and is imported in `"use client"` components. Server route handlers need `createServerClient` with cookie access. Keeping them separate avoids mixing client/server concerns.

#### 2. `src/app/auth/callback/route.ts` — OAuth callback handler

Handles the redirect from Google after the user consents.

```ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Upsert profile with Google name + avatar (same pattern as login/signup)
      const meta = data.user.user_metadata
      await supabase.from('profiles').upsert(
        {
          id: data.user.id,
          name: meta?.full_name || meta?.name || null,
          avatar_url: meta?.avatar_url || meta?.picture || null,
        },
        { onConflict: 'id' }
      )

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Fallback: redirect to login with error
  return NextResponse.redirect(
    `${origin}/login?message=Something went wrong. Please try again.`
  )
}
```

**Flow**: Google redirects to Supabase → Supabase redirects to `/auth/callback?code=...` → this handler exchanges the code for a session cookie → redirects to `/dashboard`.

**Profile upsert**: Google provides `full_name` and `avatar_url` (or `picture`) in `user_metadata`. We upsert on first sign-in so the user immediately has a profile. This matches the existing pattern in `login/page.tsx:60-63` and `Navbar.tsx:38-43`.

### Modified files

#### 3. `src/app/signup/page.tsx` — Add Google sign-up button

Add above the email form, inside the form card:

```
┌──────────────────────────────┐
│  [G] Continue with Google    │  ← New button
│                              │
│  ──────── or ────────        │  ← New divider
│                              │
│  Full name                   │
│  Email                       │  ← Existing form
│  Password                    │
│  Confirm Password            │
│  [Create account]            │
└──────────────────────────────┘
```

The button calls:

```ts
async function handleGoogleSignIn() {
  const supabase = createClient()
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
}
```

#### 4. `src/app/login/page.tsx` — Add Google sign-in button

Same button + divider pattern, placed inside `LoginContent` above the email form.

### Google button design

Styled to match the existing UI (zinc/orange theme, rounded corners):

- White background with zinc border (distinct from the dark "Create account" / "Sign in" button)
- Google "G" SVG logo on the left
- Text: "Continue with Google"
- Full width, same height as the submit button
- Hover: light gray background

## External configuration (manual steps)

### Google Cloud Console

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Authorized JavaScript origins:
   - `http://localhost:3000`
   - `https://matup.app` (production)
4. Authorized redirect URIs:
   - `https://fswhgkkctpsokmworhps.supabase.co/auth/v1/callback`
5. Copy Client ID and Client Secret

### Supabase Dashboard

1. Authentication → Providers → Google → Enable
2. Paste Client ID and Client Secret
3. Authentication → URL Configuration → Redirect Allow List, add:
   - `http://localhost:3000/auth/callback`
   - `https://matup.app/auth/callback` (production)

## What does NOT change

- **Backend**: No changes needed. JWT validation is provider-agnostic.
- **Profiles table**: Schema unchanged. Google `user_metadata` maps cleanly to existing `name` and `avatar_url` columns.
- **Existing email/password flow**: Unchanged. Both auth methods coexist.
- **Navbar**: Already reads `user_metadata` for name/avatar via its own profile upsert — works for Google users automatically.
- **No new dependencies**: `@supabase/ssr` (already installed) provides both `createBrowserClient` and `createServerClient`.

## Files summary

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/supabase-server.ts` | Create | Server-side Supabase client for route handlers |
| `src/app/auth/callback/route.ts` | Create | Exchange OAuth code for session + profile upsert |
| `src/app/signup/page.tsx` | Modify | Add Google button + divider above form |
| `src/app/login/page.tsx` | Modify | Add Google button + divider above form |

## Verification

1. Complete Google Cloud + Supabase dashboard setup (see above)
2. `npm run dev` in frontend
3. Go to `/signup` → "Continue with Google" button visible above form
4. Click it → redirects to Google consent screen
5. Consent → redirects to `/auth/callback` → redirects to `/dashboard`
6. Check Supabase `profiles` table → user has Google name + avatar
7. Sign out → go to `/login` → Google button works the same way
8. Verify existing email/password flow still works
9. `npm run build` → no type errors

## Future enhancements (out of scope)

- **Google One Tap**: Add inline Google button for faster UX (requires loading Google Identity Services script)
- **Account linking**: If a user signs up with email then tries Google with the same email, Supabase handles this automatically (merges identities if enabled in dashboard)
- **Other providers**: Apple, GitHub — same pattern, just enable in Supabase + add buttons
