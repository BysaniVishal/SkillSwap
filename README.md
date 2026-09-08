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

## 90-second interview explanation

> "SkillSwap is a MERN-based peer-to-peer skill exchange platform for college students. Instead of paying for tutoring, users list skills they can teach and skills they want to learn, and the platform matches them with other students for a fair trade.
>
> The core feature is a deterministic compatibility engine — not AI, just a weighted scoring function — that compares two users across six factors: mutual skill exchange, skill relevance, proficiency compatibility, availability overlap, learning preference, and reputation. Every score comes with a visible breakdown, so a user never sees a mystery percentage — they see exactly why they matched 89% with someone.
>
> Once matched, users send swap requests; if accepted, it becomes an active swap where they can schedule sessions and, once complete, leave reviews that feed back into each other's reputation — which itself is one of the six factors the matching engine considers. So the whole system is a closed loop: better swaps build reputation, and reputation improves future matches.
>
> I built the whole stack myself — Express REST API, MongoDB with Mongoose, JWT auth, and a React frontend — and I isolated the matching logic as a pure, dependency-free function specifically so I could unit test it and reason about it cleanly, independent of the database or HTTP layer."

## Top 20 interview questions

**1. Why did you build a rules-based matching algorithm instead of using machine learning?**
*Short:* Because the scoring criteria are simple, interpretable business rules, not something that needs to be learned from data.
*Deep:* ML makes sense when you have enough historical outcome data to learn patterns humans can't easily specify, and when some black-box loss in interpretability is an acceptable tradeoff for better predictions. Here, "mutual skill exchange matters most" is a rule I already know is true — there's no hidden pattern to discover, and I have zero training data (a fresh product has no swap-outcome history to learn from). A rules engine is also fully explainable, which is a hard product requirement here — users need to see exactly why they matched, and an ML model's confidence score doesn't give you that for free.

**2. Walk me through what happens when I call `calculateMatch(userA, userB)`.**
*Short:* It finds skill overlaps in both directions, then scores six independent components and sums them.
*Deep:* First it finds skills userA teaches that userB wants to learn, and vice versa, using case-insensitive string matching. Each direction found awards 20 of the 40 mutual-exchange points. Then it counts total matched pairs for the relevance score (capped/saturated at 4 pairs), checks each matched pair's teacher-proficiency-vs-learner-proficiency for the proficiency score, scans both users' availability arrays for any overlapping day+time window, checks preference compatibility, and adds a reputation score based on the other user's rating. Every awarded point pushes a `{label, points}` object onto a `reasons` array, which is returned alongside the final score.

**3. Why is `matching.js` a plain function with no database calls?**
*Short:* So it's a pure function I can unit test with plain objects, with zero mocking required.
*Deep:* If `calculateMatch` queried MongoDB internally, testing it would require either a real test database or mocking Mongoose — both add friction and slow down tests. By keeping it pure (same inputs always produce the same output, no side effects), I can write scenario tests as plain JS objects (see `matching.test.js`) that run in milliseconds with `node utils/matching.test.js`. The controller (`matchController.js`) is responsible for fetching data from MongoDB and handing plain objects to the pure function — a clean separation of "get the data" from "do the math."

**4. How would this scale if SkillSwap had a million users?**
*Short:* Computing matches against every user on every Discover page load wouldn't scale; you'd need pre-filtering or caching.
*Deep:* Right now, `getMatches` does `User.find({_id: {$ne: me}})` and runs `calculateMatch` against every other user — O(n) per request. At a million users, that's a million in-memory comparisons per page load. The fix isn't a smarter algorithm — the algorithm is already O(1) per pair — it's reducing `n` before scoring: a database query that pre-filters to users who teach a skill you want to learn (or vice versa) using an index on `skillsToTeach.skill`, then only scoring that much smaller candidate set. You could also precompute and cache top-N matches per user on a schedule rather than live on every request.

**5. Why did you choose JWT over session-based auth?**
*Short:* Stateless — no server-side session store needed, which keeps the backend simple for this project's scale.
*Deep:* JWT lets the server verify a request's identity just by checking a signature, without a database or session-store lookup. That's a real tradeoff, though: since the token is self-contained, there's no way to invalidate a specific token early (revoke it) without extra machinery like a token blocklist — "logout" here just means deleting the token client-side, but a stolen token would remain valid until it expires. For a portfolio project's scale, that tradeoff is fine; a production system handling sensitive data might use short-lived access tokens plus a refresh-token rotation scheme.

**6. How are passwords protected?**
*Short:* bcrypt hashing with a salt, and the field is excluded from queries by default.
*Deep:* On register, I hash the password with `bcrypt.genSalt(10)` + `bcrypt.hash` before saving — the plaintext password is never stored. The `User` schema marks `password` as `select: false`, so any normal `User.find()`/`findById()` never returns it, even accidentally; login explicitly opts in with `.select('+password')` only where needed. That combination means even a compromised database dump doesn't hand over usable passwords (bcrypt hashes are computationally expensive to brute-force), and a bug elsewhere in the codebase can't accidentally leak the hash to an API response.

