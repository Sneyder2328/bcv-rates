## Bare React Native app plan (`apps/mobile`)

### Context / parity target (what we are cloning from `apps/web`)

The current PWA is a single-screen app with modal dialogs, backed by:

- **tRPC over HTTP** to `apps/api` (`/api/trpc`), with **Firebase ID token** auth in the `Authorization` header.
- **React Query** caching with **persistent storage** (30 days) for `exchangeRates.getLatest` (queries with `meta.persist === true`).
- **Offline behavior**
  - Shows rates from persisted cache when offline.
  - Custom rates list is cached locally and shown **read-only** when offline.
- **Auth (Firebase)**
  - Google sign-in + email/password login/signup.
- **Features**
  - VES ⇄ USD/EUR conversion.
  - Custom rate conversion (user-selected label).
  - Custom rates CRUD (create/update/delete) for authenticated users, with offline read-only behavior.
  - Historical chart (USD/EUR, 7/14/30/90d) for authenticated users.
- **Analytics**
  - Umami events (optional).

This plan builds **a bare React Native app first** with the same functionality and UX-level behavior, then keeps the door open to a future Kotlin/Swift rewrite by isolating domain logic.

---

### Goals and success criteria

- **Functional parity**
  - The mobile app can do everything `apps/web` does (converter + custom rates + history + auth).
- **Offline parity**
  - Rates remain usable offline after at least one successful online load.
  - Custom rates remain viewable offline for the signed-in user (read-only).
- **Performance**
  - App starts quickly, scroll/input is responsive, chart interactions don’t jank on mid-range Android.
- **Bundle size discipline**
  - Avoid heavy UI/animation stacks unless needed; measure early and continuously.
- **Monorepo-friendly**
  - Lives under `apps/mobile` and works with pnpm workspaces + turbo lint/type-check conventions.

Non-goals (for v1):

- No push notifications, widgets, background fetch, or offline-first syncing beyond what web does today.
- No additional product features beyond what `apps/web` ships today (everything else is explicitly out of scope for this plan).

---

### Proposed repo structure

Create a new app:

- `apps/mobile/` (React Native CLI, TypeScript)

Add shared packages (required):

- `packages/domain/`
  - Pure functions + types shared across web and mobile (no React, no platform APIs).
  - Candidates: `parseAmount`, `formatAmount`, `formatRate`, converter math, date helpers, and shared analytics helpers/types.
  - Goal: mobile and web reuse the same parsing/formatting/conversion behavior.

Keep API types shared via the existing type-only router:

- `apps/api/src/trpc/app-router.type.ts` (already exists and is client-safe if imported as **type-only**).

---

### Key technical decisions (recommended defaults)

#### App + runtime

- **React Native CLI** (bare)
- **Hermes enabled** for both Android and iOS (best default for perf and size).
- Prefer the **new architecture** only if the chosen RN version enables it cleanly for your setup (not required for this app’s scope).

#### Styling / UI

- **Use `StyleSheet`** (preferred for performance and “standard RN” ergonomics).
- Build a small internal component set (`Card`, `Button`, `Input`, `SectionDivider`, etc.) that is **mobile-adapted** (not a pixel-perfect Tailwind port).

#### Navigation / modals

- **Use React Navigation** and let it drive the flow where it makes sense on mobile.
- Proposed initial structure (parity + mobile UX):
  - **Root Stack**
    - `Home` (converter + rates)
    - `Settings` (custom rates CRUD) (push)
    - `History` (historical chart + filters) (push, only accessible when signed in)
    - `Auth` (modal) (login/signup)
  - This keeps Home clean and avoids stacking too much UI into a single scroll view.

#### Networking / offline detection

- Replace `navigator.onLine` with **`@react-native-community/netinfo`**.

#### tRPC + caching

- Use the same stack as web:
  - `@trpc/client`, `@trpc/react-query`, `@tanstack/react-query`
