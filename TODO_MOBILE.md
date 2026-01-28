# Mobile (Bare React Native) – Master TODO Checklist

This is the canonical checklist for building **`apps/mobile`** with parity to **`apps/web`** per `MOBILE_BARE_REACT_NATIVE_PLAN.md`.

## Locked decisions
- React Native: **latest available** at implementation time
- **New Architecture: ENABLED now** (Fabric + TurboModules)
- JS engine: **Hermes enabled** (Android + iOS)
- Charts: **react-native-gifted-charts**
- Analytics: **Umami** (RN HTTP client, gated by env flag)
- Toasts: **react-native-toast-message**
- Styling: `StyleSheet` (no heavy UI framework)
- Networking/offline: `@react-native-community/netinfo`
- Cache persistence: React Query → AsyncStorage (30 days)
- Auth: `@react-native-firebase/auth` + `@react-native-google-signin/google-signin`

---

## Phase 0 — Repo prep: shared domain package (web → domain)
**Goal:** shared formatting/conversion/date behavior lives in `packages/domain` and web uses it (no behavior change).

- [x] Create `packages/domain/`
  - [x] `src/formatters.ts` (move from `apps/web/src/utils/formatters.ts`)
    - [x] `parseAmount`
    - [x] `formatAmount`
    - [x] `formatRate`
    - [x] any helper functions used by web
  - [x] `src/conversion.ts` (converter math used by `useCurrencyConverter`)
  - [x] `src/dates.ts` (timezone-safe calendar-date helpers used by history)
  - [x] `src/index.ts` exports
- [x] Package wiring
  - [x] `packages/domain/package.json` (name: `@bcv-rates/domain`)
  - [x] `packages/domain/tsconfig.json`
  - [x] Add to turbo tasks (`lint`, `type-check`)
- [x] Migrate `apps/web` to use `@bcv-rates/domain`
  - [x] Replace formatter imports
  - [x] Replace conversion logic usage
  - [x] Replace date parsing usage in history chart
- [x] Web smoke test: no regression in converter/custom rates/history

**Exit criteria:** `pnpm lint` + `pnpm type-check` pass, and web behavior matches before. (Phase 0 completed)

---

## Phase 1 — Bootstrap `apps/mobile` (RN CLI + monorepo wiring)
**Goal:** `apps/mobile` runs on iOS + Android from the pnpm/turbo monorepo.

- [x] Create `apps/mobile` using React Native CLI (TypeScript template)
  - [x] Ensure **New Architecture enabled** at init (or enable immediately after)
  - [x] Ensure **Hermes enabled**
- [x] Workspace wiring
  - [x] Add `apps/mobile` to `pnpm-workspace.yaml`
  - [x] Add/align scripts in `apps/mobile/package.json`
    - [x] `dev` (Metro)
    - [x] `android`
    - [x] `ios`
    - [x] `lint` (Biome)
    - [x] `type-check` (tsc)
- [x] Metro + pnpm monorepo config
  - [x] `apps/mobile/metro.config.js` supports pnpm symlinks + watchFolders
  - [x] Confirm `@bcv-rates/domain` resolves at runtime
- [x] TypeScript + (optional) runtime path aliases
  - [x] `apps/mobile/tsconfig.json` (align with monorepo conventions)
  - [x] If using runtime aliases, configure Babel module resolver; otherwise avoid aliases early
- [ ] Platform build sanity
  - [ ] iOS: pods install + builds
  - [ ] Android: gradle build + app launches

**Exit criteria:** blank app renders on iOS + Android; repo-wide lint/type-check pass. (Phase 1 completed - builds require native toolchains)

---

## Phase 2 — App skeleton + UI foundation
**Goal:** navigation routes exist; base UI components exist; providers wired.

- [ ] Navigation
  - [ ] Install `@react-navigation/native` + native stack
  - [ ] Create root stack:
    - [ ] `Home`
    - [ ] `Settings` (push)
    - [ ] `History` (push; auth-gated)
    - [ ] `Auth` (modal)
- [ ] Providers
  - [ ] `AuthProvider` (stub until Phase 5)
  - [ ] `TrpcProvider` (stub until Phase 3)
  - [ ] Toast provider using `react-native-toast-message`
- [ ] UI primitives (StyleSheet)
  - [ ] `Card`
  - [ ] `Button`
  - [ ] `Input`
  - [ ] `Label`
  - [ ] `SectionDivider`
  - [ ] `Banner` (offline/read-only/errors)
- [ ] Icons
  - [ ] Choose icon approach (recommended: `lucide-react-native` + `react-native-svg`)
  - [ ] Ensure tree-shaking / per-icon import style