**7. What's the difference between authentication and authorization in this app, with a concrete example?**
*Short:* Authentication ("who are you") is the `protect` middleware; authorization ("are you allowed to do *this*") is checked inside each controller.
*Deep:* `protect` verifies the JWT and attaches `req.user` — that answers "is this a real, logged-in user." But being logged in doesn't mean you can do anything: in `updateRequestStatus`, I separately check `request.receiver.toString() === req.user._id.toString()` before allowing an "accept" — a logged-in user who isn't the receiver gets a 403, not a 401. Same pattern in swap completion (must be a participant) and reviews (must be a participant, and only after the swap is completed).

**8. How do you prevent duplicate swap requests or one user spamming another?**
*Short:* A pre-insert check queries for any existing pending request in either direction between the two users.
*Deep:* Before creating a `SwapRequest`, I query `SwapRequest.findOne({status: 'pending', $or: [{sender:A,receiver:B},{sender:B,receiver:A}]})`. It's symmetric — checking both directions — because a pending request between two people should block a *new* request regardless of who initiates it. Similarly, I check for an existing active `Swap` between the two before allowing a new request at all, so you can't send someone five different swap proposals while you already have one running with them.

**9. Why is `Swap` a separate MongoDB collection from `SwapRequest` instead of just updating the request's status?**
*Short:* They represent different things with different lifecycles and different children documents.
*Deep:* A `SwapRequest` is a proposal — it can be rejected, cancelled, or accepted, and once handled it's essentially historical. A `Swap` is an ongoing commitment that owns its own children: `Session` documents and `Review` documents both reference `swap`, not the original request. If I'd modeled this as one mutating document, I'd need messier logic to handle "this swap request has now become an active relationship with its own set of sessions" — splitting them keeps each model's responsibility singular and their relationships (`Session.swap`, `Review.swap`) clean foreign keys.

**10. How does completing a swap affect reputation?**
*Short:* It doesn't directly — reviews do. Completing a swap only unlocks the ability to review.
*Deep:* `updateSwapStatus` marking a swap "completed" does two things: sets `completedAt` and increments both users' `completedSwaps` counter via `User.updateMany(..., {$inc: {completedSwaps: 1}})`. But `rating.average`/`rating.count` are untouched until an actual `Review` is submitted — `createReview` calls `recomputeRating(reviewedUser)`, which refetches *all* reviews for that user and averages them from scratch. So "reputation" is really two independently-tracked numbers: a swap-completion counter (activity) and a review-derived rating (quality) — both surfaced on the profile and dashboard.

**11. Why recompute the average rating from scratch on every new review instead of maintaining a running average?**
*Short:* Simplicity and correctness-by-construction, and it's cheap at this data volume.
*Deep:* A running average (`newAvg = (oldAvg*oldCount + newRating)/(oldCount+1)`) is a classic place to introduce subtle bugs — miscounting, floating-point drift, or forgetting to update it on review deletion. Refetching and averaging all of a user's reviews every time is O(n) in their review count, but n is small (dozens, not millions) for this product, so the cost is negligible and the correctness is trivial to verify by inspection. This is a real engineering tradeoff — simplicity over micro-optimization — that I'd revisit if review volume ever became large.

**12. How do you stop someone from reviewing a swap twice, or reviewing a swap they weren't part of?**
*Short:* An application-level check for a friendly error, backed by a MongoDB unique index as the actual guarantee.
*Deep:* `createReview` checks the requester is `userA` or `userB` on the swap (403 if not), checks the swap's `status === 'completed'` (400 if not), and does `Review.findOne({swap, reviewer})` before inserting, returning 409 if one exists. But the *real* guarantee against a duplicate — including under concurrent requests — is the compound unique index `{swap: 1, reviewer: 1}` on the Review schema; if two requests raced past the findOne check, MongoDB itself would reject the second insert with a duplicate-key error, which the global error handler catches and turns into a 409.

**13. Explain the mass-assignment vulnerability you specifically guarded against, and how.**
*Short:* `updateProfile` only copies fields from a hardcoded whitelist out of the request body — never the whole body.
*Deep:* If I'd written `User.findByIdAndUpdate(req.user._id, req.body)`, a malicious request could include `{"rating": {"average": 5, "count": 99}}` or `{"email": "someone-elses-address"}` alongside legitimate profile fields, silently overwriting fields the user should never control directly. Instead, `ALLOWED_FIELDS` is an explicit array (`name`, `bio`, `college`, `profilePicture`, `skillsToTeach`, `skillsToLearn`, `availability`, `learningPreference`), and the controller only copies keys present in that list from `req.body` into the update object — anything else is silently dropped, not applied.

