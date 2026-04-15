# ADR: Mobile App Strategy

- Status: Proposed
- Date: 2026-02-16
- Owner: Engineering

## Context

MatUp is a Next.js 16 web app (React 19, TypeScript, Tailwind CSS v4, Supabase). Users manage sports leagues, record results, view standings, and join via invite links. The app is currently web-only.

Publishing to the App Store and Google Play would improve discoverability, enable native push notifications, and meet user expectations for a "real app" experience. The question is how to get there without rebuilding everything.

## Decision

Use **Capacitor** to wrap the existing web app in a native shell and publish to both app stores. This maximises code reuse (~95%) while unlocking native capabilities.

### Options Evaluated

| | PWA | Capacitor (chosen) | React Native (Expo) |
|---|---|---|---|
| **Code reuse** | 100% | ~95% | ~40% (business logic only, rewrite all UI) |
| **Time to ship** | 1-2 days | ~2 weeks | 2-3 months |
| **Native feel** | Weak (especially iOS) | Good (85-90% native feel) | Excellent (truly native) |
| **App Store presence** | Google Play only (via TWA), no App Store | Both stores | Both stores |
| **Native APIs** | Limited (no push on older iOS, no camera control) | Full access via plugins | Full access |
| **Ongoing maintenance** | Zero — it's just the web app | Low — one codebase, thin native shell | High — two UI codebases (web + native) |
| **Risk** | Users don't "install" websites | Apple may scrutinise WebView apps | Scope creep, long rewrite timeline |

### Why Capacitor over React Native

MatUp's UI is forms, data tables, standings lists, and cards. There are no complex gestures, animations, or canvas-heavy interactions that require native rendering. A WebView renders this content well. The cost-benefit of rewriting every component (`<div>` to `<View>`, `<p>` to `<Text>`, Tailwind to StyleSheet) is not justified at this stage.

### Why Capacitor over PWA

PWAs lack App Store presence (Apple doesn't allow PWA listings), have limited push notification support on iOS, and users generally don't discover or install them. Capacitor gives us real store listings and native push — the two things a PWA can't deliver.

### When to reconsider

Migrate to React Native (Expo) if:
- Mobile becomes the primary platform (>60% of traffic)
- Users report performance or UX issues that are WebView-inherent (jank, slow transitions)
- Features require deep native integration (real-time camera overlays, background GPS tracking)

## Implementation

### Phase 1: Native Shell + App Store Submission (~1 week)

#### 1. Add Capacitor to the project

```bash
npm install @capacitor/core @capacitor/cli
npx cap init "MatUp" "com.matup.app" --web-dir=out
npm install @capacitor/ios @capacitor/android
npx cap add ios
npx cap add android
```

#### 2. Configure Next.js static export

Capacitor needs a static build. Add to `next.config.ts`:

```ts
const nextConfig = {
  output: 'export',
  // ... existing config
};
```

Alternatively, use Capacitor's `server` config to point at the live URL (enables instant updates without app store resubmission):

```json
// capacitor.config.ts
const config: CapacitorConfig = {
  appId: 'com.matup.app',
  appName: 'MatUp',
  server: {
    url: 'https://app.matup.com',
    cleartext: false
  }
};
```

**Trade-off:** Static export = offline-capable but requires store updates. Live URL = instant updates but requires connectivity. Recommend starting with live URL for faster iteration, add offline support later.

#### 3. App store assets

| Asset | Spec |
|-------|------|
| App icon | 1024x1024 PNG (no transparency for iOS) |
| Splash screen | Capacitor `@capacitor/splash-screen` plugin, multiple sizes |
| Screenshots | 6.7" (iPhone 15 Pro Max), 6.5" (iPhone 11 Pro Max), 12.9" iPad for iOS; phone + 7" + 10" tablet for Android |
| App description | Short (80 char) + full description |
| Privacy policy URL | Required by both stores |
| Category | Sports |

#### 4. App store accounts

| Store | Cost | Notes |
|-------|------|-------|
| Apple Developer Program | $99/year | Required for App Store. Enrolment takes 1-2 days. |
| Google Play Developer | $25 one-time | Required for Play Store. |

### Phase 2: Push Notifications (~3 days)

This is the key native feature that justifies the app to both users and Apple's review team.

#### Backend additions

Add a device token registration endpoint and a notification sender:

```
POST /api/users/device-tokens
Body: { token: string, platform: 'ios' | 'android' }
```

Store tokens in a `device_tokens` table:

```sql
create table device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  token text not null,
  platform text not null check (platform in ('ios', 'android')),
  created_at timestamptz default now(),
  unique(user_id, token)
);
```

Send notifications via:
- **APNs** (Apple Push Notification service) for iOS
- **FCM** (Firebase Cloud Messaging) for Android
- Use a library like `firebase-admin` (FCM covers both platforms if you use FCM for iOS too, which is the simpler path)

#### Frontend additions

```bash
npm install @capacitor/push-notifications
```

```ts
import { PushNotifications } from '@capacitor/push-notifications';

// Request permission + register
const register = async () => {
  const permission = await PushNotifications.requestPermissions();
  if (permission.receive === 'granted') {
    await PushNotifications.register();
  }
};

// Listen for token
PushNotifications.addListener('registration', async ({ value: token }) => {
  await fetch('/api/users/device-tokens', {
    method: 'POST',
    body: JSON.stringify({ token, platform: Capacitor.getPlatform() }),
  });
});
```

#### Notification triggers

| Event | Notification |
|-------|-------------|
| Match scheduled | "You have a match vs {opponent} on {date}" |
| Result submitted for review | "Review the result: {player} vs {player}" |
| League invite received | "{host} invited you to {league name}" |
| Schedule generated | "The schedule for {league name} is ready" |

### Phase 3: Deep Linking (~2 days)

Invite links (`/leagues/join?code=ABC123`) must open in the app when it's installed, and fall back to the web when it's not.

#### iOS — Universal Links

Host an `apple-app-site-association` file at `https://app.matup.com/.well-known/apple-app-site-association`:

```json
{
  "applinks": {
    "apps": [],
    "details": [{
      "appID": "TEAMID.com.matup.app",
      "paths": ["/leagues/join*", "/leagues/*", "/events/*"]
    }]
  }
}
```

#### Android — App Links

Host an `assetlinks.json` at `https://app.matup.com/.well-known/assetlinks.json`:

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.matup.app",
    "sha256_cert_fingerprints": ["..."]
  }
}]
```

#### Capacitor handler

```bash
npm install @capacitor/app
```

```ts
import { App } from '@capacitor/app';