- [ ] Screen scaffolds
  - [ ] `HomeScreen` layout placeholder
  - [ ] `SettingsScreen` placeholder
  - [ ] `HistoryScreen` placeholder
  - [ ] `AuthModal` placeholder

**Exit criteria:** navigation works, screens render, toast can show a test message.

---

## Phase 3 — Data layer parity (tRPC + React Query + persistence + offline)
**Goal:** rates load, persist 30 days, and render offline after first successful load.

- [ ] Online/offline detection
  - [ ] Install `@react-native-community/netinfo`
  - [ ] Implement `useOnlineStatus()`
- [ ] React Query setup
  - [ ] Configure QueryClient defaults (match web intent)
  - [ ] Persist QueryClient to AsyncStorage
    - [ ] Install `@react-native-async-storage/async-storage`
    - [ ] Install `@tanstack/query-async-storage-persister` (or implement custom)
    - [ ] Persistence maxAge: **30 days**
  - [ ] Implement “persist only selected queries” (respect `meta.persist === true` like web)
- [ ] tRPC client
  - [ ] Configure `httpBatchLink` → `${API_BASE_URL}/api/trpc`
  - [ ] Attach Firebase ID token in `Authorization` header when signed in
  - [ ] Ensure type-only imports from `apps/api/src/trpc/app-router.type.ts`
- [ ] `useExchangeRates` parity
  - [ ] Implement `exchangeRates.getLatest` query
  - [ ] Surface: `rates`, `statusLine`, `syncingRates`, `lastUpdated` (if possible)
  - [ ] UI: show offline banner + “showing cached rates” messaging

**Exit criteria:** kill the app → relaunch offline → still see rates if previously loaded.

---

## Phase 4 — Converter parity (VES ⇄ USD/EUR + custom rate)
**Goal:** input behavior and formatting match web; mobile keyboard UX is solid.

- [ ] Reuse domain helpers
  - [ ] Use `@bcv-rates/domain` for parsing/formatting/conversion
- [ ] Implement RN components
  - [ ] `CurrencyInput` (VES, USD, EUR)
  - [ ] `CustomRateInput`
  - [ ] Proper keyboard types (`decimal-pad`), selection behavior, and caret stability
- [ ] Converter hook/logic
  - [ ] Match web’s “update one field updates others” semantics
  - [ ] Handle edge cases: empty input, leading decimals, comma vs dot
- [ ] Intl/formatting verification
  - [ ] Validate `Intl.NumberFormat` on Hermes Android
  - [ ] If inconsistent, implement deterministic fallback formatter in domain package

**Exit criteria:** typing is responsive; results match web for the same inputs.

---

## Phase 5 — Auth parity (Firebase native: Google + email/password)
**Goal:** stable auth across restarts; authenticated calls work.

- [ ] Firebase native setup
  - [ ] Install `@react-native-firebase/app` + `@react-native-firebase/auth`
  - [ ] Add Firebase config files
    - [ ] Android: `google-services.json`
    - [ ] iOS: `GoogleService-Info.plist`
  - [ ] Ensure build passes on both platforms
- [ ] Google Sign-In
  - [ ] Install `@react-native-google-signin/google-signin`
  - [ ] Configure iOS URL scheme / reversed client id
  - [ ] Configure Android (SHA-1/SHA-256 if required)
- [ ] Implement `AuthProvider` API
  - [ ] `user`, `loading`
  - [ ] `signInWithGoogle`
  - [ ] `signInWithEmailPassword`
  - [ ] `signUpWithEmailPassword`
  - [ ] `signOut`
- [ ] Auth UI
  - [ ] Auth modal with Google + email/password flows
  - [ ] Toast success/failure mapping
- [ ] Wire auth into tRPC headers
  - [ ] Token fetch/refresh behavior (getIdToken)
  - [ ] On sign-out: clear/segregate user-scoped caches as needed

**Exit criteria:** user can sign in/out; authenticated endpoints succeed; auth persists after restart.

---

## Phase 6 — Custom rates parity (CRUD + offline read-only)
**Goal:** manage custom rates online; view cached list offline read-only.

- [ ] Data
  - [ ] `customRates.list` query (persist last successful result)
  - [ ] Mutations: `create`, `update`, `delete`
  - [ ] Invalidate list on mutation success
- [ ] Offline behavior
  - [ ] When offline: disable CRUD controls
  - [ ] Banner: “Offline — read-only”
  - [ ] Still render cached list for last signed-in user
- [ ] Settings screen
  - [ ] List view (edit flow: inline or separate)
  - [ ] Create form
  - [ ] Empty/loading/error states
- [ ] Converter integration
  - [ ] Custom rate selector uses cached list
  - [ ] Recompute conversions when selected rate changes

**Exit criteria:** CRUD works online; offline shows cached list and prevents edits.

---

