## Expo mobile app plan (`apps/mobile`)

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

This plan builds **an Expo-managed mobile app** with the same functionality and UX-level behavior as the web app.

---

### Goals and success criteria

- **Functional parity**
  - The mobile app can do everything `apps/web` does (converter + custom rates + history + auth).
- **Offline parity**
  - Rates remain usable offline after at least one successful online load.
  - Custom rates remain viewable offline for the signed-in user (read-only).
- **Performance**
  - App starts quickly, scroll/input is responsive, chart interactions don't jank on mid-range Android.
- **Developer experience**
  - Expo managed workflow: no manual Gradle/Xcode configuration.
  - `npx expo start` / `npx expo run:android` / `npx expo run:ios` just work.
- **Monorepo-friendly**
  - Lives under `apps/mobile` and works with pnpm workspaces + turbo lint/type-check conventions.

Non-goals (for v1):

- No push notifications, widgets, background fetch, or offline-first syncing beyond what web does today.
- No additional product features beyond what `apps/web` ships today.

---

### Proposed repo structure

```
apps/mobile/
  app/                    # Expo Router file-based routes
    _layout.tsx           # Root layout (providers, theme, navigation)
    index.tsx             # Home (converter + rates)
    settings.tsx          # Custom rates CRUD
    history.tsx           # Historical chart
    auth.tsx              # Auth modal
  src/
    components/           # Reusable UI components
      primitives/         # Card, Button, Input, Label, SectionDivider, Banner
      CurrencyInput.tsx
      CustomRateInput.tsx
    hooks/                # Custom hooks (useExchangeRates, useCurrencyConverter, etc.)
    lib/                  # tRPC client, auth errors, utilities
    providers/            # AuthProvider, QueryProvider, TrpcProvider
    theme/                # Colors, ThemeProvider
  app.config.ts           # Expo configuration
  metro.config.js         # Metro config (monorepo support)
  tsconfig.json
  package.json
```

Shared packages:

- `packages/domain/` — pure functions + types shared across web and mobile (formatters, conversion, dates).
- `apps/api/src/trpc/app-router.type.ts` — type-only router import for tRPC client.

---

### Key technical decisions

#### App + runtime

- **Expo SDK 54** (managed workflow)
- **New Architecture enabled** (Fabric + TurboModules)
- **Hermes** JS engine (default with Expo)
- **Expo Router** for file-based navigation

#### Styling / UI

- **`StyleSheet`** — standard RN approach, no heavy UI framework.
- Small internal component set: `Card`, `Button`, `Input`, `SectionDivider`, `Banner`, etc.

#### Navigation

- **Expo Router** (file-based routing).
- Routes:
  - `/` — Home (converter + rates)
  - `/settings` — Custom rates CRUD
  - `/history` — Historical chart (auth-gated)
  - `/auth` — Auth modal (presented modally)

#### Networking / offline detection

- **`@react-native-community/netinfo`** — replaces `navigator.onLine` from the web.

#### tRPC + caching

- Same stack as web: `@trpc/client`, `@tanstack/react-query`
- Persist React Query cache to device storage via `@react-native-async-storage/async-storage` + `@tanstack/query-async-storage-persister`
- Persist same query set as web (rates + custom rates list)
- `meta.persist === true` behavior identical to web

#### Firebase auth

- **Firebase JS SDK** (`firebase/auth`) — same as `apps/web`, no native Firebase modules needed.
- Google sign-in: `signInWithCredential` via the Firebase JS SDK (Google token obtained through Expo AuthSession or `@react-native-google-signin/google-signin` with config plugin).
- Email/password: `signInWithEmailAndPassword` / `createUserWithEmailAndPassword` — identical to web.

This approach means:
- No `google-services.json` or `GoogleService-Info.plist` needed for basic auth.
- Same Firebase config object shared between web and mobile.
- Simpler setup and fewer native dependencies.

#### Charts (History)

- **`react-native-gifted-charts`** — good performance, straightforward API.
- Keep the chart layer isolated so it can be swapped later.

#### Config / environments

- **Expo Constants + `app.config.ts`** for environment variables (replaces `react-native-config`).
- `extra` field in `app.config.ts` for runtime env vars (`UMAMI_*`, Firebase, etc.).
- **API base URL**: read from `API_BASE_URL` env var via `app.config.ts` extra → `expo-constants` at runtime.

#### Analytics (Umami)

- Same as web concept: HTTP POST to Umami tracking endpoint.
- `track/trackOnce/trackDebounced` gated by `UMAMI_ENABLED` env flag.

---

### Parity matrix: web → mobile

| Feature | Web | Mobile (Expo) |
|---------|-----|---------------|
| Exchange rates | `useExchangeRates` + persisted React Query | Same hook; persist to AsyncStorage; offline banner |
| Converter | `useCurrencyConverter` + `@bcv-rates/domain` | Same domain helpers; `decimal-pad` keyboard UX |
| Custom rates | tRPC CRUD + localStorage cache | tRPC CRUD + AsyncStorage cache; offline read-only |
| History chart | Recharts | `react-native-gifted-charts` |
| Auth | Firebase Web SDK + `signInWithPopup` | Firebase JS SDK + `signInWithCredential` |
| Toasts | `sonner` | `react-native-toast-message` |
| Offline | `navigator.onLine` | `@react-native-community/netinfo` |
| Env vars | `import.meta.env.*` | `expo-constants` + `app.config.ts` |

