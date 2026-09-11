const User = require("../models/User");
const { calculateMatch } = require("../utils/matching");
const { getCache, setCache } = require("../utils/cache");

// How long a user's full (unfiltered, unsorted) match list stays cached.
// Short enough that a candidate's profile/rating changing elsewhere is
// only ever stale for a couple of minutes, long enough to absorb the
// "click around Discover changing filters" pattern without recomputing
// calculateMatch() against every other user on each keystroke.
const MATCH_CACHE_TTL_SECONDS = 120;

function matchCacheKey(userId) {
  return `matches:${userId}`;
}

// The expensive part — fetch every other user and score them all — cached
// per requesting user. Filtering/sorting stays outside the cache since
// those are cheap and vary per request; caching them separately per filter
// combination would multiply cache entries for no benefit.
async function getAllMatchesForUser(user) {
  const cacheKey = matchCacheKey(user._id);
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const candidates = await User.find({ _id: { $ne: user._id } }).lean();
  const results = candidates.map((candidate) => {
    const { score, matchedSkills, reasons } = calculateMatch(user, candidate);
    return { user: candidate, score, matchedSkills, reasons };
  });

  await setCache(cacheKey, results, MATCH_CACHE_TTL_SECONDS);
  return results;
}

function skillMatches(user, skillQuery) {
  const q = skillQuery.toLowerCase();
  const all = [...user.skillsToTeach, ...user.skillsToLearn];
  return all.some((s) => s.skill.toLowerCase().includes(q));
}

function categoryMatches(user, categoryQuery) {
  const all = [...user.skillsToTeach, ...user.skillsToLearn];
  return all.some((s) => s.category === categoryQuery);
}

async function getMatches(req, res) {
  const { skill, category, minScore, preference, sort } = req.query;

  const me = req.user.toObject();
  let results = await getAllMatchesForUser(me);

  if (skill) {
    results = results.filter((r) => skillMatches(r.user, skill));
  }
  if (category) {
    results = results.filter((r) => categoryMatches(r.user, category));
  }
  if (minScore) {
    results = results.filter((r) => r.score >= Number(minScore));
  }
  if (preference && preference !== "both") {
    results = results.filter(
      (r) => r.user.learningPreference === preference || r.user.learningPreference === "both"
    );
  }

  if (sort === "rating") {
    results = [...results].sort((a, b) => (b.user.rating?.average || 0) - (a.user.rating?.average || 0));
  } else {
    results = [...results].sort((a, b) => b.score - a.score);
  }

  res.status(200).json({ matches: results });
}

// Same candidate universe, scoring, and skill-filter semantics as
// getMatches (?skill=X&sort=best's top result) — just packaged as a plain
// function so the chatbot's tool handler can call it directly, no HTTP
// round-trip. Shares the same cached match list as getMatches.
async function findBestMatchForSkill(user, skill) {
  const results = (await getAllMatchesForUser(user)).filter((r) => skillMatches(r.user, skill));
  const sorted = [...results].sort((a, b) => b.score - a.score);
  return sorted[0] || null;
}

module.exports = { getMatches, findBestMatchForSkill, matchCacheKey };