## Phase 7 — History chart parity (USD/EUR; 7/14/30/90d)
**Goal:** authenticated users can view history; chart is smooth on Android.

- [ ] Data
  - [ ] `historicalRates.getHistory` query `{ currency, limit }`
  - [ ] Proper loading/empty/error states
- [ ] Dates
  - [ ] Use domain date helpers to treat API dates as calendar dates (timezone-safe)
- [ ] Chart
  - [ ] Install and implement **`react-native-gifted-charts`**
  - [ ] Line/area chart with tooltip
  - [ ] Controls: currency toggle (USD/EUR), range selector (7/14/30/90)
- [ ] Performance
  - [ ] Memoize series transformations
  - [ ] Avoid unnecessary re-renders

**Exit criteria:** chart loads correctly and interactions don’t jank on mid-range Android.

---

## Phase 8 — Analytics parity (Umami, gated by env)
**Goal:** parity event tracking with web without relying on `window.umami`.

- [ ] Env gating
  - [ ] `UMAMI_ENABLED` fully disables analytics when false
- [ ] Implement Umami client (RN)
  - [ ] `track(event, data?)`
  - [ ] `trackOnce(key, event, data?)`
  - [ ] `trackDebounced(key, event, data?, delay)`
  - [ ] HTTP POST to Umami tracking endpoint
- [ ] Identify + implement key events (match web where applicable)
  - [ ] rates loaded
  - [ ] sign in / sign out
  - [ ] custom rate CRUD actions (optional)
  - [ ] history viewed (optional)

**Exit criteria:** events send only when enabled; no analytics network calls when disabled.

---

## Phase 9 — Config/environments + real-device workflow
**Goal:** base URL and envs are predictable across emulator/simulator/physical devices.

- [ ] `react-native-config`
  - [ ] Install + wire iOS/Android
  - [ ] Add `.env.development` / `.env.production` (or `.env` + build variants)
- [ ] Required env vars
  - [ ] `API_BASE_URL`
  - [ ] `UMAMI_ENABLED`
  - [ ] `UMAMI_HOST` (or full endpoint)
  - [ ] `UMAMI_WEBSITE_ID`
- [ ] `getApiBaseUrl()`
  - [ ] Android emulator default: `http://10.0.2.2:<port>`
  - [ ] iOS simulator default: `http://localhost:<port>`
  - [ ] Physical devices: require override (LAN IP/public dev URL)
- [ ] Misconfiguration UX
  - [ ] Dev-only “missing config” screen with actionable instructions

**Exit criteria:** app can hit local API from emulator/simulator and from a physical device with minimal friction.

---

## Phase 10 — Quality + release readiness
**Goal:** signed builds possible from clean checkout; no crashy edges.

- [ ] Tests
  - [ ] Unit tests for `@bcv-rates/domain` (parsing/formatting/conversion/dates)
  - [ ] Minimal integration smoke test for tRPC client (optional)
- [ ] Error handling polish
  - [ ] Clear offline/error messaging (match web intent)
  - [ ] No crashes on missing/empty data
- [ ] Release build sanity
  - [ ] Android: AAB build, Hermes on, R8 on; measure size
  - [ ] iOS: Archive build, Hermes on; size check via Organizer
- [ ] Docs
  - [ ] `apps/mobile/README.md` includes:
    - [ ] monorepo Metro notes
    - [ ] env setup
    - [ ] running on devices
    - [ ] Firebase/Google sign-in setup checklist

**Exit criteria:** can produce a releasable build; onboarding is documented.

---

## Definition of Done (v1)
- Anonymous users
  - [ ] Can load rates (online) and use converter
  - [ ] Can use cached rates offline after at least one successful load
- Authenticated users
  - [ ] Google + email/password sign-in works; sign-out works
  - [ ] Can manage custom rates online; can view cached custom rates offline (read-only)
  - [ ] Can view historical chart online with clear states
- Repo health
  - [ ] `pnpm lint` and `pnpm type-check` pass monorepo-wide
  - [ ] `apps/mobile` works under pnpm workspaces + turbo

---

## GitHub tracking (mirror only top-level phases)
Create issues for:
- [ ] Phase 0 — `packages/domain` extraction + web migration
- [ ] Phase 1 — Bootstrap `apps/mobile` + monorepo/Metro + New Architecture
- [ ] Phase 2 — Navigation + UI foundation + providers + toasts
- [ ] Phase 3 — tRPC + React Query persistence + offline rates
- [ ] Phase 4 — Converter parity
- [ ] Phase 5 — Firebase auth (Google + email/password)
- [ ] Phase 6 — Custom rates (CRUD + offline read-only)
- [ ] Phase 7 — History chart (gifted-charts)
- [ ] Phase 8 — Umami analytics
- [ ] Phase 9/10 — Env/config + release readiness