**14. How does your error handling middleware work, and why does it matter?**
*Short:* A centralized Express error handler inspects the error type and maps it to the right HTTP status code.
*Deep:* Rather than each controller catching and formatting its own errors, uncaught errors (including rejected promises in async route handlers, which Express 5 forwards automatically) fall through to one `app.use((err, req, res, next) => {...})` at the bottom of `server.js`. It checks `err.name` for Mongoose's `ValidationError` (→ 400 with the validation message), `CastError` (→ 400, e.g. a malformed ObjectId in a URL param), and `err.code === 11000` (MongoDB duplicate key → 409), falling back to 500 for anything unrecognized. This means every route gets consistent, correct status codes without repeating try/catch boilerplate everywhere.

**15. Why did you embed `skillsToTeach`/`skillsToLearn` as arrays inside `User` instead of a separate `Skill` collection?**
*Short:* They're always read and written together with the profile, and never queried independently — embedding avoids a join for the most common access pattern.
*Deep:* MongoDB's embed-vs-reference decision usually comes down to access patterns. Every time you view or edit a profile, you need all of that user's taught/learned skills — there's no scenario in this app where I query "give me the `Skill` document for 'C++'" independent of a user. Embedding means one query (`User.findById`) gets everything; referencing would mean either a second query or a `$lookup` aggregation for data that's always needed together. The tradeoff is that skill names aren't globally normalized — "C++" and "c++" could technically both exist across different users — which is why `matching.js` does case-insensitive comparison (`.toLowerCase()`) rather than relying on exact string equality.

**16. How does the frontend know if a user is logged in, and how is that state kept in sync across the app?**
*Short:* A React Context (`AuthContext`) holds the current user; the JWT lives in `localStorage`.
*Deep:* On app load, `AuthProvider` checks `localStorage` for a token; if present, it calls `GET /api/auth/me` to hydrate the actual user object (rather than trusting a possibly-stale cached user), and clears the token if that call fails (expired/invalid token). Every component that needs auth state calls `useAuth()` instead of receiving it as a prop — this avoids prop-drilling auth state through every layer of the component tree from `App` down to individual buttons. An axios request interceptor separately attaches the token to every outgoing API call automatically, so individual service functions never have to think about auth headers.

**17. What HTTP status codes does your API use, and why does that matter?**
*Short:* 200/201 for success, 400 for bad input, 401 for missing/invalid auth, 403 for authenticated-but-not-allowed, 404 for missing resources, 409 for conflicts, 500 for unexpected errors.
*Deep:* Status codes are a contract between client and server that lets the frontend react correctly without parsing error message strings. 401 vs 403 is the one people most often get wrong: 401 means "I don't know who you are" (missing/invalid token), 403 means "I know exactly who you are, and you're not allowed to do this" (e.g., trying to accept a swap request you didn't receive). 409 signals a conflict the client could resolve by trying something else (duplicate email, duplicate pending request) — semantically different from a 400 validation failure, which means the request itself was malformed.

**18. Why does availability overlap use exact time-window intersection instead of just matching on day?**
*Short:* Matching only on day would tell two users they're "compatible" even if one is free at 8am and the other at 8pm.
*Deep:* `slotsOverlap` converts each `HH:MM` string to minutes-since-midnight and checks the classic interval-overlap condition (`aStart < bEnd && bStart < aEnd`) — the standard way to test if two time ranges intersect. This is more honest than day-only matching, though it's still a simplification: it assumes a single flat weekly schedule with no timezone handling and no recurring exceptions, which is an explicit, reasonable scope cut for a demo product rather than a full calendar system (the spec explicitly said not to build one).

**19. What was the hardest design decision in this project, and what did you choose?**
*Short:* How to score a "one-way" match (only one person can teach the other) versus a true mutual swap, without either making one-way matches invisible or letting them dominate the ranking.
*Deep:* Early on I considered requiring mutuality just to appear in results at all, but that would hide potentially valuable connections — someone might still want to reach out even if they can't reciprocate yet. Instead, mutual exchange is heavily weighted (40 of 100 points) but not a hard gate, so one-way opportunities still surface, just ranked lower and with an honest "why" — the reasons list simply won't include a "they can teach you" or "you can teach them" line for the missing direction, which is itself informative to the user.

**20. If you had another week, what would you add or change?**
*Short:* Pre-filtering candidates at the database level before scoring, and real screenshots/E2E tests in the README.
*Deep:* The most honest answer is the scaling gap named in question 4 — right now Discover scores every other user in the database on every request, which is fine at demo scale but wouldn't survive real growth. I'd add a MongoDB index on `skillsToTeach.skill` and `skillsToLearn.skill` and pre-filter candidates to people with *any* skill overlap before running `calculateMatch`, cutting the comparison set dramatically before the O(n) loop even starts. I'd also want real end-to-end browser tests (I relied on API-level curl testing plus manual verification throughout this build) and to replace the "add your own screenshots" placeholder with actual ones.
