# Mobile (Expo) – Master TODO Checklist

This is the canonical checklist for building **`apps/mobile`** with parity to **`apps/web`** per `MOBILE_EXPO_PLAN.md`.

## Locked decisions
- Framework: **Expo SDK 54** (managed workflow)
- Navigation: **Expo Router** (file-based routing)
- **New Architecture: ENABLED** (Fabric + TurboModules, default in Expo SDK 54)
- JS engine: **Hermes** (default with Expo)
- Auth: **Firebase JS SDK** (`firebase/auth`, same as web — no native Firebase modules)
- Charts: **react-native-gifted-charts**
- Analytics: **Umami** (RN HTTP client, gated by env flag)
- Toasts: **react-native-toast-message**
- Styling: `StyleSheet` (no heavy UI framework)
- Networking/offline: `@react-native-community/netinfo`
- Cache persistence: React Query → AsyncStorage (30 days)
- Environment vars: `expo-constants` + `app.config.ts`
- Icons: `lucide-react-native` + `react-native-svg`
- Package identifiers: `com.sneyderangulo.elcambio`

---

## Phase 0 — Repo prep: shared domain package (web → domain)
**Goal:** shared formatting/conversion/date behavior lives in `packages/domain` and web uses it (no behavior change).

- [x] Create `packages/domain/`
  - [x] `src/formatters.ts` (`parseAmount`, `formatAmount`, `formatRate`)
  - [x] `src/conversion.ts` (converter math)
  - [x] `src/dates.ts` (timezone-safe calendar-date helpers)
  - [x] `src/index.ts` exports
- [x] Package wiring (`package.json`, `tsconfig.json`, lint/type-check scripts)
- [x] Migrate `apps/web` to use `@bcv-rates/domain`
- [x] Web smoke test: no regression

**Exit criteria:** `pnpm lint` + `pnpm type-check` pass; web behavior unchanged. ✅ COMPLETED

---

## Phase 1 — Bootstrap Expo app + monorepo wiring
**Goal:** `apps/mobile` runs on iOS + Android from the pnpm/turbo monorepo.

- [x] Create `apps/mobile` using Expo (TypeScript, Expo Router)
- [x] Configure `app.config.ts`
  - [x] `slug: "elcambio"`
  - [x] `android.package: "com.sneyderangulo.elcambio"`
  - [x] `ios.bundleIdentifier: "com.sneyderangulo.elcambio"`
- [x] Workspace wiring
  - [x] `apps/mobile` picked up by `pnpm-workspace.yaml`
  - [x] Scripts: `dev`, `android`, `ios`, `lint`, `lint:fix`, `type-check`
- [x] Metro + pnpm monorepo config
  - [x] `metro.config.js` with `watchFolders` + `nodeModulesPaths`
  - [x] `@bcv-rates/domain` resolves at runtime
- [x] TypeScript config (`tsconfig.json` extends `expo/tsconfig.base`)
- [ ] Platform build verification
  - [ ] Android: `npx expo run:android` builds + app launches
  - [ ] iOS: `npx expo run:ios` builds + app launches

**Exit criteria:** app renders placeholder on both platforms; `pnpm lint` + `pnpm type-check` pass monorepo-wide.

---

## Phase 2 — App skeleton + UI foundation
**Goal:** navigation routes exist; base UI components exist; providers wired.

- [x] Expo Router screens
  - [x] `app/_layout.tsx` — root layout with providers + theme
  - [x] `app/index.tsx` — Home screen
  - [x] `app/settings.tsx` — Settings screen
  - [x] `app/history.tsx` — History screen
  - [x] `app/auth.tsx` — Auth modal
- [x] Theme system
  - [x] Light/dark mode support (automatic via `useColorScheme`)
  - [x] `ThemeProvider` + `useTheme` hook
  - [x] Color palette matching web (Tailwind-based)
- [x] UI primitives (StyleSheet)
  - [x] `Card`
  - [x] `Button`
  - [x] `Input`
  - [x] `Label`
  - [x] `SectionDivider`
  - [x] `Banner` (offline/error/warning)