---

### Implementation plan (phased)

#### Phase 0 — Shared domain package (COMPLETED)

Already done. `packages/domain/` contains formatters, conversion helpers, and date utilities. `apps/web` uses them.

#### Phase 1 — Bootstrap Expo app + monorepo wiring

Deliverable: `apps/mobile` runs on iOS + Android from the pnpm/turbo monorepo.

- Create Expo app with Expo Router.
- Wire into monorepo (pnpm, turbo, biome).
- Configure `metro.config.js` for pnpm workspace resolution.
- Configure `app.config.ts` with `com.sneyderangulo.elcambio` identifiers.
- Verify: `pnpm lint`, `pnpm type-check`, `npx expo start`, `npx expo run:android`.

#### Phase 2 — App skeleton + UI foundation

Deliverable: navigation routes exist; base UI components exist; theme system works.

- Implement Expo Router screens: Home, Settings, History, Auth (modal).
- Theme system (light/dark, automatic).
- UI primitives: `Card`, `Button`, `Input`, `Label`, `SectionDivider`, `Banner`.
- Icons: `lucide-react-native` + `react-native-svg`.
- Toast provider via `react-native-toast-message`.

#### Phase 3 — Data layer (tRPC + React Query + persistence + offline)

Deliverable: rates load, persist 30 days, and render offline after first load.

- Online/offline detection via `@react-native-community/netinfo`.
- React Query setup with AsyncStorage persistence (30-day maxAge).
- tRPC client with `httpBatchLink` → `${API_BASE_URL}/api/trpc`.
- `useExchangeRates` hook with offline/error banners.

#### Phase 4 — Converter parity (VES ⇄ USD/EUR + custom rate)

Deliverable: converter inputs behave like the web app.

- `CurrencyInput` and `CustomRateInput` components.
- `useCurrencyConverter` hook using `@bcv-rates/domain`.
- Mobile keyboard UX: `decimal-pad`, `selectTextOnFocus`.

#### Phase 5 — Auth (Firebase JS SDK: Google + email/password)

Deliverable: user can sign in/out; auth persists across restarts.

- Firebase JS SDK setup (same config as web).
- `AuthProvider` with `onAuthStateChanged`, token sync to tRPC.
- Google sign-in via Expo AuthSession or config plugin.
- Auth screen: Google + email/password forms with toast feedback.

#### Phase 6 — Custom rates (CRUD + offline read-only)

Deliverable: manage custom rates online; view cached list offline.

- `customRates.list` query with cache persistence.
- Mutations: create, update, delete.
- Offline: disable CRUD, show "read-only" banner, render cached list.
- Settings screen with list view and create form.

#### Phase 7 — History chart (USD/EUR; 7/14/30/90d)

Deliverable: authenticated users can view smooth history charts.

- `historicalRates.getHistory` query.
- `react-native-gifted-charts` line/area chart with tooltip.
- Currency toggle (USD/EUR) + range selector (7/14/30/90).
- Timezone-safe date parsing via `@bcv-rates/domain`.

#### Phase 8 — Analytics (Umami, gated by env)

Deliverable: event tracking parity with web.

- `track/trackOnce/trackDebounced` via HTTP POST.
- Gated by `UMAMI_ENABLED` env flag.

#### Phase 9 — Config/environments + real-device workflow

Deliverable: predictable API URLs and env vars across all runtime targets.

- `app.config.ts` extra fields for `API_BASE_URL`, `UMAMI_*`.
- Platform-aware `getApiBaseUrl()`.
- Dev-only "missing config" screen.

#### Phase 10 — Quality + release readiness

Deliverable: signed builds from clean checkout; no crashes.

- Unit tests for `@bcv-rates/domain`.
- Error handling polish.
- EAS Build setup for Android (AAB) and iOS (archive).
- Documentation in `apps/mobile/README.md`.

---

### Performance + bundle size plan

- Keep dependencies minimal.
- Hermes enabled by default with Expo.
- Prefer type-only imports from API (avoid bundling server code).
- Tree-shake icons (per-icon imports from `lucide-react-native`).
- Defer non-critical screens if they grow.

---

### Risks and mitigations

- **pnpm + Expo Metro resolution** — Expo has better monorepo support than bare RN; configure `metro.config.js` with `watchFolders` and `nodeModulesPaths`.
- **Firebase JS SDK on mobile** — works well with Expo; Google sign-in needs either AuthSession or a config plugin for native Google sign-in.
- **Chart library weight/perf** — start simple; keep chart isolated for swapability.

---

### Definition of done (v1)

- Anonymous users:
  - Can load rates (online) and use converter.
  - Can continue using cached rates offline after first load.
- Authenticated users:
  - Can sign in with Google and email/password; sign out works.
  - Can view/manage custom rates online; can view cached custom rates offline (read-only).
  - Can view historical chart online (clear empty/loading states).
- Repo:
  - `apps/mobile` exists under pnpm workspace.
  - `pnpm lint`, `pnpm type-check` pass across the monorepo.
  - `npx expo run:android` and `npx expo run:ios` produce working builds.
