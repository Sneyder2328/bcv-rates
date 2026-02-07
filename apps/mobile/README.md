# El Cambio (Expo) — `apps/mobile`

Expo SDK 54 mobile app for **El Cambio**, built in the `bcv-rates` pnpm monorepo.

## Requirements

- Node **20+**
- pnpm **10.x**
- Expo CLI (`npx expo ...`)
- Android Studio (Android) and/or Xcode (iOS)

## Setup

From the repo root:

```bash
pnpm install
```

Then configure env vars:

```bash
cp apps/mobile/.env.example apps/mobile/.env
```

Fill in `apps/mobile/.env` (Firebase + Google client ID). `API_BASE_URL` defaults to production if omitted.

## Run (development)

- **Expo Go (limited)**:

```bash
pnpm --filter @bcv-rates/mobile dev
```

This is useful for the converter + rates UI. **Google Sign-In will not work in Expo Go** (native module not present).

- **Development build (recommended)**:

```bash
pnpm --filter @bcv-rates/mobile android
# or
pnpm --filter @bcv-rates/mobile ios
```

## Running on devices

- **Android**: enable USB debugging, connect a device, then run:

```bash
pnpm --filter @bcv-rates/mobile android -- --device
```

- **iOS**: requires macOS + Xcode; for a connected device:

```bash
pnpm --filter @bcv-rates/mobile ios -- --device
```

## Shared workspace package (`@bcv-rates/domain`)

Mobile consumes `@bcv-rates/domain` from `packages/domain`.

- `pnpm install` will build it automatically (via `apps/mobile` `postinstall`).
- When actively changing domain code, run a watcher in another terminal:

```bash
pnpm --filter @bcv-rates/domain dev
```

## Tests

Unit tests (domain):

```bash
pnpm --filter @bcv-rates/domain test
```

Or from repo root:

```bash
pnpm test
```

## EAS Build (release builds)

EAS config lives in `apps/mobile/eas.json`.

From `apps/mobile`:

```bash
cd apps/mobile
eas login
eas build:configure
```

### Build profiles

- **development**: internal distribution + dev client
- **preview**: internal distribution (Android builds an `.apk`)
- **production**: store-ready (Android builds an `.aab`)

Examples:

```bash
cd apps/mobile
eas build --profile development --platform android
eas build --profile preview --platform android
eas build --profile production --platform android
eas build --profile production --platform ios
```

### Environment variables

`app.config.ts` reads configuration from `process.env` at build time (EAS or local).

Set the variables from `apps/mobile/.env.example` either:

- locally (in `apps/mobile/.env`), or
- in EAS (project environment variables / secrets)

### Size checks

- **Android (AAB)**: check the `.aab` artifact size from the EAS build output (and validate final download size in Play Console).
- **iOS (archive/IPA)**: check the `.ipa` size from the EAS build output (and validate final size in App Store Connect/TestFlight).

