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
- [x] Platform build verification
  - [x] Android: `npx expo run:android` builds + app launches
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

- [x] Online/offline detection
  - [x] Install `@react-native-community/netinfo`
  - [x] `useOnlineStatus()` hook (bridge React Query `onlineManager`)
- [x] React Query setup
  - [x] `QueryProvider` with `QueryClient` defaults
  - [x] Persist to AsyncStorage (`@tanstack/query-async-storage-persister`)
  - [x] maxAge: 30 days
  - [x] Respect `meta.persist === true`
- [x] tRPC client
  - [x] `httpBatchLink` → `${API_BASE_URL}/api/trpc`
  - [x] Auth token in `Authorization` header via `setAuthToken`
  - [x] Type-only imports from `apps/api/src/trpc/app-router.type.ts`
- [x] `useExchangeRates` parity
  - [x] `exchangeRates.getLatest` query
  - [x] Surface: `rates`, `statusLine`, `syncingRates`, `lastUpdated`
  - [x] Offline/error banners with `formatRate` from `@bcv-rates/domain`

**Exit criteria:** kill app → relaunch offline → still see rates if previously loaded.

---

## Phase 4 — Converter parity (VES ⇄ USD/EUR + custom rate)
**Goal:** input behavior and formatting match web; mobile keyboard UX is solid.

- [x] Reuse domain helpers
  - [x] `@bcv-rates/domain`: `parseAmount`, `formatAmount`, `formatRate`, `vesToForeign`, `foreignToVes`
- [x] RN components
  - [x] `CurrencyInput` — `decimal-pad`, symbol overlay, exchange rate hint, `selectTextOnFocus`
  - [x] `CustomRateInput` — rate + amount fields with formatted display
- [x] Converter hook
  - [x] `useCurrencyConverter` (identical semantics to web)
  - [x] "Update one field updates others" behavior
  - [x] Edge cases: empty input, leading decimals, comma vs dot
- [x] Intl/formatting verification
  - [x] Validate `Intl.NumberFormat` on Hermes Android (Hermes supports Intl since Expo SDK 49+)
  - [x] Fallback formatter if needed (not needed — Hermes Intl support is complete)

**Exit criteria:** typing is responsive; results match web for same inputs.

---

## Phase 5 — Auth (Firebase JS SDK: Google + email/password)
**Goal:** stable auth across restarts; authenticated calls work.

- [x] Firebase JS SDK setup
  - [x] Initialize Firebase with same config as web
  - [x] Ensure `firebase/auth` works in Expo environment
- [x] Google Sign-In
  - [x] Choose approach: Expo AuthSession OR `@react-native-google-signin/google-signin` config plugin
  - [x] Implement `signInWithCredential` flow
- [x] `AuthProvider` API
  - [x] `user`, `loading` — `onAuthStateChanged` listener
  - [x] `signInWithGoogle`
  - [x] `signInWithEmailPassword`
  - [x] `signUpWithEmailPassword`
  - [x] `signOut` — clear token, remove user-scoped caches
- [x] Auth UI
  - [x] Auth modal: Google + email/password forms
  - [x] Toast feedback on success/failure
  - [x] Home screen: user info section / sign-in button
- [x] Wire auth into tRPC headers
  - [x] Token refresh via `onIdTokenChanged`
  - [x] On sign-out: clear user-scoped query caches

**Exit criteria:** user can sign in/out; authenticated endpoints work; auth persists after restart.

---

## Phase 6 — Custom rates (CRUD + offline read-only)
**Goal:** manage custom rates online; view cached list offline read-only.

- [x] Data
  - [x] `customRates.list` query (persist last result)
  - [x] Mutations: `create`, `update`, `delete`
  - [x] Invalidate list on mutation success
- [x] Offline behavior
  - [x] When offline: disable CRUD controls
  - [x] Banner: "Offline — read-only"
  - [x] Render cached list for last signed-in user
- [x] Settings screen
  - [x] List view
  - [x] Create form
  - [x] Empty/loading/error states
