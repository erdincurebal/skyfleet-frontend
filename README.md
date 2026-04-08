# SkyOps Mission Control — Frontend

Vue 3 SPA for the SkyOps Mission Control drone fleet management system. Built for the **Kopilot Tech — Senior Software Engineer** technical case study.

The companion NestJS backend lives in a separate repository and must be running for this app to be useful.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Vue 3 (Composition API, `<script setup>`) |
| Build tool | Vite |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS |
| Routing | Vue Router 4 |
| State | Pinia (minimal use) |
| HTTP client | axios |
| Date utils | dayjs |
| E2E testing | Playwright |

---

## Project layout

```
frontend/
├── src/
│   ├── views/              page components (Dashboard, Drones, DroneDetail, Missions, MissionDetail, MaintenanceLogs)
│   ├── components/         shared (StatusBadge, AppPagination, AppModal)
│   ├── composables/        data fetching (useDrones, useMissions, useFleetHealth, useMaintenance)
│   ├── api/                typed axios wrappers (one file per resource)
│   ├── types/              backend contract mirror (enums, drone, mission, maintenance log, fleet health, pagination)
│   ├── utils/              format helpers (date, hours)
│   ├── router/             route definitions
│   ├── App.vue             top-level layout (nav + RouterView)
│   └── main.ts             app bootstrap
├── e2e/
│   └── mission-lifecycle.spec.ts   full user flow over a real backend
├── playwright.config.ts
├── tailwind.config.js
├── vite.config.ts
├── tsconfig.json
├── .env.example
└── package.json
```

---

## Architectural decisions (the why)

### 1. Plain composables instead of a state library

Each resource has a small composable (`useDrones`, `useMissions`, `useFleetHealth`, `useMaintenance`) that wraps `ref` + axios calls. No Vuex, no Pinia store, no React Query equivalent.

**Why:** the app has very little global state. A store would add ceremony without benefit. Composables expose `data`, `loading`, `error` and a refetch function — that is all the views need.

### 2. Typed API client mirrors the backend contract

`src/types/` re-declares every entity, DTO, and enum that the backend exposes. `src/api/` has one wrapper per resource (`drones.api.ts`, `missions.api.ts`, etc.) that returns typed promises.

**Why:** the contract is explicit and lives in one place. When the backend changes, only `types/` and `api/` need updates; views remain framework-agnostic at the call site.

### 3. Hand-rolled forms — no react-hook-form / zod equivalent

Forms use bare `ref` + manual validation in the submit handler. Backend validation messages are surfaced directly into the form's error state.

**Why:** the case prioritizes business correctness over form ergonomics. A schema library would not catch any bug a backend `@IsEnum` already catches, and adds another dependency to learn.

### 4. Tailwind utility classes only

No custom CSS files beyond Tailwind directives. No design system. `StatusBadge` resolves status → utility class via a plain map.

**Why:** the case explicitly de-prioritizes UI polish in favor of business logic and tests. Tailwind utilities give consistent spacing/typography for free.

### 5. Single transition endpoint mirrored on the frontend

`MissionDetail.vue` reads the mission status and renders only the buttons for legal next states. Each button calls `POST /missions/:id/transition` with the right `targetStatus`. The state machine is the contract; the UI never duplicates the rules.

**Why:** if the backend's `ALLOWED_TRANSITIONS` map changes, only the rendering switch needs an update. Invalid states are impossible to trigger from the UI.

---

## Pages

| Route | Page | Notes |
|---|---|---|
| `/` | Dashboard | Fleet status cards (4), missions-next-24h, average flight hours, **overdue** alerts (red), **due-within-7-days** alerts (amber), recent + upcoming missions |
| `/drones` | DronesList | Paginated table, status filter, "New Drone" modal |
| `/drones/:id` | DroneDetail | Info card + Mission History tab + Maintenance History tab + Retire action (blocked if upcoming missions) |
| `/missions` | MissionsList | Paginated table, filters: status / drone / date range, "New Mission" modal (only AVAILABLE drones) |
| `/missions/:id` | MissionDetail | Info card + state-machine transition buttons (with inline forms for `loggedFlightHours` / `abortReason`) |
| `/maintenance` | MaintenanceLogs | Paginated table, drone filter, "New Log" modal (drone selection auto-fills `flightHoursAtMaintenance`) |

---

## Setup

### Prerequisites

- Node.js 20+
- npm 10+
- A running SkyOps backend at `http://localhost:3000` (see the backend repository)

### 1. Install + configure

```bash
cp .env.example .env       # VITE_API_URL=http://localhost:3000
npm install
```

### 2. Start the dev server

```bash
npm run dev                # http://localhost:5173
```

Open `http://localhost:5173`. The Dashboard loads `/fleet-health` from the backend; if the backend is not up you will see error states.

### 3. Production build

```bash
npm run build              # type-check + bundle to dist/
npm run preview            # serve dist/ locally
```

### Run in Docker

Dev (Vite with hot reload, bind-mounted source):

```bash
docker compose -f docker-compose.dev.yml up
# http://localhost:5173
```

Prod (multi-stage build, nginx serves the static bundle):

```bash
docker compose -f docker-compose.prod.yml up -d --build
# http://localhost:8080  (override with WEB_PORT)
```

The production image bakes `VITE_API_URL` at build time. Override it with:

```bash
VITE_API_URL=https://api.example.com docker compose -f docker-compose.prod.yml up -d --build
```

---

## E2E test (Playwright)

A single end-to-end test in `e2e/mission-lifecycle.spec.ts` exercises the full user flow against a **real** backend — no mocks, no stubs.

**Flow:**
1. Open `/drones`, click "+ New Drone", create a unique-serial drone
2. Open the drone detail page, verify status `AVAILABLE`
3. Open `/missions`, click "+ New Mission", create a mission against the new drone
4. Open the mission detail page
5. Transition: PLANNED → PRE_FLIGHT_CHECK → IN_PROGRESS → COMPLETED (with `loggedFlightHours = 2.5`)
6. Open `/`, verify the mission appears in recent missions
7. Open `/drones`, verify the drone now shows `2.5 h` of flight time

### Running

```bash
# 1. Start the backend in another terminal (see the backend repo)
#    cd ../backend && npm run start:dev

# 2. Install Playwright browsers (first time only)
npx playwright install --with-deps chromium

# 3. Run the test (Vite is started automatically by playwright.config.ts)
VITE_API_URL=http://localhost:3000 npx playwright test
```

---

## Trade-offs and known limitations

These are deliberate decisions documented for the live session discussion.

1. **No state library:** as explained above, plain composables are sufficient. If the app grew (multi-user, real-time, optimistic updates), Pinia stores would become useful.

2. **No skeleton loaders / animations:** loading states are plain `Loading…` text. Adequate for the case scope.

3. **Forms validate on submit only:** no per-field live validation. Errors come from the backend after submission.

4. **One mission transition endpoint, one inline form:** completing or aborting a mission opens a small inline form rather than a dedicated wizard. Faster to build, faster to use.

5. **Drone serial in mission rows is mapped client-side** when the backend response doesn't include the relation. This avoids extra requests for list pages where the relation is not eagerly loaded.

6. **No internationalization:** UI is English only.

7. **No authentication screen:** the case is an internal tool spec without auth requirements.

---

## Author

Built for the Kopilot Tech case study, April 2026.