- Persist React Query cache to device storage:
  - Use `@react-native-async-storage/async-storage` and a TanStack persister (`@tanstack/query-async-storage-persister`), or a small custom persister wrapper.
- Persist the same query set as web (rates), and for parity with offline custom rates, also persist:
  - `customRates.list` (scoped by user)

#### Firebase auth

For bare RN, prefer native Firebase:

- `@react-native-firebase/app`
- `@react-native-firebase/auth`
- Google sign-in:
  - `@react-native-google-signin/google-signin` + Firebase credential sign-in

This avoids webview/popup issues and provides stable auth on both platforms.

#### Charts (History)

Recharts won’t work in RN. Choose one:

- **Use `react-native-gifted-charts`** (good performance and a straightforward API for typical mobile chart UX).
- Keep the chart layer isolated so it can be swapped later if requirements change.

#### Config / environments

Web uses `import.meta.env.*`. Mobile needs a replacement:

- **Use `react-native-config`** (most common/standard for bare RN `.env` support across iOS/Android).

Important: API base URL differs per runtime:

- **Android emulator**: `http://10.0.2.2:<port>`
- **iOS simulator**: `http://localhost:<port>`
- **Physical devices**: `http://<LAN IP>:<port>` (or use a public dev URL)

Plan: implement `getApiBaseUrl()` that selects defaults per platform and allows overrides via env.

#### Analytics (Umami)

Umami in web relies on `window.umami`. In RN:

- Implement `track/trackOnce/trackDebounced` that POSTs to Umami’s HTTP tracking endpoint.
- **Gate analytics behind an env flag** (mobile parity with web’s `VITE_UMAMI_ENABLED`), so it can be disabled in dev or privacy-sensitive builds.

---

### Parity matrix: web → mobile

- **Exchange rates**
  - Web: `useExchangeRates` + persisted React Query
  - Mobile: same hook concept; persist to AsyncStorage; offline status line + syncing indicator
- **Converter**
  - Web: `useCurrencyConverter` + `packages/domain` formatters/conversion helpers
  - Mobile: reuse the same `packages/domain` helpers; confirm `Intl.NumberFormat` availability on Hermes (or add polyfill or custom formatter)
- **Custom rates**
  - Web: tRPC list + local cache in `localStorage`, CRUD in `SettingsDialog`
  - Mobile: persist `customRates.list` query; CRUD screen/modal; offline “read-only” gating via NetInfo
- **History chart**
  - Web: Recharts `HistoryChart`
  - Mobile: `react-native-gifted-charts`, same currency/days controls + tooltip
- **Auth**
  - Web: Firebase Web SDK + `signInWithPopup`
  - Mobile: RN Firebase + native Google sign-in + email/password
- **Toasts**
  - Web: `sonner`
  - Mobile: `react-native-toast-message` (or similar)

---

### Implementation plan (phased)

#### Phase 0a — Create `packages/domain` and migrate web to use it

Deliverable: shared domain code exists and `apps/web` imports it (no behavior change).

- Create `packages/domain` as a TS package with:
  - `src/formatters.ts` (move `parseAmount`, `formatAmount`, `formatRate` from `apps/web/src/utils/formatters.ts`)
  - `src/conversion.ts` (shared conversion helpers used by `useCurrencyConverter`)
  - `src/dates.ts` (timezone-safe calendar date parsing helpers used by History)
  - `src/index.ts` exports
- Update `apps/web` imports to use `@bcv-rates/domain`:
  - Replace `@/utils/formatters` with domain equivalents.
  - Optionally keep thin re-export wrappers in `apps/web/src/utils/` during transition.
- Add lint/type-check scripts for `packages/domain` so turbo includes it.

#### Phase 0 — Bootstrap `apps/mobile` (project + monorepo wiring)

Deliverable: the app runs on iOS + Android locally (blank screen).

- Create `apps/mobile` via React Native CLI (TypeScript template).
- Add `apps/mobile/package.json` scripts aligned with turbo tasks:
  - `dev` (start Metro)
  - `android`, `ios`
  - `lint`, `lint:fix` (Biome), `type-check` (tsc)
