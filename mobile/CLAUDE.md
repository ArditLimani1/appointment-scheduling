@AGENTS.md

# NiTermin Mobile — working context

Expo / React Native app for **business admins and employees only**. Clients booking
appointments stay on the web; SuperAdmin stays on the web. Backend is the Laravel
app in the repo root; the JSON contract lives in **`../docs/api-v1.md`** — read that
before touching anything API-shaped instead of re-deriving it from controllers.

## Hard constraints — check before changing

- **Expo SDK 54. Do not upgrade blindly.** The owner's iPhone only gets Expo Go 54
  from the App Store, and SDK 57 refused to load on it. An EAS/local *development
  build* lifts this limit per platform — Android already has one.
- **`react-native-worklets` is required** by Reanimated 4. It looks like unused
  template cruft; removing it makes every screen that imports
  `react-native-gesture-handler` throw `Exception in HostFunction` at import.
  `babel-preset-expo` wires its babel plugin automatically — only the package matters.
- **`react-dom` must stay installed** even though this is native-only:
  `expo-router` → `vaul` → `@radix-ui/*` peer-depend on it, and `npm install`
  fails with ERESOLVE without it.
- Bundle ids are `com.nitermin.app` on both platforms. **Cannot change after the
  first store release.**

## Stack

expo-router (file routes in `src/app/`) · TypeScript strict · TanStack Query
(server state) · Zustand (session) · Luxon (all date math in the *business*
timezone from `/me → business.timezone`) · Reanimated + Gesture Handler
(calendar drag) · expo-secure-store (token) · expo-notifications (Expo Push).

Design tokens in `src/theme/tokens.ts` are the web app's Material 3 palette
copied 1:1 from the root `tailwind.config.js` — keep them in sync, don't invent colours.

## Layout

    src/api        client.ts (fetch + auth + base URL), types.ts, queries.ts (all hooks)
    src/auth       zustand store, SecureStore-backed
    src/i18n       translations from GET /translations, cached on disk
    src/components Screen, ui.tsx kit, AppointmentCard, DateBar
    src/features   calendar/ (DayTimeline, WeekGrid, layout.ts), appointments/, manage/, schedule/
    src/app        login + (app)/ tab routes

## Running locally

```bash
php artisan serve --host=0.0.0.0 --port=8000     # from repo root; 0.0.0.0 is required
cd mobile && npx expo start --port 8081
```

- **Ports 8000 and 8081 are often taken by another macOS user's Docker containers.**
  Check first; if taken use e.g. 8002/8082 and pass `EXPO_PUBLIC_API_PORT=8002` to
  the Expo command so the app knows where the API moved.
- The LAN IP changes per network — read it with `ipconfig getifaddr en0`, never assume.
- **Android emulator:** AVD is named `NiTermin` (Pixel 8, android-36.1 arm64).
  `~/Library/Android/sdk/emulator/emulator -avd NiTermin`. There is **no
  `avdmanager`** (no cmdline-tools) — the AVD was hand-written into
  `~/.android/avd/`. A dev build is already installed: `com.nitermin.app`.
  Rebuild with `npx expo run:android` (JAVA_HOME must point at JDK 17).
- **iPhone:** physical device via Expo Go. Recent Expo Go has no "Enter URL"
  field and no scanner — scan a QR with the stock Camera app or open the
  `exp://` URL in Safari. No Expo account needed.
- **No iOS Simulator runtime is installed** (Xcode 26.2 is, the runtime is not —
  `xcodebuild -downloadPlatform iOS`, ~9GB).
- Push notifications do **not** work in Expo Go; they need a dev build.

Dev accounts (local sqlite): `admin@stratos.com`, `pronari@example.com` (admin),
`john@stratos.com` (employee).

## Platform gotchas already hit — don't re-introduce

- **Dev-build host resolution.** `Constants.expoConfig.hostUri` is populated in
  Expo Go but *not* in a development build, where it fell back to `localhost` —
  which on an Android emulator is the emulator itself. `src/api/client.ts` now
  derives the host from `NativeModules.SourceCode.scriptURL`, with `10.0.2.2` as
  the Android last resort.
- **Drag lift on Android** is driven by `elevation`, not `zIndex`, and
  `shadowOpacity` is a no-op there — `DayTimeline` animates both.
- **Android 15+ is edge-to-edge**, so `StatusBar backgroundColor` is ignored and
  logs a warning; only `style` applies. Surface colour comes from `contentStyle`.
- **Every `<Modal>` needs `onRequestClose`** or the hardware back button exits
  the app instead of closing the sheet.
- **Break intervals** come from `ScheduleService` as `{start, end}` but the
  schedule editor uses `{start_time, end_time}`. `breakBounds()` in
  `features/calendar/layout.ts` accepts either — use it, don't index raw.
- Admin and employee query hooks each take an `enabled` flag; gate them by area
  or the wrong one fires and 403s on every load.

## State of play

Branch `feature/mobile-api-v1`. API v1 + app + Expo push channel are committed
and pushed. ~46 **pre-existing** web Feature test failures were already red on
master before this work — verify with `git stash` before blaming a change.
`tests/Feature/Api/` (48 tests) passes.

Not done yet, and none of it is code: `npx eas init` (needed for a push
`projectId`), real URLs in `eas.json`, app icons (still Expo's template),
Apple Developer / Play Console accounts, privacy policy, reviewer demo account.
