# TipTune — Frontend

**TipTune** is a web application that lets DJs and artists run **instant song request experiences** at events. Guests scan a QR code, open a link, and submit song requests; DJs see requests in real time and manage them from a control panel. This repository is the **Next.js frontend** for TipTune.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Features](#features)
- [Architecture](#architecture)
- [Scripts](#scripts)
- [Performance & Caching](#performance--caching)
- [Responsive Design & Accessibility](#responsive-design--accessibility)
- [Export Features](#export-features)

---

## Overview

The frontend is a **mobile-first**, **role-based** single-page experience built with **Next.js 14** (App Router). It supports four user roles:

| Role         | Dashboard      | Main capabilities                                                |
| ------------ | -------------- | ----------------------------------------------------------------- |
| **USER**     | User dashboard | Browse public events, submit song requests, view own requests     |
| **DJ** / **ARTIST** | DJ dashboard  | Create events, get QR codes, manage song requests in real time   |
| **SUPER_ADMIN**     | Admin dashboard | Manage users, events, requests; view analytics; export reports |

Key behaviors:

- **Landing page** with hero background and dark overlay for readability.
- **JWT-based auth** with token and user stored in `localStorage`; 401 responses trigger redirect to login.
- **Role-based routing**: `/dashboard` redirects to the correct dashboard by role; dashboard routes guard by role and redirect unauthorized users.
- **Real-time updates** via WebSocket (STOMP over SockJS) for new song requests and DJ notifications.
- **QR codes** for events: display and **download as PNG or PDF** from DJ dashboard and event detail (for owners).
- **Report export** for Admin and DJ: **CSV** and **PDF** using current dashboard data (no extra backend calls).

---

## Tech Stack

| Category        | Technology |
| --------------- | ---------- |
| **Framework**   | Next.js 14 (App Router) |
| **Language**    | TypeScript |
| **Styling**    | Tailwind CSS, `tailwindcss-animate`, `clsx`, `tailwind-merge`, `class-variance-authority` |
| **Data & API**  | Axios, TanStack React Query v5 |
| **Real-time**   | STOMP over SockJS (`@stomp/stompjs`, `sockjs-client`) |
| **State**      | Zustand (notifications) |
| **UI / Motion**| Framer Motion, Lucide React icons |
| **Export**     | jsPDF, jspdf-autotable (reports), blob/data URL handling for QR (PNG/PDF) |
| **3D (optional)** | Three.js, React Three Fiber, Drei (e.g. vinyl visuals) |

---

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** or **yarn**
- A running **TipTune backend** (Spring Boot) for API and WebSocket

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create a `.env.local` (or `.env`) in the project root and set at least:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_WS_URL=http://localhost:8080/ws
```

For production, point these to your deployed backend base URL and WebSocket URL. See [Environment Variables](#environment-variables).

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app will use the API and WebSocket URLs from your env.

### 4. Build for production

```bash
npm run build
npm run start
```

---

## Environment Variables

| Variable               | Description                          | Example (local)                    |
| ---------------------- | ------------------------------------ | ---------------------------------- |
| `NEXT_PUBLIC_API_URL`  | Backend REST API base URL             | `http://localhost:8080/api/v1`     |
| `NEXT_PUBLIC_WS_URL`   | Backend WebSocket base URL (STOMP)   | `http://localhost:8080/ws`         |

- Both are **required** for full functionality (API calls and real-time updates).
- Only variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

---

## Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout, providers, revalidate
│   ├── page.tsx            # Landing (hero-3 background + overlay)
│   ├── providers.tsx       # React Query provider and defaults
│   ├── login/
│   ├── register/
│   ├── dashboard/          # Role-based dashboards
│   │   ├── page.tsx        # Redirects to role-specific dashboard
│   │   ├── user/
│   │   ├── dj/
│   │   └── admin/
│   ├── events/             # Public events list + event detail
│   │   ├── page.tsx
│   │   └── [id]/page.tsx   # Event detail, requests, QR (owner)
│   └── event/
│       └── [accessToken]/  # Public event page (submit requests, no login)
├── components/
│   ├── ui/                 # Buttons, inputs, MobileDrawer, ResponsiveTable
│   ├── theme/              # DashboardBackground, HeroWaveBottom, etc.
│   ├── landing/            # HeroSection, FeatureHighlight, galleries
│   ├── export/             # QRDownload, ReportExport
│   ├── notifications/      # NotificationBell, ToastNotification, panel
│   ├── music/              # MusicSearchInput, MusicResultItem
│   └── 3d/                 # Optional 3D (e.g. VinylDisc)
├── lib/
│   ├── api.ts              # Axios instance + auth/dj/user/event/songRequest/admin APIs
│   ├── types.ts            # Enums, interfaces (Role, Event, SongRequest, etc.)
│   ├── auth.ts             # getCurrentUser, getCurrentUserId, isAuthenticated
│   ├── roleGuard.ts        # getRequiredRole, shouldRedirect, getDashboardPath
│   ├── apiClient.ts        # ApiError, getApiErrorMessage
│   ├── websocket.ts        # WebSocketService (STOMP, event requests, DJ notifications)
│   ├── musicApi.ts         # External music search (if used)
│   └── utils.ts            # cn() (classnames)
├── hooks/
│   └── useMounted.ts       # Avoid hydration mismatch (e.g. reading localStorage)
├── store/
│   └── notificationStore.ts  # Zustand: notifications, unread count, panel open
└── public/
    └── images/landing/     # Hero, gallery, grid assets
```

---

## Features

### Landing page

- Full-view background image (`hero-3.jpg`) with a dark overlay for contrast.
- Hero section with headline, CTAs (Create QR, Browse Events), and optional image grid.
- Feature highlights, nightlife gallery, interactive image grid, and CTA block.
- Responsive nav (Sign In, Get Started) and touch-friendly buttons.

### Authentication

- **Login** (`/login`): email + password; JWT and user stored in `localStorage`; redirect to `/dashboard`.
- **Register** (`/register`): name, email, password, role (USER by default); same storage and redirect.
- **Logout**: clears token and user; redirects to `/login`.
- **401 handling**: Axios response interceptor clears auth and redirects to `/login` (except on auth endpoints).

### Dashboards (role-based)

- **`/dashboard`**: Redirects to `/dashboard/user`, `/dashboard/dj`, or `/dashboard/admin` based on current user role.
- **User dashboard** (`/dashboard/user`): List of public events and “my requests”; links to public event page and event detail.
- **DJ dashboard** (`/dashboard/dj`):
  - **Desktop:** Sidebar “My Events” + main content (selected event, QR, request stats, song request list).
  - **Mobile:** Hamburger opens a **drawer** with “My Events”; same content area.
  - Create event modal; accept/decline/played on requests; **QR display + Download PNG/PDF**; **Download Report** (CSV/PDF).
- **Admin dashboard** (`/dashboard/admin`):
  - Tabs: Overview (analytics cards, users by role, request breakdown, top DJs), Users, Events, Requests.
  - **ResponsiveTable**: table on `md+`, card layout on small screens.
  - **Download Report** (CSV/PDF) using analytics and current tab data.

### Events and song requests

- **Events list** (`/events`): Active events; links to event detail and dashboard.
- **Event detail** (`/events/[id]`): Event info, song requests; for **event owner**: QR image + **Download PNG/PDF** and “View QR Code” link.
- **Public event page** (`/event/[accessToken]`): No login; submit song request (manual fields or music search); see “played” list; WebSocket for live updates.

### Real-time (WebSocket)

- **Event requests**: Event detail and DJ dashboard subscribe to `/topic/event/{eventId}/requests` for new/updated song requests.
- **DJ notifications**: DJ dashboard subscribes to user-specific topic for song request notifications.
- Connection uses **STOMP over SockJS**; URL from `NEXT_PUBLIC_WS_URL`.

### Notifications

- **Zustand** store: list of notifications, unread count, panel open state.
- **NotificationBell** in DJ header; **ToastNotification** for toasts; **NotificationPanel** for list.
- New requests (from WebSocket) are pushed into the store and can trigger toasts.

---

## Architecture

### API layer (`lib/api.ts`)

- **Axios** instance with `baseURL` from `NEXT_PUBLIC_API_URL`.
- **Request interceptor**: adds `Authorization: Bearer <token>` from `localStorage`.
- **Response interceptor**: on 401 (non-auth URLs), clears token/user and redirects to `/login`; normalizes error messages from backend.
- Namespaced APIs: `authApi`, `djApi`, `userApi`, `eventApi`, `songRequestApi`, `adminApi` (login, events, requests, analytics, etc.).

### Auth and role guard

- **Auth** (`lib/auth.ts`): `getCurrentUser()`, `getCurrentUserId()`, `isAuthenticated()` (read from `localStorage` via `authApi`).
- **Role guard** (`lib/roleGuard.ts`): `getRequiredRole(pathname)`, `shouldRedirect(userRole, pathname)`, `getDashboardPath(role)`. Used in dashboard pages to redirect unauthenticated or wrong-role users.

### Data fetching and caching

- **TanStack React Query** in `app/providers.tsx`: default `staleTime` 5 min, `gcTime` 10 min; no refetch on window focus; no retry for 4xx.
- Queries keyed by resource (e.g. `['dj-events']`, `['admin-analytics', dateFrom, dateTo]`). Dashboards use per-query `staleTime`/`gcTime` where needed.
- Mutations invalidate relevant query keys so lists and analytics stay in sync.

### Hydration safety

- **`useMounted()`**: Used on pages that read `localStorage` (e.g. `getCurrentUser()`) so the first render is consistent and the second (client) shows role-dependent UI, avoiding hydration mismatch.

---

## Scripts

| Command         | Description                    |
| --------------- | ------------------------------ |
| `npm run dev`   | Start dev server (default 3000) |
| `npm run build` | Production build               |
| `npm run start` | Run production server           |
| `npm run lint`  | Run ESLint                     |

---

## Performance & Caching

- **React Query**: Reduces refetches with `staleTime` and `gcTime`; 4xx not retried.
- **ISR**: Root layout exports `revalidate = 60` for server-rendered content where applicable.
- **QR download**: Converts blob URL to data URL only when user clicks Download (no extra work on load).
- **Reports**: Built from data already in React Query (no dedicated report API calls).

---

## Responsive Design & Accessibility

- **Mobile-first** breakpoints (`sm`, `md`, `lg`) for typography, spacing, and layout.
- **Touch targets**: Primary actions use at least 44px height and `touch-manipulation` where appropriate.
- **DJ mobile**: Events list in a **drawer** (hamburger); main content full width.
- **Admin mobile**: **ResponsiveTable** shows tables on `md+` and stacked cards on small screens; tabs wrap.
- **Landing, login, register, events**: Responsive padding, buttons, and headings.
- **Accessibility**: `aria-label`, `aria-hidden` on decorative elements, focusable controls, and optional table `caption` / card labels in ResponsiveTable.

---

## Export Features

### QR code (PNG & PDF)

- **Component**: `components/export/QRDownload.tsx`.
- **Props**: `qrDataUrl` (blob or data URL), `filenameBase`, `pdfTitle`, `pdfSubtitle`.
- **Used in**: DJ dashboard (next to event QR) and event detail page (for event owner).
- **Behavior**: “Download PNG” triggers a data URL download; “Download PDF” uses jsPDF with title/subtitle and centered QR image. Blob URLs are converted to data URLs when needed.

### Reports (CSV & PDF)

- **Component**: `components/export/ReportExport.tsx`.
- **Props**: `title`, `summary` (array of `{ label, value }`), optional `tables` (title, headers, rows).
- **Used in**: Admin dashboard header and DJ dashboard header.
- **Behavior**: “Download CSV” builds a CSV from title, date, summary rows, and tables. “Download PDF” uses jsPDF and jspdf-autotable for title, summary, and tables. Data comes from existing React Query cache (analytics, users, events, requests for admin; events and requests for DJ).

---

## License

Private. See repository owner for terms.
