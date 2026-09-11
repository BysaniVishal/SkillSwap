# SkillSwap

A peer-to-peer skill exchange platform for college students, built on the MERN stack. Instead of paying for tutoring, students trade skills directly: *"I'll teach you C++ if you teach me UI/UX."*

The centerpiece is a deterministic, fully explainable compatibility engine — every match comes with a transparent breakdown of exactly why the score is what it is. No AI, no black box.

---

## Table of contents

- [Problem](#problem)
- [Solution](#solution)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Database schema](#database-schema)
- [The matching algorithm](#the-matching-algorithm)
- [Setup instructions](#setup-instructions)
- [Screenshots](#screenshots)
- [Future improvements](#future-improvements)
- [90-second interview explanation](#90-second-interview-explanation)
- [Top 20 interview questions](#top-20-interview-questions)

---

## Problem

College students often want to learn a skill a *peer* already has — a senior who's great at UI/UX, a classmate who's fluent in Python — but there's no structured way to find each other or agree on a fair trade. Tutoring marketplaces assume one side pays; they don't model a mutual exchange between two students who each have something the other wants.

## Solution

SkillSwap lets students list what they can teach and what they want to learn. A matching engine ranks other students by compatibility — weighing mutual skill exchange, skill relevance, proficiency fit, availability overlap, learning-style compatibility, and reputation — and explains every point of the score. Students send swap requests, and once accepted, manage the relationship through scheduled sessions to a completed, reviewed exchange.

## Features

- **Authentication** — JWT-based register/login, bcrypt password hashing, protected routes
- **Profiles** — skills to teach/learn (with category + proficiency), learning goals, weekly availability, online/offline preference
- **Explainable matching engine** — deterministic 0–100 compatibility score with a plain-English reason for every point
- **Discover page** — ranked candidates with filters (skill, category, minimum match %, online/offline) and sorting (best match / highest rated)
- **Swap requests** — send, accept, reject, cancel; duplicate and self-request prevention; blocks new requests while an active swap already exists between two users
- **Active swaps** — created automatically when a request is accepted; mark completed or cancelled
- **Sessions** — schedule/track individual learning sessions within a swap (date, time, duration, notes, status)
- **Reviews & reputation** — 1–5 star review after a completed swap, one review per user per swap, average rating feeds back into the matching engine
- **Dashboard** — skills summary, top matches, pending requests, active swaps, upcoming sessions, reputation stats, all in one view

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router 7, Tailwind CSS 4 |
| Backend | Node.js, Express 5 |
| Database | MongoDB Atlas, Mongoose 9 |
| Auth | JWT (jsonwebtoken), bcryptjs |
| HTTP client | Axios |

No ORM abstractions beyond Mongoose, no state management library beyond React Context, no UI component library — deliberately minimal so every piece is something I can explain.

## Architecture

```
┌────────────────────┐    fetch/axios (JSON)    ┌───────────────────────┐
│    React (Vite)     │ ────────────────────────▶│    Express REST API   │
│  React Router        │                          │   auth middleware      │
│  Context (auth)       │◀──────────────────────── │   controllers           │
└────────────────────┘                           └───────────┬───────────┘
                                                                │
                                          ┌─────────────────────┴────────────────────┐
                                          ▼                                            ▼
                              ┌───────────────────────┐                 ┌────────────────────────┐
                              │   utils/matching.js     │                 │    Mongoose models        │
                              │   pure function —          │                 │    → MongoDB Atlas          │
                              │   no DB dependency           │                 │                              │
                              └───────────────────────┘                 └────────────────────────┘
```

- The client never talks to MongoDB directly — only through the REST API.
- `matching.js` is intentionally isolated from Express and Mongoose: it takes two plain JS objects and returns a plain result. That's what let me unit-test it with zero mocking (`server/utils/matching.test.js`).
- JWT is stored in `localStorage` on the client; an axios request interceptor attaches it to every call. The server's `protect` middleware verifies it and attaches `req.user`.

## Database schema

Five collections, each with a single clear responsibility:

| Model | Purpose | Key fields |
|---|---|---|
| **User** | Profile + auth | `skillsToTeach[]`, `skillsToLearn[]` (embedded, each with category/proficiency), `availability[]`, `learningPreference`, `rating: {average, count}`, `completedSwaps` |
| **SwapRequest** | A proposal, not yet a commitment | `sender`, `receiver`, `senderTeaches`, `senderLearns`, `status: pending\|accepted\|rejected\|cancelled` |
| **Swap** | A confirmed, ongoing exchange | `userA`, `userB`, `skills: {userATeaches, userBTeaches}`, `status: active\|completed\|cancelled` |
| **Session** | One scheduled learning meeting inside a swap | `swap`, `skill`, `date`, `time`, `duration`, `status: upcoming\|completed\|cancelled` |
| **Review** | Post-completion feedback | `swap`, `reviewer`, `reviewedUser`, `rating` (1–5), `comment` — unique index on `(swap, reviewer)` |

`SwapRequest` and `Swap` are deliberately separate collections: a request can be rejected and forgotten, but a swap is a real commitment with its own future (sessions and reviews attach to `Swap`, never to the original request).

## The matching algorithm

`server/utils/matching.js` exports `calculateMatch(userA, userB)` — a pure function with **no database dependency**, so it's trivially unit-testable (see `matching.test.js`, run with `npm test` in `server/`).

**Inputs:** two plain user objects — `skillsToTeach`, `skillsToLearn`, `availability`, `learningPreference`, `rating`.

**What it compares, and why each weight exists:**

| Component | Points | What it checks | Why this weight |
|---|---|---|---|
| Mutual skill exchange | 40 (20+20) | Does A teach something B wants, **and** does B teach something A wants? | The core product thesis — a *swap*, not a one-way favor, is worth the most |
| Skill relevance / breadth | 20 | How many distinct skill pairs overlap (saturates at 4) | More overlap = more to work with, but capped so it can't dominate mutual exchange |
| Proficiency compatibility | 15 | Is the teacher's level ≥ what the learner needs? | A "match" where the teacher can't actually help isn't a good match |
| Availability overlap | 10 | Any overlapping day + time window | Real-world logistics — a great match that can never meet is low-value |
| Learning preference | 5 | online/offline/both compatibility | Minor filter, not a dealbreaker |
| Reputation | 10 | The other user's average rating (new users get a neutral 2.5/5 default) | Rewards reliability without punishing new signups |

**Output:** `{ score, matchedSkills, reasons }` — `reasons` is an ordered list of `{ label, points }`, which is what powers the "Why this match?" UI. The score is never shown without its breakdown.

**Time complexity:** comparing one pair of users is O(T×L) where T and L are each user's skill-array lengths (typically < 10) — effectively constant time. Ranking one user against `n` candidates on the Discover page is O(n) pair-comparisons, each O(1) — so **O(n) overall**, with no indexing or precomputation needed at this scale. If this had to scale to millions of users, the natural next step would be precomputing/caching scores or pre-filtering the candidate pool with a database query before running `calculateMatch` — intentionally out of scope here.

## Setup instructions

### Prerequisites
- Node.js 18+
- A MongoDB connection string (MongoDB Atlas free tier works well)

### Backend
```bash
cd server
npm install
# create .env with:
#   PORT=5000
#   MONGO_URI=<your MongoDB connection string>
#   JWT_SECRET=<any long random string>
#   JWT_EXPIRES_IN=7d
npm run seed   # populates 10 demo students, password123 for all
npm run dev    # starts on :5000
```

### Frontend
```bash
cd client
npm install
npm run dev    # starts on :5173, proxies /api to :5000
```

### Running the matching engine's tests
```bash
cd server
npm test
```

## Screenshots

*Add screenshots of the Landing, Discover, and Dashboard pages here once you've run the app locally — `npm run dev` in both `server/` and `client/`, then log in with any seeded account (e.g. `rahul@skillswap.demo` / `password123`).*

## Future improvements

Explicitly out of scope for this version, but natural next steps:
- Precomputed/cached match scores for larger user bases
- Real-time notifications for new requests/messages (WebSockets)
- In-app messaging between matched users
- Saved matches / bookmarking, skill circles, trending skills (all sketched in the original spec, cut to keep scope focused)


