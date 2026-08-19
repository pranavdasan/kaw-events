# KAW Events — App Status & Roadmap Report

> Generated after the "Firebase backend + admin studio" milestone. Covers current state, what has been built, known issues, and the roadmap to a fully developed events web app.

---

## 1. What the App Is

KAW Events is a **single-page React web app** for the Kerala Association of Washington to publish event schedules with live session tracking. Users browse festivals (Onam, Vishu, Picnic, Drama Fest), view timeline schedules with auto-computed times and "LIVE NOW" states, bookmark sessions, and share them. Admins sign in with email/password and manage events, sessions, participants, drag-to-reorder, quick-add breaks, and live-state overrides.

**Stack:** React 19 · TypeScript · Vite 6 · Tailwind CSS v4 · motion (Framer Motion) · lucide-react · Firebase v12 Web SDK · firebase-admin (dev) · Vitest · `tsx`.

**Navigation** is a hand-rolled view-state machine in `App.tsx` (`events | schedule | bookmarks | session-details | admin-dashboard | admin-edit | admin-event-edit | admin-login`) — no React Router.

---

## 2. Current Features (shipped, working)

### Public user side

- **Events list** (`EventsListView.tsx`) — responsive cards, Upcoming/Past filtering, animated, image fallbacks.
- **Schedule timeline** (`EventScheduleView.tsx`) — sticky track filters (Song/Dance/Committee/Award/General), timeline with nodes, parallel/concurrent session columns, LIVE pulsing badge, bookmarks + share buttons, break rendering.
- **Adaptive timing** (`useAdaptiveSchedule.ts`) — session start/end times computed by stacking `order + durationInMin` from the event's start time; auto-LIVE detection from the device clock (30s tick), with admin manual-override support.
- **Session details** (`SessionDetailView.tsx`) — description, room/time grid, participant cards with avatars.
- **My Saved Agenda** (`BookmarksListView.tsx`) — bookmarks grouped by event with recomputed times, share/remove.
- **Share modal** (`ShareModal.tsx`) — native Web Share API, copy-link, WhatsApp/X/LinkedIn/Email share sheets.

### Admin side

- **Login** (`AdminLoginView.tsx`) — Firebase email/password with friendly error messages.
- **Dashboard** (`AdminDashboardView.tsx`) — stats cards, selected-event switcher (active + archived), auto/manual LIVE mode banner, session list with drag-to-reorder (motion `Reorder.Group`), live toggles, edit/delete, quick-add panel + Floating Action Button, **pending-changes system** (Revert / "Update Event" publish bar), delete confirm dialogs.
- **Session editor** (`AdminEditView.tsx`) — title/track/room/duration/description, participant search-and-add, create participant with base64 avatar upload.
- **Event editor** (`EventEditView.tsx`) — name/date/description/start+end time, cover image upload stored as base64 directly in the DB doc, create/delete event.

### Data & infra

- `src/firebase.ts` — auth + Firestore with IndexedDB offline persistence + emulator support.
- `src/services/firestore.ts` — complete CRUD layer (events, sessions, performers, bookmarks, subscriptions, batch publish, reorder).
- `firestore.rules`, `firestore.indexes.json`, `scripts/seed-firestore.ts`, `firebase.json` (Hosting + SPA rewrite), `MIGRATION_GUIDE.md`.
- Festival cover art as generated Base64 SVG (`imageUtils.ts`).
- **Tests:** Vitest — `utils` and `useAdaptiveSchedule` math (3 tests). **`npm run lint` (tsc) passes with zero errors.**

---

## 3. What Has Been Done (milestones)

Git history + working tree:

1. **Migrated off the Gemini/AI-Studio template** — rewrote README + `.env` from `GEMINI_API_KEY`/`APP_URL` to Firebase config env vars.
2. **Added the entire Firebase backend scaffold** — `src/firebase.ts` (auth+db+offline+emulators), `services/firestore.ts`, rules, indexes, seed script, `firebase.json`, `MIGRATION_GUIDE.md`, `service-account-key.json.example`.
3. **Rebuilt `App.tsx` into a multi-view app** — added admin login/dashboard/session/event editors, events list, bookmarks, share modal, confirm dialogs, layout with desktop drawer + mobile bottom-nav, adaptive schedule hook, pending-changes (revert/publish) workflow, image utilities.
4. **Fixed data model + bugs** — added `eventIds` to participants, `isPending` flag, session-ID generation bug fix in `AdminEditView`, removed `Buffer` fallback, fixed `main.tsx` import.
5. **Verified health** — `npm run test` and `npm run lint` pass.

