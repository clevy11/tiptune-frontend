# TipTune Frontend Deep Dive

This is the implementation-level continuation guide for this frontend.

## 1. How To Read This

1. Start with `ARCHITECTURE.md` for the big picture.
2. Use this file when changing a specific feature.
3. Follow each feature’s “Safe modification checklist” before shipping.

## 2. App Boot Sequence

```mermaid
sequenceDiagram
  autonumber
  participant B as Browser
  participant N as Next App
  participant L as app/layout.tsx
  participant P as app/providers.tsx
  participant Q as QueryClient

  B->>N: Request page
  N->>L: Render RootLayout
  L->>P: Wrap children with Providers
  P->>Q: Create QueryClient (stale/gc/retry rules)
  Q-->>B: Hydrated app ready
```

Key files:

1. `app/layout.tsx`
2. `app/providers.tsx`

## 3. Auth and Role Routing Deep Dive

### 3.1 Login flow sequence

```mermaid
sequenceDiagram
  autonumber
  participant U as User
  participant LP as /login page
  participant RQ as useMutation
  participant API as authApi.login
  participant BE as Backend
  participant LS as localStorage
  participant RT as Router

  U->>LP: Submit email/password
  LP->>RQ: mutate(formData)
  RQ->>API: POST /auth/login
  API->>BE: Request
  BE-->>API: token + user
  API->>LS: set token/user
  API-->>RQ: success
  RQ->>RT: push('/dashboard')
```

### 3.2 Dashboard role redirection sequence

```mermaid
sequenceDiagram
  autonumber
  participant DP as /dashboard page
  participant AUTH as getCurrentUser
  participant GUARD as getDashboardPath
  participant RT as Router

  DP->>AUTH: read user from localStorage
  AUTH-->>DP: user or null
  DP->>GUARD: map role to dashboard path
  GUARD-->>DP: /dashboard/user|dj|admin|login
  DP->>RT: push(path)
```

Safe modification checklist:

1. Keep auth writes centralized in `authApi.login/register`.
2. Do not duplicate token parsing logic in page components.
3. If adding roles, update:
4. `lib/types.ts` Role enum
5. `lib/roleGuard.ts`
6. dashboard route redirects and UI labels

## 4. API Layer Deep Dive

Core principles in `lib/api.ts`:

1. Single Axios instance for authenticated app requests.
2. Request interceptor for bearer token.
3. Response interceptor for 401 handling and error message extraction.
4. Namespace-style API functions per domain.

### 4.1 401 handling sequence

```mermaid
sequenceDiagram
  autonumber
  participant UI as Any Page
  participant AX as Axios Instance
  participant BE as Backend
  participant LS as localStorage
  participant BR as Browser

  UI->>AX: API call
  AX->>BE: HTTP request
  BE-->>AX: 401 Unauthorized
  AX->>LS: remove token/user
  AX->>BR: location.href='/login'
```

Safe modification checklist:

1. Add new endpoints to existing namespaces where possible.
2. Keep request/response typing in `lib/types.ts`.
3. Do not bypass the shared Axios instance for protected calls.
4. For public endpoints, document clearly why they bypass auth.

## 5. React Query Strategy Deep Dive

### 5.1 Mutation invalidation pattern

```mermaid
sequenceDiagram
  autonumber
  participant UI as Dashboard UI
  participant M as useMutation
  participant API as lib/api.ts
  participant BE as Backend
  participant QC as QueryClient
  participant Q as useQuery

  UI->>M: trigger mutation
  M->>API: update/create/delete request
  API->>BE: HTTP write
  BE-->>API: success
  API-->>M: success
  M->>QC: invalidateQueries(keys)
  QC->>Q: refetch active queries
  Q-->>UI: refreshed state
```

Safe modification checklist:

1. Use stable query keys with parameterized tuples.
2. Invalidate only related keys to avoid unnecessary network load.
3. Prefer invalidation over manual deep cache mutation unless required.
4. Keep stale/gc values intentional per feature.

## 6. DJ Dashboard Deep Dive

Main file: `app/dashboard/dj/page.tsx`.

### 6.1 Event management sequence

```mermaid
sequenceDiagram
  autonumber
  participant DJ as DJ User
  participant UI as DJ Dashboard
  participant M as useMutation
  participant API as djApi
  participant QC as QueryClient

  DJ->>UI: Create/Edit/End/Delete event
  UI->>M: mutate(payload)
  M->>API: POST/PUT/DELETE /dj/events...
  API-->>M: success
  M->>QC: invalidate ['dj-events']
  QC-->>UI: refresh event list
```

