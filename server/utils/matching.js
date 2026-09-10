// Explainable, deterministic compatibility scoring between two users.
// No AI/ML — every point awarded maps to a human-readable reason.

const WEIGHTS = {
  MUTUAL_EXCHANGE: 40, // 20 for "you can teach them" + 20 for "they can teach you"
  SKILL_RELEVANCE: 20, // breadth of matched skills, both directions combined
  PROFICIENCY: 15, // is the teacher's level actually high enough to help the learner
  AVAILABILITY: 10, // any overlapping weekly time window
  PREFERENCE: 5, // online/offline/both compatibility
  REPUTATION: 10, // the other user's average rating
};

const PROFICIENCY_RANK = { Beginner: 1, Intermediate: 2, Advanced: 3 };

// Matched-skill breadth saturates at this many pairs — beyond this, more
// overlapping skills stop adding points. Keeps the score bounded and keeps
// "we match on 6 things" from outweighing "we match on 2 things well."
const RELEVANCE_SATURATION = 4;

function normalize(name) {
  return name.trim().toLowerCase();
}

// Skills teacher teaches that learner wants to learn, paired up.
function findSkillMatches(teachList, learnList) {
  const matches = [];
  for (const teach of teachList) {
    for (const learn of learnList) {
      if (normalize(teach.skill) === normalize(learn.skill)) {
        matches.push({
          skill: teach.skill,
          category: teach.category,
          teacherProficiency: teach.proficiency,
          learnerProficiency: learn.proficiency,
          learnerGoal: learn.goal || "",
        });
      }
    }
  }
  return matches;
}

function timeToMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function slotsOverlap(a, b) {
  if (a.day !== b.day) return false;
  const aStart = timeToMinutes(a.start);
  const aEnd = timeToMinutes(a.end);
  const bStart = timeToMinutes(b.start);
  const bEnd = timeToMinutes(b.end);
  return aStart < bEnd && bStart < aEnd;
}

function findAvailabilityOverlap(availA, availB) {
  for (const a of availA) {
    for (const b of availB) {
      if (slotsOverlap(a, b)) {
        return { day: a.day, start: Math.max(timeToMinutes(a.start), timeToMinutes(b.start)) };
      }
    }
  }
  return null;
}

function preferenceCompatible(prefA, prefB) {
  if (prefA === "both" || prefB === "both") return true;
  return prefA === prefB;
}

// Graded, not binary: a teacher who only just meets what the learner asked
// for is a fine match, but a teacher whose level sits well above the ask
// can teach it more effectively — explain more angles, handle harder
// questions — so a bigger gap earns proportionally more credit, up to the
// largest possible gap on a 3-level scale (Advanced teaching a Beginner).
function proficiencyPairScore(teacherProficiency, learnerProficiency) {
  const gap = PROFICIENCY_RANK[teacherProficiency] - PROFICIENCY_RANK[learnerProficiency];
  if (gap < 0) return 0; // teacher doesn't meet what the learner needs
  if (gap === 0) return 0.75; // meets it exactly, no buffer above the ask
  if (gap === 1) return 0.9; // comfortably exceeds it
  return 1.0; // gap === 2: teaches it really well
}

/**
 * calculateMatch(userA, userB)
 * Pure function — takes two plain user objects, returns:
 *   { score, matchedSkills, reasons }
 * matchedSkills: skills userA teaches that userB wants, and vice versa.
 * reasons: ordered list of { label, points } explaining the score.
 */
function calculateMatch(userA, userB) {
  const reasons = [];
  let score = 0;

  // 1. Mutual skill exchange (up to 40: 20 each direction)
  const aTeachesB = findSkillMatches(userA.skillsToTeach || [], userB.skillsToLearn || []);
  const bTeachesA = findSkillMatches(userB.skillsToTeach || [], userA.skillsToLearn || []);

  if (aTeachesB.length > 0) {
    score += WEIGHTS.MUTUAL_EXCHANGE / 2;
    reasons.push({
      label: `You can teach them ${aTeachesB.map((m) => m.skill).join(", ")}`,
      points: WEIGHTS.MUTUAL_EXCHANGE / 2,
    });
  }
  if (bTeachesA.length > 0) {
    score += WEIGHTS.MUTUAL_EXCHANGE / 2;
    reasons.push({
      label: `They can teach you ${bTeachesA.map((m) => m.skill).join(", ")}`,
      points: WEIGHTS.MUTUAL_EXCHANGE / 2,
    });
  }

  // 2. Skill relevance / breadth — how many distinct matched pairs, both directions
  const totalMatches = aTeachesB.length + bTeachesA.length;
  if (totalMatches > 0) {
    const relevancePoints = Math.round(
      (Math.min(totalMatches, RELEVANCE_SATURATION) / RELEVANCE_SATURATION) *
        WEIGHTS.SKILL_RELEVANCE
    );
    score += relevancePoints;
    reasons.push({
      label: `${totalMatches} relevant skill${totalMatches > 1 ? "s" : ""} in common`,
      points: relevancePoints,
    });
  }

  // 3. Proficiency compatibility — graded by how far the teacher's level
  // sits above what the learner needs, averaged across every matched pair.
  const allMatches = [...aTeachesB, ...bTeachesA];
  if (allMatches.length > 0) {
    const avgFraction =
      allMatches.reduce(
        (sum, m) => sum + proficiencyPairScore(m.teacherProficiency, m.learnerProficiency),
        0
      ) / allMatches.length;
    const proficiencyPoints = Math.round(avgFraction * WEIGHTS.PROFICIENCY);
    score += proficiencyPoints;
    if (proficiencyPoints > 0) {
      const anyExceeds = allMatches.some(
        (m) => PROFICIENCY_RANK[m.teacherProficiency] > PROFICIENCY_RANK[m.learnerProficiency]
      );
      reasons.push({
        label: anyExceeds
          ? "Teacher skill levels comfortably exceed the learning goals"
          : "Teacher skill levels meet the learning goals",
        points: proficiencyPoints,
      });
    }
  }

  // 4. Availability overlap
  const overlap = findAvailabilityOverlap(userA.availability || [], userB.availability || []);
  if (overlap) {
    score += WEIGHTS.AVAILABILITY;
    reasons.push({
      label: `Availability overlaps on ${overlap.day}`,
      points: WEIGHTS.AVAILABILITY,
    });
  }

  // 5. Learning preference (online / offline / both)
  if (preferenceCompatible(userA.learningPreference, userB.learningPreference)) {
    score += WEIGHTS.PREFERENCE;
    reasons.push({
      label: "Compatible learning preference (online/offline)",
      points: WEIGHTS.PREFERENCE,
    });
  }

  // 6. Reputation — the OTHER user's rating. New users (no ratings yet) get
  // a neutral half-credit so they aren't penalized for being new.
  const otherRating = userB.rating?.count > 0 ? userB.rating.average : 2.5;
  const reputationPoints = Math.round((otherRating / 5) * WEIGHTS.REPUTATION);
  score += reputationPoints;
  reasons.push({
    label:
      userB.rating?.count > 0
        ? `${otherRating.toFixed(1)}★ average from ${userB.rating.count} review${userB.rating.count > 1 ? "s" : ""}`
        : "New member (no reviews yet)",
    points: reputationPoints,
  });

  return {
    score: Math.min(100, Math.round(score)),
    matchedSkills: { youTeachThem: aTeachesB, theyTeachYou: bTeachesA },
    reasons,
  };
}

module.exports = { calculateMatch, WEIGHTS };