App.addListener('appUrlOpen', ({ url }) => {
  const path = new URL(url).pathname + new URL(url).search;
  router.push(path); // Next.js router handles it from here
});
```

### Phase 4: Polish (~2 days)

| Item | Detail |
|------|--------|
| Splash screen | `@capacitor/splash-screen` — show branded screen during load |
| Status bar | `@capacitor/status-bar` — style to match app theme (dark on light background) |
| Haptics | `@capacitor/haptics` — subtle feedback on button taps, result submission |
| Safe areas | Ensure Tailwind layout respects `env(safe-area-inset-*)` for notch/home indicator |
| Pull to refresh | Native-feeling refresh on league detail, standings pages |
| Keyboard handling | Test all forms with iOS/Android keyboards, ensure no viewport issues |

## Authentication Considerations

Supabase auth currently uses browser redirects for OAuth (e.g. Google OAuth per the existing ADR). Inside a Capacitor WebView, OAuth redirects need special handling:

- Use `@capacitor/browser` plugin to open OAuth flows in an in-app browser (`ASWebAuthenticationSession` on iOS, Chrome Custom Tabs on Android)
- The callback URL redirects back to the app via the custom scheme `com.matup.app://`
- Email/password auth works without changes (it's just API calls)

```ts
import { Browser } from '@capacitor/browser';

// Open OAuth in system browser (not WebView)
await Browser.open({ url: supabaseOAuthUrl });

// Listen for redirect back
App.addListener('appUrlOpen', ({ url }) => {
  if (url.includes('auth/callback')) {
    // Exchange code for session
  }
});
```

## App Store Review Risks

Apple rejects apps that are "just a website in a wrapper." Mitigations:

| Risk | Mitigation |
|------|-----------|
| "Minimal native functionality" | Push notifications, haptics, and deep linking demonstrate native integration |
| "Could be a website" | Splash screen, native navigation feel, offline-aware empty states |
| "Not enough content" | App has real utility — league management, scheduling, results — not just a landing page |

Google Play is significantly more lenient and unlikely to reject.

## Cost Summary

| Item | Cost | Frequency |
|------|------|-----------|
| Apple Developer Program | $99 | Annual |
| Google Play Developer | $25 | One-time |
| Firebase (push notifications) | Free | Up to 10K MAU |
| Capgo OTA updates (optional) | ~$15 | Monthly |
| **Total first year** | **~$140-320** | |

Development effort: **~2 weeks** from zero to both stores.

## Timeline

| Week | Milestone |
|------|-----------|
| 1 | Capacitor setup, static export, native builds, app store account enrolment |
| 2 | Push notifications, deep linking, polish, submit to both stores |
| 3 | App store review period (typically 1-3 days for Google, 1-7 days for Apple) |

## Future Considerations

- **Live streaming integration**: Capacitor supports embedded video (HLS.js works in WebView), so the live streaming feature discussed separately is compatible with this approach.
- **Offline support**: Add a service worker + Capacitor offline detection for viewing cached standings/schedules without connectivity.
- **React Native migration**: If mobile exceeds 60% of usage and users report WebView performance issues, evaluate migrating to Expo. The backend, types, and business logic carry over; only the UI layer would be rewritten.