### 6.2 Request moderation sequence

```mermaid
sequenceDiagram
  autonumber
  participant DJ as DJ User
  participant UI as Request Card
  participant M as updateStatusMutation
  participant API as songRequestApi
  participant QC as QueryClient

  DJ->>UI: Accept/Decline/Played
  UI->>M: mutate(id,status)
  M->>API: PATCH /requests/{id}/status
  API-->>M: success
  M->>QC: invalidate ['dj-events']
  M->>QC: invalidate ['dj-requests', eventId, filter, sort]
```

### 6.3 Tip settings and permanent tip link sequence

```mermaid
sequenceDiagram
  autonumber
  participant DJ as DJ User
  participant UI as Tip Settings Form
  participant M as updateTipSettingsMutation
  participant API as djApi.updateTipSettings
  participant QC as QueryClient

  DJ->>UI: Save MoMo/Phone settings
  UI->>M: mutate(settings)
  M->>API: PUT /dj/me/tip-settings
  API-->>M: tipLinkToken + settings
  M->>QC: invalidate tip-settings and tip-records
  QC-->>UI: re-render with permanent tip link/QR
```

Safe modification checklist:

1. Keep event validation consistent:
2. start >= now
3. end > start
4. Keep tip code numeric sanitation rules aligned with backend contract.
5. Reuse existing keys:
6. `['dj-events']`
7. `['dj-requests', selectedEventId, apiFilter, requestSort]`
8. `['dj-tip-settings']`
9. `['dj-tip-records']`
10. `['dj-revenue-summary', from, to]`

## 7. Realtime and Notifications Deep Dive

### 7.1 Event request subscription sequence

```mermaid
sequenceDiagram
  autonumber
  participant UI as DJ Dashboard
  participant WS as websocketService
  participant BE as Broker
  participant QC as QueryClient

  UI->>WS: subscribeToEventRequests(eventId, cb)
  WS->>BE: SUBSCRIBE /topic/event/{id}/requests
  BE-->>WS: SongRequest message
  WS-->>UI: cb(payload)
  UI->>QC: invalidate dj-events + dj-requests
```

### 7.2 DJ notifications sequence

```mermaid
sequenceDiagram
  autonumber
  participant UI as DJ Dashboard
  participant WS as websocketService
  participant BE as Broker
  participant ST as notificationStore
  participant NP as Notification Panel

  UI->>WS: subscribeToDjNotifications(djId, cb)
  WS->>BE: SUBSCRIBE /topic/dj/{id}
  BE-->>WS: Notification payload
  WS-->>UI: cb(notification)
  UI->>ST: addNotification/addSongRequestNotification
  ST-->>NP: unread/panel list updates
```

Safe modification checklist:

1. Always unsubscribe in effect cleanup.
2. Avoid duplicate subscriptions by guarding connection state.
3. Keep topic naming conventions consistent with backend.
4. For new notification types, extend `Notification` type safely in `lib/types.ts`.

## 8. Admin Dashboard Deep Dive

Main file: `app/dashboard/admin/page.tsx`.

### 8.1 Tab-driven fetch behavior

Only fetches heavy tab data when tab is active:

1. users tab fetches users query
2. events tab fetches events query
3. requests tab fetches requests query
4. revenue tab fetches revenue datasets

This is controlled by `enabled` conditions in each `useQuery`.

### 8.2 Revenue analytics sequence

```mermaid
sequenceDiagram
  autonumber
  participant A as Admin User
  participant UI as Revenue Tab
  participant Q1 as revenueByDj query
  participant Q2 as revenueSeries query
  participant Q3 as topSongs query
  participant API as adminApi
  participant BE as Backend

  A->>UI: Adjust DJ/date/interval filters
  UI->>Q1: refetch with filters
  UI->>Q2: refetch with filters
  UI->>Q3: refetch with filters
  Q1->>API: getRevenueByDj
  Q2->>API: getRevenueSeries
  Q3->>API: getTopSongs
  API->>BE: REST requests
  BE-->>API: filtered datasets
  API-->>UI: chart/table/song updates
```

Safe modification checklist:

1. Keep analytics filters synchronized with query keys.
2. Do not enable heavy queries outside active tab unless needed.
3. Reuse `FullScreenOverlay` without triggering extra refetches.

## 9. Public Event and Tip Flows Deep Dive

Main files:

1. `app/event/[accessToken]/page.tsx`
2. `app/tip/[token]/page.tsx`

### 9.1 Public request with optional tip sequence

```mermaid
sequenceDiagram
  autonumber
  participant G as Guest
  participant UI as Public Event Page
  participant M as createMutation
  participant API as songRequestApi.createPublic
  participant TIP as publicTipApi.submitTip
  participant BE as Backend

  G->>UI: Fill song form (+optional tip)
  UI->>M: mutate(public payload)
  M->>API: POST /requests/public
  API->>BE: create request
  BE-->>API: success
  API-->>UI: success
  UI->>TIP: submit tip record (if enabled)
  TIP->>BE: POST /public/tip
  BE-->>TIP: success
  UI->>G: trigger tel: USSD dial
```

### 9.2 Tip-only page sequence

```mermaid
sequenceDiagram
  autonumber
  participant G as Guest
  participant TP as Tip Page
  participant Q as tip-info query
  participant API as publicTipApi
  participant BE as Backend

  TP->>Q: fetch token details
  Q->>API: GET /public/tip-info/{token}
  API->>BE: request
  BE-->>API: djName/payment details
  API-->>TP: render tip UI
  G->>TP: submit tip
  TP->>API: POST /public/tip
  API->>BE: record tip
  BE-->>TP: success
  TP->>G: open tel: USSD
```

Safe modification checklist:

1. Keep event blocked-state handling consistent with backend statuses.
2. Keep amount bounds synchronized with backend validation.
3. Never trigger payment redirect when tip record submission fails.

## 10. Export System Deep Dive

Files:

1. `components/export/QRDownload.tsx`
2. `components/export/ReportExport.tsx`

### 10.1 QR export behavior

1. Accepts `data:` or `blob:` URL.
2. Converts blob URL to data URL for PDF embedding.
3. Supports PNG and PDF download.

### 10.2 Report export behavior

1. CSV built from title + generated timestamp + summary + tables.
2. PDF built with `jsPDF` + `jspdf-autotable`.
3. Uses currently available in-memory data.

Safe modification checklist:

1. Keep generated export data deterministic and typed.
2. Avoid hidden backend calls during export unless explicitly needed.
3. Keep filename conventions human-readable and traceable.

## 11. UI Component Patterns

1. `GlassCard` for most containers.
2. `GlowButton` wraps shared button variants with motion.
3. `ResponsiveTable` for desktop table + mobile cards.
4. `MobileDrawer` for mobile navigation panels.
5. `FullScreenOverlay` for analytics expansion.
6. `DatePicker` and `DateTimePicker` for date inputs.

Safe modification checklist:

1. Reuse these components before creating new variants.
2. Preserve accessibility labels and keyboard interactions.
3. Keep mobile tap-target sizes (`min-h-[44px]`) intact.

## 12. Cross-Cutting Constraints

### 12.1 Hydration safety

Use `useMounted()` when rendering logic depends on:

1. `window`
2. `localStorage`
3. client-only APIs

### 12.2 Date/time formatting

Use shared format helpers from `lib/utils.ts`:

1. `formatInRwanda`
2. `formatDateInRwanda`
3. `formatTimeInRwanda`

### 12.3 Error normalization

Use `getApiErrorMessage` (`lib/apiClient.ts`) for user-facing error copy consistency.

## 13. Known Technical Debt

1. Very large page files:
2. `app/dashboard/dj/page.tsx`
3. `app/dashboard/admin/page.tsx`
4. client-only auth guard approach should be strengthened server-side.
5. repeated tip-link QR rendering logic appears in multiple DJ layout branches.

## 14. Suggested Refactor Plan (Low Risk First)

1. Extract DJ page sections into focused components:
2. `DjHeader`
3. `DjEventSidebar`
4. `DjRequestsPanel`
5. `DjTipSettingsCard`
6. `DjRevenuePanel`
7. Extract Admin analytics blocks into reusable section components.
8. Create a shared `TipLinkQrCard` component.
9. Move auth to cookie model once backend supports it.

## 15. PR Checklist For Future Changes

1. Types updated in `lib/types.ts`.
2. API contract added in `lib/api.ts`.
3. Query keys stable and invalidation correct.
4. WebSocket cleanup added if subscription introduced.
5. Mobile and desktop behavior both verified.
6. Error state and loading state handled.
7. Security impact reviewed:
8. auth boundary
9. data exposure
10. third-party calls
11. Export behavior verified if reporting/tip/QR changed.