- [x] Icons
  - [x] `lucide-react-native` + `react-native-svg`
  - [x] Per-icon imports for tree-shaking
- [x] Toast provider (`react-native-toast-message`)

**Exit criteria:** navigation works, screens render, toast shows test message.

---

## Phase 3 — Data layer (tRPC + React Query + persistence + offline)
**Goal:** rates load, persist 30 days, and render offline after first successful load.

- [ ] Online/offline detection
  - [ ] Install `@react-native-community/netinfo`
  - [ ] `useOnlineStatus()` hook (bridge React Query `onlineManager`)
- [ ] React Query setup
  - [ ] `QueryProvider` with `QueryClient` defaults
  - [ ] Persist to AsyncStorage (`@tanstack/query-async-storage-persister`)
  - [ ] maxAge: 30 days
  - [ ] Respect `meta.persist === true`
- [ ] tRPC client
  - [ ] `httpBatchLink` → `${API_BASE_URL}/api/trpc`
  - [ ] Auth token in `Authorization` header via `setAuthToken`
  - [ ] Type-only imports from `apps/api/src/trpc/app-router.type.ts`
- [ ] `useExchangeRates` parity
  - [ ] `exchangeRates.getLatest` query
  - [ ] Surface: `rates`, `statusLine`, `syncingRates`, `lastUpdated`
  - [ ] Offline/error banners with `formatRate` from `@bcv-rates/domain`

**Exit criteria:** kill app → relaunch offline → still see rates if previously loaded.

---

## Phase 4 — Converter parity (VES ⇄ USD/EUR + custom rate)
**Goal:** input behavior and formatting match web; mobile keyboard UX is solid.

- [ ] Reuse domain helpers
  - [ ] `@bcv-rates/domain`: `parseAmount`, `formatAmount`, `formatRate`, `vesToForeign`, `foreignToVes`
- [ ] RN components
  - [ ] `CurrencyInput` — `decimal-pad`, symbol overlay, exchange rate hint, `selectTextOnFocus`
  - [ ] `CustomRateInput` — rate + amount fields with formatted display
- [ ] Converter hook
  - [ ] `useCurrencyConverter` (identical semantics to web)
  - [ ] "Update one field updates others" behavior
  - [ ] Edge cases: empty input, leading decimals, comma vs dot
- [ ] Intl/formatting verification
  - [ ] Validate `Intl.NumberFormat` on Hermes Android
  - [ ] Fallback formatter if needed

**Exit criteria:** typing is responsive; results match web for same inputs.

---

## Phase 5 — Auth (Firebase JS SDK: Google + email/password)
**Goal:** stable auth across restarts; authenticated calls work.

- [ ] Firebase JS SDK setup
  - [ ] Initialize Firebase with same config as web
  - [ ] Ensure `firebase/auth` works in Expo environment
- [ ] Google Sign-In
  - [ ] Choose approach: Expo AuthSession OR `@react-native-google-signin/google-signin` config plugin
  - [ ] Implement `signInWithCredential` flow
- [ ] `AuthProvider` API
  - [ ] `user`, `loading` — `onAuthStateChanged` listener
  - [ ] `signInWithGoogle`
  - [ ] `signInWithEmailPassword`
  - [ ] `signUpWithEmailPassword`
  - [ ] `signOut` — clear token, remove user-scoped caches
- [ ] Auth UI
  - [ ] Auth modal: Google + email/password forms
  - [ ] Toast feedback on success/failure
  - [ ] Home screen: user info section / sign-in button
- [ ] Wire auth into tRPC headers
  - [ ] Token refresh via `onIdTokenChanged`
  - [ ] On sign-out: clear user-scoped query caches

**Exit criteria:** user can sign in/out; authenticated endpoints work; auth persists after restart.

---

## Phase 6 — Custom rates (CRUD + offline read-only)
**Goal:** manage custom rates online; view cached list offline read-only.

- [ ] Data
  - [ ] `customRates.list` query (persist last result)
  - [ ] Mutations: `create`, `update`, `delete`
  - [ ] Invalidate list on mutation success