- Monorepo wiring (pnpm + Metro):
  - Configure `metro.config.js` for workspace/hoisting/symlink resolution.
  - Ensure Metro can resolve deps installed by pnpm (watch folders + resolver settings).
- TypeScript path aliases:
  - Mirror web’s `@/*` and `@api/*` patterns.
  - Ensure runtime aliasing via Babel/module resolver if you use path aliases in runtime imports.
- Environment variables:
  - Add `react-native-config` and wire `.env` files for `apps/mobile` (e.g. `.env.development`, `.env.production`).
  - Define baseline vars:
    - `API_BASE_URL`
    - `UMAMI_ENABLED`
    - `UMAMI_HOST` (or full endpoint URL)
    - `UMAMI_WEBSITE_ID`
- CI sanity:
  - Ensure `pnpm lint` and `pnpm type-check` include `apps/mobile` without breaking other apps.

Notes / risks:

- pnpm + Metro is the biggest “setup tax”. Bake time into this phase and document the final configuration.

#### Phase 1 — App skeleton + UI foundation

Deliverable: navigation skeleton exists; Home/Settings/History/Auth routes render.

- App root providers:
  - `AuthProvider` (RN Firebase)
  - `TrpcProvider` (React Query + persistence + tRPC)
  - Toast provider
- Navigation:
  - Set up `@react-navigation/native` + native stack and the initial route structure described above.
- UI primitives:
  - `Card`, `Button`, `Input`, `Label`, `SectionDivider` implemented with `StyleSheet`
  - Icon strategy (`lucide-react-native` + `react-native-svg`)
- Layout:
  - `SafeAreaView` + (screen-specific) `ScrollView` as needed.
- Background decoration:
  - Simplified gradient/background for parity (don’t overinvest early).

#### Phase 2 — Data layer parity (tRPC + caching + offline)

Deliverable: rates load and persist; offline mode works for rates.

- Implement `TrpcProvider`:
  - `httpBatchLink` pointing to `API_BASE_URL + /api/trpc`
  - Async header function to attach Firebase token when signed in
  - React Query cache persist to AsyncStorage (maxAge 30 days)
  - `meta.persist` behavior same as web
- Implement NetInfo-based online status hook (`useOnlineStatus`).
- Implement `useExchangeRates`:
  - Derive same `rates`, `statusLine`, `syncingRates` fields as web.
  - Track one-time “rates_loaded” (optional).

#### Phase 3 — Converter parity (VES/USD/EUR + custom rate)

Deliverable: converter inputs behave like the web app.

- Implement converter behavior using `packages/domain` helpers:
  - Keep input-to-input update semantics identical to web.
  - Ensure decimal input UX works well on mobile keyboards.
- Create RN `CurrencyInput` and `CustomRateInput` components:
  - Handle decimal keyboards and locale separators.
  - Keep UX: updating one field updates others.
- Validate formatting behavior on:
  - iOS (Intl usually OK)
  - Android Hermes (verify Intl; add fallback if needed)

#### Phase 4 — Auth parity (Google + email/password)

Deliverable: user can sign in/out; auth state is stable across restarts.

- Firebase setup:
  - Add Android/iOS apps in Firebase console.
  - Add `google-services.json` + `GoogleService-Info.plist`.
  - Configure iOS URL schemes / reversed client id for Google sign-in.
- Implement RN `AuthProvider` with API matching web:
  - `user`, `loading`, `signInWithGoogle`, `signInWithEmailPassword`, `signUpWithEmailPassword`, `signOut`
- UI:
  - Auth modal: Google + email/password forms
  - Toasts on success/failure

#### Phase 5 — Custom rates parity (list + CRUD + offline read-only)

Deliverable: authenticated users can manage custom rates; offline view works.

- Data:
  - `customRates.list` query (enabled only when online, but **persist last result** for offline view)
  - Mutations: create/update/delete with list invalidation
- Offline behavior:
  - When offline: disable CRUD actions; show banner “read-only”
  - Still display cached list
