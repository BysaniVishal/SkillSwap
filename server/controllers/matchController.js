const User = require("../models/User");
const { calculateMatch } = require("../utils/matching");

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

  const candidates = await User.find({ _id: { $ne: req.user._id } }).lean();
  const me = req.user.toObject();

  let results = candidates.map((candidate) => {
    const { score, matchedSkills, reasons } = calculateMatch(me, candidate);
    return { user: candidate, score, matchedSkills, reasons };
  });

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
    results.sort((a, b) => (b.user.rating?.average || 0) - (a.user.rating?.average || 0));
  } else {
    results.sort((a, b) => b.score - a.score);
  }

  res.status(200).json({ matches: results });
}

// Same candidate universe, scoring, and skill-filter semantics as getMatches
// (?skill=X&sort=best's top result) — just packaged as a plain function so
// the chatbot's tool handler can call it directly, no HTTP round-trip.
async function findBestMatchForSkill(user, skill) {
  const candidates = await User.find({ _id: { $ne: user._id } }).lean();

  const results = candidates
    .map((candidate) => {
      const { score, matchedSkills, reasons } = calculateMatch(user, candidate);
      return { user: candidate, score, matchedSkills, reasons };
    })
    .filter((r) => skillMatches(r.user, skill));

  results.sort((a, b) => b.score - a.score);
  return results[0] || null;
}

module.exports = { getMatches, findBestMatchForSkill };