---

## 4. Critical Issues to Fix Before "Fully Developed"

**P0 — Data isn't connected.**
The app runs entirely on React state + localStorage (`kaw-events`, `kaw-sessions`, `kaw-participants`, `bookmarkedSessions`). `services/firestore.ts` exists but is not wired into `App.tsx`. As-is, admin edits don't persist to the backend, don't sync across devices, and every user sees only local data.

**P1 — Security mismatch.**
`firestore.rules` grants admin writes only via custom claim `admin: true`, but the client checks `VITE_ADMIN_UIDS` at runtime instead. No Admin SDK script exists to set custom claims, so rules would block real admins after wiring. Admin access is currently enforced client-side only.

**P1 — Duplicate `firebase.ts` files.**
A root `firebase.ts` (used by `AdminLoginView`, mapped in tsconfig `paths: {firebase: "./firebase.ts"}`) duplicates `src/firebase.ts` (used by `App`). Functionally deduped by `getApp()`, but a code-health risk.

**P1 — Share deep-links are broken.**
`ShareModal` generates `?session=<id>` URLs, but nothing reads `window.location.search`, so shared links land on the Events list instead of the session.

**P2 — Identity/naming drift.**
`participants` (embedded objects inside sessions) vs `performers` (Firestore collection) vs `Participant` type used for both; `Track` declared as a union but cast with `as any` in forms.

**P2 — Dead/unused dependencies.**
`@google/genai`, `express`, `dotenv`, `@types/express` are declared but unused.

**P2 — Known behavioral gaps.**
Session reorder doesn't mark pending changes; cancelled new-session adds leave ghost sessions; adaptive-time algorithm is duplicated in `BookmarksListView`; large base64 avatars/images bloat every doc; no loading/error/empty states on data hooks; no error boundary.

---

## 5. Roadmap to a Fully Developed Events Web App

### Phase A — Make the existing app real (backend integration)

1. Wire Firestore into `App.tsx`: hydrate from DB, `onSnapshot` live sync, publish pending changes through the service layer, keep localStorage only as offline cache.
2. Add an Admin SDK script to set `admin: true` custom claims; align client check (`getIdTokenResult`) with rules; delete the duplicate root `firebase.ts`.
3. Merge `performers`/`participants` naming; make seed script idempotent; move uploads to Firebase Storage instead of base64-in-doc.
4. Fix share deep-links (query-parsing or add React Router), fix reorder→pending flow, dedupe adaptive-time into one util.

### Phase B — Public-facing feature set

5. Registration / RSVP for events; "Add to calendar" (.ics / Google Calendar); venue location pins; attendee profiles.
6. Per-user account bookmarks synced to Firestore (service exists — enable it); export saved agenda.
7. Push notifications (FCM) for "now live" and event reminders.

### Phase C — Admin & content workflow

8. Analytics dashboard (sessions count, bookmark stats), bulk import/edit, multi-day event support, publishing/review workflow with version history, admin role tiers.
9. Event search across events/sessions/performers.

### Phase D — Production hardening

10. PWA (manifest, offline, installable), dark mode, SEO/meta, accessibility (reduced-motion, ARIA), i18n.
11. CI pipeline (GitHub Actions: lint → test → build → `firebase deploy`), E2E tests, error monitoring/analytics, secrets via GitHub secrets.

---

## 6. Current Project Structure

```
kaw-events/
├── docs/                        # Documentation (this report)
├── scripts/seed-firestore.ts    # Firebase seed script (firebase-admin)
├── src/
│   ├── components/
│   │   ├── admin/               # AdminLogin, Dashboard, AdminEdit, EventEdit
│   │   ├── common/              # Layout, ShareModal, ConfirmDialog, KawLogo
│   │   ├── events/              # EventsListView, EventHeader
│   │   └── schedule/            # EventSchedule, SessionDetail, BookmarksList
│   ├── hooks/useAdaptiveSchedule.ts
│   ├── services/firestore.ts    # Firestore CRUD layer
│   ├── utils/                   # imageUtils (base64 SVG artwork, slugs)
│   ├── data.ts                  # Initial seed data (local fallback)
│   ├── firebase.ts              # Auth + Firestore init
│   ├── types.ts                 # Event / Session / Participant / Bookmark
│   └── App.tsx                  # View-state router + global state
├── firestore.rules              # Security rules (admin via custom claims)
├── firestore.indexes.json
├── firebase.json                # Hosting config (SPA rewrite)
├── MIGRATION_GUIDE.md           # Firebase setup + deploy steps
└── package.json
```
