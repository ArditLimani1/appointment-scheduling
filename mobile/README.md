# NiTermin Mobile

React Native (Expo) app for business admins and employees. Talks to the Laravel
API v1 (`/api/v1`, contract in `../docs/api-v1.md`).

## Stack

- Expo SDK 57 + expo-router (file-based routing, `src/app/`)
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

Push notifications require an EAS project (`npx eas init`) so
`getExpoPushTokenAsync` has a projectId; the backend sends via
`App\Notifications\Channels\ExpoPushChannel`.

## Structure

    src/api        fetch client, payload types, TanStack Query hooks
    src/auth       zustand session store (SecureStore-backed)
    src/i18n       translations from GET /translations, disk-cached
    src/theme      M3 tokens
    src/components shared UI kit (Button, Card, TextField, …)
    src/features   calendar (day timeline + iPad week grid), sheets, forms
    src/app        expo-router routes: login + (app)/ tabs
