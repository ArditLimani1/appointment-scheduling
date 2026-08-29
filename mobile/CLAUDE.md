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
(calendar drag) · expo-secure-store (token) · expo-notifications (Expo Push) ·
expo-image-picker (business logo).

Design tokens in `src/theme/tokens.ts` follow the web. The colour ramp is copied
1:1 from the root `tailwind.config.js`; the radius scale is **named like the
web's** (`DEFAULT/lg/xl/2xl/3xl`) so a Tailwind class ports over directly. Keep
them in sync, don't invent colours.

**The house style is not "Material defaults over that palette".** Read how the
Inertia pages actually use the ramp before styling anything new:

- The primary action is **`onSurface` (near-black) on `surface` text** —
  `bg-on-surface text-surface rounded-xl font-bold`. `primary` (#006398) is a
  tint, never a button fill. Secondary is `surfaceContainerHigh`; destructive is
  the soft `red50` fill with a `red200` border, not a solid red.
- Panels are **ringed, not bordered**: `rounded-2xl ring-1 ring-slate-100
  shadow-sm` on `surfaceContainerLowest` (`Card` in `components/ui.tsx`).
- Selected states (segmented control, filter chips, today's column) are white
  with a `slate200` ring, or near-black when they read as an action — never a
  primary-blue fill.
- Field labels are the web's `overline`: 10px Inter bold, uppercase, wide
  tracking, `outline` colour.
- Status colours live in `statusColors` and come from `AppointmentStatusMenu.jsx`:
  pending is neutral grey, confirmed is the bright `tertiaryFixed` green,
  cancelled is `errorContainer`. Not amber/blue.

Fonts are **Manrope (headings) + Inter (body)**, loaded in `src/app/_layout.tsx`.
Import the per-weight subpaths (`@expo-google-fonts/inter/600SemiBold`) — the
package root re-exports all 25 faces and Metro bundles every one (~8 MB). Every
`typography.*` token names a family, so **never override `fontWeight`** on top of
one; a static font ignores it and falls back. Set `fontFamily` from `fonts.*`.

## Layout

    src/api        client.ts (fetch + auth + base URL), types.ts, queries.ts (all hooks)
    src/auth       zustand store, SecureStore-backed
    src/i18n       translations from GET /translations, cached on disk
    src/components Screen, ui.tsx kit, AppointmentCard, DateBar, Toast
    src/features   calendar/ (DayTimeline, WeekGrid, layout.ts, employeeColors.ts,
                   statusIcon.ts), appointments/, manage/, schedule/
    src/utils      datetime.ts (display normalisers for API date/time strings)
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
- **New lang keys need an app restart, not a reload.** Translations are fetched
  once on boot from `GET /translations` and cached on disk, so a fast refresh
  keeps serving the old copy and the new key renders as `mobile.sheet.edit`.
  Force-stop and relaunch (or reinstall) after touching `lang/`.
- **Adding a native package needs a rebuild, not a reload.** Installing something
  like `expo-image-picker` and hot-reloading gives
  `Cannot find native module 'Exponent…'` — the installed dev-build APK was
  compiled without it. Re-run `npx expo run:android`. Only JS changes hot-reload.
- **`Appointment.date` is not always `Y-m-d`.** Services format it, but a raw
  serialised model (create / status-update responses) yields
  `2026-08-29T00:00:00.000000Z`; times come as `H:i` *or* `H:i:s`. Always render
  through `toIsoDate` / `toHm` / `toTimeRange` in `src/utils/datetime.ts`, and
  never re-parse those values through a zoned DateTime — the day slips by one.
- **Toasts, not `Alert`, for notices.** `ToastProvider` (mounted in
  `src/app/_layout.tsx`) mirrors the web's `SuccessToastProvider`; use
  `useToast().showSuccess/showError`. `Alert` stays only for *confirm* dialogs.
  A `<Modal>` renders in its own window, so the root host cannot paint over an
  open sheet — every modal that can raise a toast while staying open needs its
  own `<ToastHost />` (AppointmentSheet and FormSheet have one).
- **`employee_name` / `service_name` on an appointment are deletion snapshots**,
  not the live values — they are null while the employee or service row exists.
  The live name is on the eager-loaded relation (`employee.name`), which the list
  and calendar payloads both carry. Use `employeeName()` / `serviceName()` from
  `components/AppointmentCard.tsx`; they mirror `Appointment::resolvedEmployeeName()`.
- **Business settings are at full web parity** — `(app)/settings.tsx` mirrors
  `Pages/Admin/Settings/Index.jsx` section for section and reuses the
  `admin.settings.*` lang group, so add new options to both or neither. The
  client-identifier choice is gated on `me.features.whatsapp`, and the
  owner-works-as-staff toggle on the payload's `show_owner_staff_toggle`.
- **Logo upload must go over `POST /admin/settings`**, not the `PUT` the rest of
  the form uses: PHP leaves `$_FILES` empty on a PUT, so the route has a POST
  alias onto the same controller action. `api()` sends a `FormData` body as
  multipart and leaves the Content-Type boundary to the runtime.
- **Calendar blocks are coloured by employee, not by status** — same as the web.
  `features/calendar/employeeColors.ts` is a 1:1 port of
  `resources/js/utils/employeeCalendarColor.js` (roster order by id), and status
  is carried by the corner icon from `statusIcon.ts`. Keep both in sync with the
  web when either changes; `statusColors` in the theme is for pills only.

- **The settings screen hosts one non-business field.**
  `notify_others_appointments` is a per-user opt-in (users column) to receive the
  new-appointment notice for *other* staff's bookings — default off. It saves
  through `PUT /admin/settings/notifications`, gated on `admin.appointments`,
  while the business form still needs `admin.settings`. `GET /admin/settings`
  opens for either and returns `can_manage_settings` / `can_manage_appointments`;
  render only the tabs the viewer may actually change.

## State of play

Branch `feature/mobile-api-v1`. API v1 + app + Expo push channel are committed
and pushed. ~46 **pre-existing** web Feature test failures were already red on
master before this work — verify with `git stash` before blaming a change.
`tests/Feature/Api/` (48 tests) passes.

Not done yet, and none of it is code: `npx eas init` (needed for a push
`projectId`), real URLs in `eas.json`, app icons (still Expo's template),
Apple Developer / Play Console accounts, privacy policy, reviewer demo account.