- UI:
  - Settings modal/screen replicating `SettingsDialog` behavior:
    - list with edit-in-place or separate edit UI
    - max per user indicator
    - create form

#### Phase 6 — History chart parity (USD/EUR + day range)

Deliverable: authenticated users can see history; chart is readable and responsive.

- Data:
  - `historicalRates.getHistory` query by `{ currency, limit }`
  - Loading skeleton and empty state
- Chart:
  - Implement chart with `react-native-gifted-charts`:
    - Area/line chart with tooltip
    - Currency toggle (USD/EUR) and day-range selector (7/14/30/90)
  - Keep the web’s timezone-safe date parsing logic (treat API dates as calendar dates).

#### Phase 7 — Analytics parity (Umami on mobile)

Deliverable: event tracking parity with web (gated by env flag).

- Implement a small RN analytics client:
  - `track`, `trackOnce`, `trackDebounced`
  - Transport: HTTP call to Umami endpoint
  - Respect `UMAMI_ENABLED` to fully disable analytics when off

#### Phase 8 — Quality, testing, and “release readiness”

Deliverable: you can produce a signed Android build and an iOS archive from a clean checkout.

- Testing:
  - Unit tests for `parseAmount`, formatting, conversion logic
  - Integration smoke test for tRPC calls (mock server optional)
  - (Optional) Detox smoke test: app launches, rates render
- Error handling:
  - Clear offline/error messages (match web)
  - Don’t crash on missing config; show a “misconfigured app” screen in dev builds
- Release build sanity:
  - Android: AAB build, R8 enabled, Hermes enabled
  - iOS: archive, Hermes enabled, App Thinning considered

---

### Performance + bundle size plan (measure early)

#### Baseline measurements to capture

- **Startup time**
  - Cold start to first interactive render (Android + iOS).
- **Smoothness**
  - Converter typing responsiveness (no dropped frames).
  - Chart render time and interaction jank on mid-range Android.
- **Bundle size**
  - Android: AAB download size + installed size (use `bundletool get-size total`)
  - iOS: app size with App Thinning (Xcode Organizer size report)

#### Practical levers (do these before “micro-optimizing”)

- Keep dependencies minimal (especially charting/animation stacks).
- Ensure Hermes is on; avoid pulling in Node polyfills.
- Prefer type-only imports from `@api/*` (avoid runtime importing server libs).
- Avoid large icon sets (tree-shake icons; prefer per-icon imports).
- Defer non-critical screens/modules if they grow (lazy-load History/Settings).

---

### Risks and mitigations

- **pnpm + Metro resolution issues**
  - Mitigation: adopt a known monorepo Metro config pattern and document it in `apps/mobile/README.md`.
- **Intl formatting differences on Android**
  - Mitigation: verify early; add a deterministic fallback formatter if needed.
- **Auth edge cases**
  - Mitigation: implement Google sign-in with native modules; add robust error messages and logout handling.
- **Chart library weight/perf**
  - Mitigation: start with a simple chart; keep the chart isolated so it can be swapped later.

---

### Future-proofing for a later Kotlin/Swift rewrite

To keep the “native rewrite” option open:

- Put domain logic in `packages/domain` (no React, no platform APIs).
- Keep API contracts and DTOs stable (`apps/api/src/trpc/app-router.type.ts` already acts as a contract).
- Keep mobile UI thin:
  - “Screen” components orchestrate hooks and rendering
  - business rules live in shared modules

---

### Definition of done (v1)

- Anonymous users:
  - Can load rates (online) and use converter.
  - Can continue using cached rates offline after first load.
- Authenticated users:
  - Can sign in with Google and email/password; sign out works.
  - Can view/manage custom rates online; can view cached custom rates offline (read-only).
  - Can view historical chart online (and see clear empty/loading states).
- Repo:
  - `apps/mobile` exists under pnpm workspace.
  - `pnpm lint`, `pnpm type-check` pass across the monorepo.