- [ ] Offline behavior
  - [ ] When offline: disable CRUD controls
  - [ ] Banner: "Offline — read-only"
  - [ ] Render cached list for last signed-in user
- [ ] Settings screen
  - [ ] List view
  - [ ] Create form
  - [ ] Empty/loading/error states
- [ ] Converter integration
  - [ ] Custom rate selector uses cached list
  - [ ] Recompute conversions when selected rate changes

**Exit criteria:** CRUD works online; offline shows cached list and prevents edits.

---

## Phase 7 — History chart (USD/EUR; 7/14/30/90d)
**Goal:** authenticated users can view history; chart is smooth on Android.

- [ ] Data
  - [ ] `historicalRates.getHistory` query `{ currency, limit }`
  - [ ] Loading/empty/error states
- [ ] Dates
  - [ ] Use `@bcv-rates/domain` date helpers (timezone-safe)
- [ ] Chart
  - [ ] Install `react-native-gifted-charts`
  - [ ] Line/area chart with tooltip
  - [ ] Currency toggle (USD/EUR), range selector (7/14/30/90)
- [ ] Performance
  - [ ] Memoize series transformations
  - [ ] Avoid unnecessary re-renders

**Exit criteria:** chart loads correctly and doesn't jank on mid-range Android.

---

## Phase 8 — Analytics (Umami, gated by env)
**Goal:** parity event tracking with web.

- [ ] Env gating (`UMAMI_ENABLED`)
- [ ] Umami client
  - [ ] `track(event, data?)`
  - [ ] `trackOnce(key, event, data?)`
  - [ ] `trackDebounced(key, event, data?, delay)`
  - [ ] HTTP POST to Umami endpoint
- [ ] Key events (match web)
  - [ ] rates loaded
  - [ ] sign in / sign out
  - [ ] custom rate CRUD (optional)
  - [ ] history viewed (optional)

**Exit criteria:** events send only when enabled; no calls when disabled.

---

## Phase 9 — Config/environments + real-device workflow
**Goal:** base URL and envs are predictable across all runtime targets.

- [ ] `app.config.ts` extra fields
  - [ ] `API_BASE_URL`
  - [ ] `UMAMI_ENABLED`
  - [ ] `UMAMI_HOST`
  - [ ] `UMAMI_WEBSITE_ID`
- [ ] `getApiBaseUrl()`
  - [ ] Android emulator: `http://10.0.2.2:<port>`
  - [ ] iOS simulator: `http://localhost:<port>`
  - [ ] Physical devices: override via env
- [ ] Dev-only "missing config" screen

**Exit criteria:** app can hit local API from emulator/simulator and from physical device.

---

## Phase 10 — Quality + release readiness
**Goal:** signed builds from clean checkout; no crashes.

- [ ] Tests
  - [ ] Unit tests for `@bcv-rates/domain`
  - [ ] Minimal integration smoke test (optional)
- [ ] Error handling polish
  - [ ] Clear offline/error messaging
  - [ ] No crashes on missing/empty data
- [ ] Release builds
  - [ ] EAS Build setup
  - [ ] Android: AAB build; measure size
  - [ ] iOS: archive build; size check
- [ ] Docs
  - [ ] `apps/mobile/README.md`
    - [ ] Monorepo setup notes
    - [ ] Env setup
    - [ ] Running on devices
    - [ ] EAS Build instructions

**Exit criteria:** can produce a releasable build; onboarding is documented.

---

## Definition of Done (v1)
- Anonymous users
  - [ ] Can load rates (online) and use converter
  - [ ] Can use cached rates offline after at least one successful load
- Authenticated users
  - [ ] Google + email/password sign-in works; sign-out works
  - [ ] Can manage custom rates online; view cached custom rates offline (read-only)
  - [ ] Can view historical chart online with clear states
- Repo health
  - [ ] `pnpm lint` and `pnpm type-check` pass monorepo-wide
  - [ ] `apps/mobile` works under pnpm workspaces + turbo
  - [ ] `npx expo run:android` and `npx expo run:ios` produce working builds
