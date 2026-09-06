# NiTermin Mobile

React Native (Expo) app for business admins and employees. Talks to the Laravel
API v1 (`/api/v1`, contract in `../docs/api-v1.md`).

## Stack

- Expo SDK 54 + expo-router (file-based routing, `src/app/`)
- TypeScript strict
- TanStack Query (server state) + Zustand (session)
- Luxon — all date math in the business timezone (`/me → business.timezone`)
- Reanimated + Gesture Handler — calendar drag-to-reschedule
- expo-secure-store (token), expo-notifications (push via Expo Push Service)
- M3 design tokens ported from the web `tailwind.config.js` (`src/theme/tokens.ts`)

## Run (development)

1. Start the Laravel API: `php artisan serve` (port 8000) from the repo root.
2. `npm install && npx expo start` — in Expo Go / dev build on the same LAN the
   API base URL is derived automatically from the dev-server host.
   Override with `EXPO_PUBLIC_API_URL=https://…`.

## Builds

EAS profiles live in `eas.json` (`development`, `preview`, `production`).
Set the real API URLs there, then:

    npx eas build --profile production --platform all

## Push notifications

Delivery goes through Expo's push service: the app registers an
`ExponentPushToken` with `POST /api/v1/devices`, and the backend sends via
`App\Notifications\Channels\ExpoPushChannel`. Android still needs FCM
underneath, because that is the only push transport Android supports.

### google-services.json

`app.json` points at `./google-services.json`, but the file is **gitignored** —
it is a credential, so it is not in the repo. Android builds fail without it.
To get your copy:

1. Open the [Firebase console](https://console.firebase.google.com/) and pick
   the **nitermin-app** project (ask Altin for access).
2. ⚙️ **Project settings** → **Your apps** → the Android app
   `com.nitermin.app`.
3. **Download google-services.json** and drop it in this directory
   (`mobile/google-services.json`).
4. `npx expo prebuild --platform android` to regenerate `android/`, then
   `npx expo run:android`.

The package name in the file must be `com.nitermin.app` or the device never
gets a token.

### Sending (maintainers only)

Expo needs a Firebase service account key to talk to FCM on our behalf. It is
uploaded once per project, not per developer — you only redo this if it is
rotated:

1. Firebase → **Project settings** → **Service accounts** →
   **Generate new private key**.
2. `npx eas-cli@latest credentials -p android` → *Google Service Account* →
   *Manage your Google Service Account Key for Push Notifications (FCM V1)* →
   point it at the downloaded JSON.

Without it `exp.host` answers `InvalidCredentials` and nothing is delivered.
Never commit that key, or `GoogleService-Info.plist` — `.gitignore` covers both.

iOS push additionally needs an APNs key (`.p8`) plus Key ID and Team ID from the
Apple Developer account, uploaded with `eas credentials -p ios`. Not set up yet.

## Structure

    src/api        fetch client, payload types, TanStack Query hooks
    src/auth       zustand session store (SecureStore-backed)
    src/i18n       translations from GET /translations, disk-cached
    src/theme      M3 tokens
    src/components shared UI kit (Button, Card, TextField, …)
    src/features   calendar (day timeline + iPad week grid), sheets, forms
    src/app        expo-router routes: login + (app)/ tabs
