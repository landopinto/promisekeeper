# Kept — App Specification

> **Tagline:** Make it. Keep it. Celebrate it.

---

## Goal

**Kept** is a mobile-first web app that lets you make promises to yourself — recurring habits or one-time pledges — and celebrates you every time you keep one.

---

## The Problem

Most habit and goal apps feel clinical or punishing. Streaks break and shame you. Goals expire quietly. People stop using them because failure feels worse than not starting.

**Kept** flips this: the focus is on what you *did* keep, not what you broke. Every kept promise is a small win worth celebrating.

---

## Target Audience

Anyone who wants to be more intentional about commitments to themselves — no specific niche. The UX should feel welcoming to non-technical users and work beautifully on a phone.

---

## Core Concepts

### Promise Types

| Type | Description | Example |
|------|-------------|---------|
| **Daily Habit** | Recurring — shown every day, tap to check off | "Drink 8 glasses of water" |
| **One-Time Pledge** | A single commitment with an optional deadline | "Finish my online course by June 30" |

### Promise Status

- **Pending** — not yet acted on today (or before deadline)
- **Kept** — user confirmed it done
- **Broken** — deadline passed or user marked it missed (no shame messaging)

---

## Features

### 1. Home / Dashboard
- **Today's habits** at the top — cards with tap-to-keep interaction
- **Upcoming pledges** grouped by deadline proximity
- **Streak summary bar** — quick glance at active streaks
- **Recent badges** — last 3 earned, with a "View all" link

### 2. Promise Creation
- Flow: choose type → write the promise → set optional deadline (pledges) or reminder time (habits) → confirm
- Emoji picker for personalization (optional)
- Short and simple — no overwhelming form fields

### 3. Daily Check-In
- Thumb-friendly card UI (large tap targets)
- Tap the card → satisfying animation + confetti burst
- Swipe to defer (not break) if needed
- Status pill updates instantly: Pending → Kept

### 4. Streaks
- Per-habit flame counter (🔥 7)
- Streak preserved if user uses a "grace day" (1 per 7 days)
- Broken streak: compassionate reset message — "You had a 12-day streak. That's real. Start again today."

### 5. Badges & Milestones
Badges unlock automatically when conditions are met:

| Badge | Condition |
|-------|-----------|
| First Step | Keep your first promise |
| On a Roll | 7-day habit streak |
| Committed | 30-day habit streak |
| Word is Bond | Keep 10 one-time pledges |
| Consistent | Keep promises 30 days in a month |
| Comeback Kid | Resume a habit after breaking a streak |

Badge gallery on the profile page — locked badges shown as silhouettes to create aspiration.

### 6. Celebration Moments
- **Standard keep**: confetti burst + card flip animation
- **Streak milestone**: full-screen celebration overlay with badge reveal
- **Pledge completed**: special "Kept!" screen with share option (optional v2)
- Animations should feel warm and personal, not gamey

### 7. Profile / Stats Page
- Total promises kept (all time)
- Current active streaks
- Badge gallery
- Longest streak ever

---

## UX Principles

1. **Mobile first** — designed for one-handed use, large tap targets, bottom-sheet modals
2. **Celebration over shame** — no red warnings, no "you failed" language
3. **Fast daily use** — checking in should take under 30 seconds
4. **Low friction to start** — no account required for MVP (localStorage), optional sign-in to sync

---

## Screens

```
Home (Dashboard)
├── Today's Habits [card list]
├── Upcoming Pledges [card list]
└── Recent Badges [row]

Promise Creation (bottom sheet / modal)
├── Choose type: Habit | Pledge
├── Write your promise
├── Set deadline / reminder
└── Confirm

Promise Detail
├── Status + streak
├── History calendar
└── Edit / Archive / Delete

Profile / Stats
├── Totals
├── Active streaks
└── Badge gallery

Badge Detail (modal)
└── Name, description, date earned
```

---

## Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | Next.js 14 (App Router) | PWA support, file-based routing |
| Styling | Tailwind CSS | Utility-first, mobile-first breakpoints |
| Animations | Framer Motion | Celebration moments, card transitions |
| Data (MVP) | localStorage | No backend required for v1 |
| Data (v2) | Supabase | Auth + Postgres for cross-device sync |
| Icons | Lucide React | Lightweight, consistent |
| PWA | next-pwa | Installable on iOS/Android home screen |
| Deployment | Netlify | `@netlify/plugin-nextjs`, free tier sufficient |

---

## MVP Scope (v1)

The first shippable version should include:

- [x] Daily habits — create, check off, streak tracking
- [x] One-time pledges — create, mark kept/broken
- [x] Confetti celebration on keep
- [x] 3–4 core badges
- [x] Dashboard with today's view
- [x] localStorage persistence (no login required)
- [x] Installable as PWA

**Out of scope for v1:**
- User accounts / cloud sync
- Push notifications
- Social / sharing features
- Full badge gallery (just 3–4)

---

## Design Direction

- **Palette**: Warm, optimistic — soft creams, warm yellows, a confident accent (deep teal or coral)
- **Typography**: Rounded, friendly — something like DM Sans or Plus Jakarta Sans
- **Feel**: Like a high-five from a friend, not a productivity app dashboard
- **Dark mode**: v2

---

## Open Questions (pre-build)

- [ ] Does "Kept" resonate as the name, or do we want to explore alternatives?
- [ ] Should habits have a specific time reminder from day one, or is that v2?
- [ ] Grace days: 1 per 7 days — does that feel right, or should streaks be strict?