- [x] Converter integration
  - [x] Custom rate selector uses cached list
  - [x] Recompute conversions when selected rate changes

**Exit criteria:** CRUD works online; offline shows cached list and prevents edits.

---

## Phase 7 — History chart (USD/EUR; 7/14/30/90d) ✅
**Goal:** authenticated users can view history; chart is smooth on Android.

- [x] Data
  - [x] `historicalRates.getHistory` query `{ currency, limit }`
  - [x] Loading/empty/error states
- [x] Dates
  - [x] Use `@bcv-rates/domain` date helpers (timezone-safe)
- [x] Chart
  - [x] Install `react-native-gifted-charts`
  - [x] Line/area chart with tooltip (pointer config)
  - [x] Currency toggle (USD/EUR), range selector (7/14/30/90)
- [x] Performance
  - [x] Memoize series transformations
  - [x] Avoid unnecessary re-renders (useCallback, useMemo)

**Exit criteria:** chart loads correctly and doesn't jank on mid-range Android. ✅

---

## Phase 8 — Analytics (Umami, gated by env)
**Goal:** parity event tracking with web.

- [x] Env gating (`UMAMI_ENABLED`)
- [x] Umami client
  - [x] `track(event, data?)`
  - [x] `trackOnce(key, event, data?)`
  - [x] `trackDebounced(key, event, data?, delay)`
  - [x] HTTP POST to Umami endpoint
- [x] Key events (match web)
  - [x] rates loaded
  - [x] sign in / sign out
  - [x] custom rate CRUD (optional)
  - [x] history viewed (optional)

**Exit criteria:** events send only when enabled; no calls when disabled.

---

## Phase 9 — Config/environments + real-device workflow ✅
**Goal:** base URL and envs are predictable across all runtime targets.

- [x] `app.config.ts` extra fields
  - [x] `API_BASE_URL` (read via `Constants.expoConfig.extra.apiBaseUrl`)
  - [x] `UMAMI_ENABLED`
  - [x] `UMAMI_HOST`
  - [x] `UMAMI_WEBSITE_ID`
- [x] `getApiBaseUrl()` reads `API_BASE_URL` from `app.config.ts` extra via `expo-constants`
- [x] Dev-only "missing config" screen (not needed with production-only base URL)
- [x] Update `apps/mobile/.env.example` with Umami vars + notes

**Exit criteria:** app can hit the production API from emulator/simulator/device; Umami is configurable via env and gated by `UMAMI_ENABLED`.

---

## Phase 10 — Quality + release readiness
**Goal:** signed builds from clean checkout; no crashes.

- [x] Tests
  - [x] Unit tests for `@bcv-rates/domain`
  - [ ] Minimal integration smoke test (optional)
- [x] Error handling polish
  - [x] Clear offline/error messaging
  - [x] No crashes on missing/empty data
- [ ] Release builds
  - [x] EAS Build setup
  - [ ] Android: AAB build; measure size
  - [ ] iOS: archive build; size check
- [x] Docs
  - [x] `apps/mobile/README.md`
    - [x] Monorepo setup notes
    - [x] Env setup
    - [x] Running on devices
    - [x] EAS Build instructions

**Exit criteria:** can produce a releasable build; onboarding is documented.

---

## Phase 11 — Native Google Sign-In (UX upgrade) ✅
**Goal:** replace browser-based Google auth with native one-tap sign-in for a smoother UX.

- [x] Install `@react-native-google-signin/google-signin`
- [x] Add config plugin to `app.config.ts`
- [x] Create platform-specific OAuth client IDs
  - [x] Android: Google Cloud Console → OAuth client → Android (needs SHA-1 + package name)
  - [ ] iOS: Google Cloud Console → OAuth client → iOS (needs bundle ID)
- [x] Update `app/auth.tsx` to use `GoogleSignin.signIn()` instead of `AuthRequest.promptAsync`
- [x] Rebuild native projects (`expo run:android`)
- [x] Verify sign-in flow on Android

**Exit criteria:** native account picker appears instead of browser redirect; Firebase auth still works. ✅ Android verified.

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
