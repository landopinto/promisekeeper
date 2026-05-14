# Kept — Claude Code Context

## What this project is

**Kept** is a mobile-first PWA for tracking personal promises — recurring daily habits and one-time pledges. The differentiator is celebration: every kept promise triggers a satisfying animation or badge unlock. No shame, no punishment for breaks.

See [APP_SPEC.md](APP_SPEC.md) for the full product spec.

## Stack

- **Next.js 14** (App Router) — framework
- **Tailwind CSS** — styling (mobile-first, no custom CSS unless unavoidable)
- **Framer Motion** — animations (celebration moments, card transitions)
- **localStorage** — data persistence for MVP (no backend yet)
- **Lucide React** — icons
- **next-pwa** — PWA/installability

## Conventions

- Mobile-first always: design for small screens, then scale up
- Components live in `src/components/`, pages in `src/app/`
- No CSS files — Tailwind only
- No backend code until Supabase is introduced in v2
- Keep animations in dedicated component files, not inline in pages

## What NOT to do

- Don't add user auth or API routes — that's v2
- Don't add shame/failure language anywhere in the UI copy
- Don't use `px` units — use Tailwind spacing
- Don't introduce a new animation library (Framer Motion is the choice)

## Key domain types

```ts
type PromiseType = "habit" | "pledge";

type UserPromise = {
  id: string;
  type: PromiseType;
  text: string;
  emoji?: string;
  createdAt: string;       // ISO date
  deadline?: string;       // ISO date, pledges only
  status: "active" | "archived";
};

type HabitEntry = {
  promiseId: string;
  date: string;            // YYYY-MM-DD
  kept: boolean;
};

type Badge = {
  id: string;
  name: string;
  description: string;
  earnedAt?: string;       // ISO date, undefined = locked
};
```
