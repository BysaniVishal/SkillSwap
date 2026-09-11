# SkillSwap

A peer-to-peer skill exchange platform for college students, built on the MERN stack. Instead of paying for tutoring, students trade skills directly: *"I'll teach you C++ if you teach me UI/UX."*

The centerpiece is a deterministic, fully explainable compatibility engine — every match comes with a transparent breakdown of exactly why the score is what it is. No AI, no black box for matching — though the platform does use an AI assistant elsewhere, as a genuinely separate, clearly-scoped feature (see below).

---

## Table of contents

- [Problem](#problem)
- [Solution](#solution)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Database schema](#database-schema)
- [The matching algorithm](#the-matching-algorithm)
- [Real-time layer & caching](#real-time-layer--caching)
- [Setup instructions](#setup-instructions)
- [Deployment](#deployment)
- [Screenshots](#screenshots)
- [Future improvements](#future-improvements)

---

## Problem

College students often want to learn a skill a *peer* already has — a senior who's great at UI/UX, a classmate who's fluent in Python — but there's no structured way to find each other or agree on a fair trade. Tutoring marketplaces assume one side pays; they don't model a mutual exchange between two students who each have something the other wants.

## Solution

SkillSwap lets students list what they can teach and what they want to learn. A matching engine ranks other students by compatibility — weighing mutual skill exchange, skill relevance, proficiency fit, availability overlap, learning-style compatibility, and reputation — and explains every point of the score. Students send swap requests, and once accepted, manage the relationship through scheduled real-time video sessions to a completed, reviewed exchange.

## Features

### Core
- **Authentication** — JWT-based register/login, bcrypt password hashing, protected routes.
- **Profiles** — skills to teach/learn (with category + proficiency), learning goals, weekly availability, online/offline preference.
- **Explainable matching engine** — deterministic 0–100 compatibility score with a plain-English reason for every point (see [below](#the-matching-algorithm)).
- **Discover page** — ranked candidates with filters (skill, category, minimum match %, online/offline) and sorting (best match / highest rated).

### Skill verification — two paths, deliberately not treated as equal
- **Skill quiz** — teaching a skill isn't self-declared. To list a skill as "taught," a user passes a short quiz: each of 30 skills has a pool of 20 hand-written questions, 8 sampled per attempt, graded by a stable per-question index so the pool can grow without invalidating past attempts. One attempt per skill per week (cooldown), with a resource link surfaced on failure.
- **Certificate upload** — an alternative path: upload a certificate (JPEG/PNG/PDF, capped at ~2MB, stored as base64 in MongoDB) to add a taught skill without the quiz. This intentionally reopens a small trust gap the quiz was built to close, so certificate-verified skills are **visibly labeled differently** from quiz-verified ones (a distinct badge everywhere skills are shown) rather than silently trusted the same — honest about what's actually been checked (nothing, automatically) versus what has (the quiz).

### Swap lifecycle
- **Swap requests** — send, accept, reject, cancel; duplicate and self-request prevention; blocks new requests while an active swap already exists between two users.
- **Active swaps** — created automatically when a request is accepted; mark completed or cancelled.
- **Sessions** — schedule/track individual learning sessions within a swap (date, time, duration, notes, status), with a lazy sweep that marks a session "missed" if its scheduled window closes with nobody ever joining.
- **Reviews & reputation** — 1–5 star review after a completed swap, one review per user per swap, average rating feeds back into the matching engine.

### Real-time sessions
- **WebRTC video calls** — 1-to-1 video calling for each scheduled session, peer-to-peer (no media server), with mic/camera/screen-share controls and a Google Meet–inspired layout: a dark video stage with the other participant's tile filling it and a small picture-in-picture self-view in the corner.
- **Synced whiteboard** — a shared canvas, drawn strokes broadcast in real time over Socket.IO to the other participant.
- **In-call chat** — ephemeral text chat scoped to the current call, alongside the whiteboard in a tabbed side panel (both stay mounted so switching tabs never loses whiteboard content or chat scrollback).
- **Persistent swap chat** — a separate, MongoDB-backed chat scoped to an entire swap (not just one call) — messages survive between sessions, distinct from the ephemeral in-call chat above.

### AI assistant
- A Gemini-powered chatbot (function-calling agent loop, not just a scripted FAQ) that can answer questions about how SkillSwap works, and — when a user expresses clear learning intent ("I want to learn Python") — automatically find their best match and send a swap request on their behalf, explaining why that person was a good match.

### Resource Hub
- A curated learning-resources page, organized by the same category → topic → skill taxonomy used everywhere else in the app: generated search links (tutorials, docs, practice exercises) per skill, plus a short original guidance blurb per category.

### Dashboard & shared UI system
- **Dashboard** — skills summary, top matches, pending requests, active swaps, upcoming sessions, reputation stats, all in one view.
- A small shared UI primitive system (`Card`, `Button`, `Alert`, `StatusPill`, `Modal`, `Toast`) used consistently across every page instead of one-off styling, plus a WebGL landing-page hero built with React Three Fiber.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, React Router 7, Tailwind CSS 4, React Three Fiber + Three.js (landing hero) |
| Backend | Node.js, Express 5 |
| Database | MongoDB Atlas, Mongoose 9 |
| Real-time | Socket.IO (signaling, chat, whiteboard) |
| Caching | Redis (via `ioredis`, Upstash-hosted) |
| AI assistant | Google Gemini API (`@google/genai`) |
| Auth | JWT (jsonwebtoken), bcryptjs |
| HTTP client | Axios |

No ORM abstractions beyond Mongoose, no state management library beyond React Context, no UI component library beyond a small hand-built primitive set — deliberately minimal so every piece is something I can explain.

## Architecture

```
┌────────────────────┐   REST (axios, JSON)     ┌───────────────────────┐
│    React (Vite)     │ ────────────────────────▶│    Express REST API    │
│  React Router         │                          │   auth middleware       │
│  Context (auth)         │◀──────────────────────── │   controllers             │
└──────────┬──────────┘                           └───────────┬───────────┘
           │                                                   │
           │  Socket.IO (signaling,            ┌────────────────┴────────────────┐
           │  swap chat, in-call chat,          ▼                                  ▼
           │  whiteboard)              ┌───────────────────┐             ┌────────────────────┐
           └──────────────────────────▶│   Socket.IO server  │             │   Mongoose models    │
                                        │   JWT-authenticated   │             │   → MongoDB Atlas      │
                                        │   at handshake           │             └────────────────────┘
                                        └───────────────────┘
                                                    │
                        ┌───────────────────────────┴───────────────────────────┐
                        ▼                                                         ▼
            ┌───────────────────────┐                                ┌───────────────────────┐
            │   utils/matching.js      │                                │   Redis (Upstash)         │
            │   pure function —           │                                │   caches per-user match     │
            │   no DB dependency             │                                │   lists, graceful fallback     │
            └───────────────────────┘                                │   to live compute if down       │
                                                                        └───────────────────────┘

            Separately: server/controllers/assistantController.js ──▶ Google Gemini API
            (function-calling agent loop; only this one controller talks to Gemini)
```

- The client never talks to MongoDB, Redis, or Gemini directly — only through the REST API or Socket.IO.
- `matching.js` is intentionally isolated from Express and Mongoose: it takes two plain JS objects and returns a plain result. That's what let me unit-test it with zero mocking (`server/utils/matching.test.js`).
- JWT is stored in `localStorage` on the client; an axios request interceptor attaches it to every REST call, and the same token is sent on the Socket.IO handshake for real-time auth. The server's `protect` middleware (REST) and `io.use` handshake check (sockets) both verify it independently.

## Database schema

Eight collections, each with a single clear responsibility:

| Model | Purpose | Key fields |
|---|---|---|
| **User** | Profile + auth | `skillsToTeach[]` (embedded, each with category/proficiency/`verificationMethod`), `skillsToLearn[]`, `availability[]`, `learningPreference`, `rating: {average, count}`, `completedSwaps` |
| **SwapRequest** | A proposal, not yet a commitment | `sender`, `receiver`, `senderTeaches`, `senderLearns`, `status: pending\|accepted\|rejected\|cancelled` |
| **Swap** | A confirmed, ongoing exchange | `userA`, `userB`, `skills: {userATeaches, userBTeaches}`, `status: active\|completed\|cancelled` |
| **Session** | One scheduled learning meeting inside a swap | `swap`, `skill`, `date`, `time`, `duration`, `status: upcoming\|completed\|cancelled\|missed` |
| **Review** | Post-completion feedback | `swap`, `reviewer`, `reviewedUser`, `rating` (1–5), `comment` — unique index on `(swap, reviewer)` |
| **QuizAttempt** | Cooldown tracking for the skill quiz | `user`, `skill`, `attemptedAt` — unique index on `(user, skill)`, refreshed on every attempt regardless of pass/fail |
| **Certificate** | A record of an uploaded certificate | `user`, `skill`, `category`, `proficiency`, `fileData` (base64), `mimeType`, `uploadedAt` |
| **Message** | Persistent swap chat history | `swap`, `sender`, `text`, `createdAt` — scoped to a swap, not a single session |

`SwapRequest` and `Swap` are deliberately separate collections: a request can be rejected and forgotten, but a swap is a real commitment with its own future (sessions and reviews attach to `Swap`, never to the original request). `QuizAttempt` and `Certificate` are similarly kept as their own collections rather than fields crammed into `User`, matching the same "separate lifecycle, separate collection" reasoning.

## The matching algorithm

`server/utils/matching.js` exports `calculateMatch(userA, userB)` — a pure function with **no database dependency**, so it's trivially unit-testable (see `matching.test.js`, run with `npm test` in `server/`).

**Inputs:** two plain user objects — `skillsToTeach`, `skillsToLearn`, `availability`, `learningPreference`, `rating`.

**What it compares, and why each weight exists:**

| Component | Points | What it checks | Why this weight |
|---|---|---|---|
| Mutual skill exchange | 40 (20+20) | Does A teach something B wants, **and** does B teach something A wants? | The core product thesis — a *swap*, not a one-way favor, is worth the most |
| Skill relevance / breadth | 20 | How many distinct skill pairs overlap (saturates at 4) | More overlap = more to work with, but capped so it can't dominate mutual exchange |
| Proficiency compatibility | 15 | Graded, not binary — does the teacher's level *meet* what the learner needs, and by how much do they exceed it? | A teacher who barely clears the bar still counts, but a teacher well above it earns proportionally more credit for being able to teach it more effectively |
| Availability overlap | 10 | Any overlapping day + time window | Real-world logistics — a great match that can never meet is low-value |
| Learning preference | 5 | online/offline/both compatibility | Minor filter, not a dealbreaker |
| Reputation | 10 | The other user's average rating (new users get a neutral 2.5/5 default) | Rewards reliability without punishing new signups |

**Output:** `{ score, matchedSkills, reasons }` — `reasons` is an ordered list of `{ label, points }`, which is what powers the "Why this match?" UI. The score is never shown without its breakdown.

**Time complexity:** comparing one pair of users is O(T×L) where T and L are each user's skill-array lengths (typically < 10) — effectively constant time. Ranking one user against `n` candidates is O(n) pair-comparisons — see [Real-time layer & caching](#real-time-layer--caching) for how the O(n) recompute is kept off the hot path via caching, rather than changing the algorithm's complexity itself.

## Real-time layer & caching

**Socket.IO** — one connection per client, authenticated once at handshake with the same JWT the REST API uses, then multiplexed across three concerns via rooms:
- **Session rooms** (`join-room` keyed by session ID) — WebRTC signaling (`offer`/`answer`/`ice-candidate`), in-call chat, and whiteboard events all flow through the same room. A rejoin (second tab, stale refresh) replaces the user's own stale slot rather than occupying a second seat and locking out their swap partner. When both participants have left, the session auto-marks itself completed without either side needing to click "End Session."
- **Swap chat rooms** (`swap:<id>`) — independent from session rooms, so a socket can be in a live call room and its swap's persistent chat room at once.
- Every teardown path (explicit leave, browser close/disconnect, the other side ending the call) funnels through the same cleanup, so there's no separate "did they actually leave" logic to keep in sync.

**Redis caching** — `getAllMatchesForUser` (the expensive part: score every other user in the database) is cached per user for 120 seconds under `matches:<userId>`, with cheap filtering/sorting (skill, category, min score, preference) happening outside the cache on every request. The cache is invalidated whenever something that feeds the score changes — profile update, teach-skill removed, quiz passed, certificate uploaded. If Redis is unreachable, every read/write degrades gracefully to computing live rather than failing the request — the cache is a pure performance optimization, never a hard dependency.

## Setup instructions

### Prerequisites
- Node.js 18+
- A MongoDB connection string (MongoDB Atlas free tier works well)
- Optional but recommended for full functionality: a Redis URL (Upstash free tier works well) and a Google Gemini API key

### Backend
```bash
cd server
npm install
# create .env — see server/.env.example for the full list:
#   PORT, MONGO_URI, JWT_SECRET, JWT_EXPIRES_IN,
#   GEMINI_API_KEY, GEMINI_MODEL, REDIS_URL, CLIENT_URL
npm run seed   # populates demo students, password123 for all
npm run dev    # starts on :5000
```
Redis and the Gemini API key are optional at the code level — the app runs without them, just without response caching or the AI assistant, respectively.

### Frontend
```bash
cd client
npm install
# optional for local dev — see client/.env.example
#   (defaults to same-origin / Vite's dev proxy if unset)
npm run dev    # starts on :5173, proxies /api and /socket.io to :5000
```

### Running the matching engine's tests
```bash
cd server
npm test
```

## Deployment

Client on Vercel, server on Render (two separate domains — the client needs the backend's real URL since there's no dev-server proxy in a static production build):

1. **Render (server)** — root directory `server`, build `npm install`, start `npm start` (already reads `process.env.PORT`). Set the env vars from `server/.env.example`, including `CLIENT_URL` once you know the Vercel domain (restricts CORS to it; falls back to `*` if unset).
2. **Vercel (client)** — root directory `client`, Vite preset. Set `VITE_API_URL` and `VITE_SOCKET_URL` from `client/.env.example` to the Render backend's URL.

One known, accepted limitation worth being upfront about: the WebRTC layer only configures a STUN server (no TURN), so calls between two users on networks that can't establish a direct peer connection (symmetric NAT, some corporate/mobile networks) may fail to connect video — the in-app connection-state message already tells the user this plainly when it happens, rather than failing silently.

## Screenshots

*Add screenshots of the Landing, Discover, Dashboard, and Session Room pages here once you've run the app locally — `npm run dev` in both `server/` and `client/`, then log in with any seeded account.*

## Future improvements

Explicitly out of scope for this version, but natural next steps:
- Pre-filtering match candidates at the database level (e.g. an index on `skillsToTeach.skill`) before scoring, for very large user bases — the current O(n) scan-and-score is cached but still fundamentally O(n) per cache miss
- A TURN server for more reliable WebRTC connectivity across restrictive networks
- Moving Socket.IO's in-memory session-room state to shared storage (e.g. Redis, same pattern already used for match caching) if the server is ever horizontally scaled to multiple instances
- Real end-to-end browser tests (this build relied on API-level curl testing plus manual verification throughout) and real screenshots in place of the placeholder above
- Supporting more than 2 participants per session (the WebRTC layer is currently a single 1-to-1 peer connection, matching the product's one-swap-is-two-people model)
