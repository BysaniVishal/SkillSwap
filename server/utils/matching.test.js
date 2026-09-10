// Scenario tests for the matching engine — pure function, no DB, no mocking needed.
// Run with: node utils/matching.test.js
const { calculateMatch } = require("./matching");

function assert(cond, msg) {
  if (!cond) throw new Error("FAILED: " + msg);
  console.log("OK:", msg);
}

// Scenario 1: mutual match, overlapping availability, compatible preference
const rahul = {
  skillsToTeach: [{ skill: "C++", category: "Programming", proficiency: "Advanced" }],
  skillsToLearn: [{ skill: "UI/UX", category: "Design", proficiency: "Beginner", goal: "" }],
  availability: [{ day: "Saturday", start: "10:00", end: "14:00" }],
  learningPreference: "both",
  rating: { average: 4.8, count: 12 },
};
const vishal = {
  skillsToTeach: [{ skill: "UI/UX", category: "Design", proficiency: "Intermediate" }],
  skillsToLearn: [{ skill: "C++", category: "Programming", proficiency: "Beginner", goal: "" }],
  availability: [{ day: "Saturday", start: "11:00", end: "13:00" }],
  learningPreference: "online",
  rating: { average: 4.5, count: 8 },
};
const r1 = calculateMatch(rahul, vishal);
assert(r1.score > 80, "mutual match with overlap scores high (got " + r1.score + ")");
assert(r1.matchedSkills.youTeachThem.length === 1, "rahul teaches vishal 1 skill");
assert(r1.matchedSkills.theyTeachYou.length === 1, "vishal teaches rahul 1 skill");

// Scenario 2: one-way only, no availability overlap
const priya = {
  skillsToTeach: [{ skill: "Python", category: "Programming", proficiency: "Advanced" }],
  skillsToLearn: [{ skill: "Guitar", category: "Music", proficiency: "Beginner" }],
  availability: [{ day: "Monday", start: "18:00", end: "20:00" }],
  learningPreference: "offline",
  rating: { average: 0, count: 0 },
};
const arjun = {
  skillsToTeach: [{ skill: "Guitar", category: "Music", proficiency: "Advanced" }],
  skillsToLearn: [{ skill: "Spanish", category: "Languages", proficiency: "Beginner" }],
  availability: [{ day: "Tuesday", start: "18:00", end: "20:00" }],
  learningPreference: "offline",
  rating: { average: 0, count: 0 },
};
const r2 = calculateMatch(priya, arjun);
assert(r2.score > 0 && r2.score < 60, "one-way match scores moderate (got " + r2.score + ")");
assert(r2.matchedSkills.youTeachThem.length === 0, "priya teaches arjun nothing he wants");
assert(r2.matchedSkills.theyTeachYou.length === 1, "arjun teaches priya guitar");

// Scenario 3: zero overlap
const zoya = {
  skillsToTeach: [{ skill: "Excel", category: "Marketing", proficiency: "Advanced" }],
  skillsToLearn: [{ skill: "Photography", category: "Other", proficiency: "Beginner" }],
  availability: [],
  learningPreference: "online",
  rating: { average: 0, count: 0 },
};
const kabir = {
  skillsToTeach: [{ skill: "Chess", category: "Sports", proficiency: "Advanced" }],
  skillsToLearn: [{ skill: "Cooking", category: "Other", proficiency: "Beginner" }],
  availability: [],
  learningPreference: "offline",
  rating: { average: 0, count: 0 },
};
const r3 = calculateMatch(zoya, kabir);
assert(r3.score < 20, "zero overlap scores low (got " + r3.score + ")");
assert(
  r3.matchedSkills.youTeachThem.length === 0 && r3.matchedSkills.theyTeachYou.length === 0,
  "no matched skills"
);

// Scenario 4: teacher's proficiency is below what the learner needs
const weakTeacher = {
  skillsToTeach: [{ skill: "React", category: "Programming", proficiency: "Beginner" }],
  skillsToLearn: [],
  availability: [],
  learningPreference: "both",
  rating: { average: 0, count: 0 },
};
const advancedLearner = {
  skillsToTeach: [],
  skillsToLearn: [{ skill: "React", category: "Programming", proficiency: "Advanced" }],
  availability: [],
  learningPreference: "both",
  rating: { average: 0, count: 0 },
};
const r4 = calculateMatch(weakTeacher, advancedLearner);
const proficiencyReason = r4.reasons.find((r) => r.label.includes("Teacher skill levels"));
assert(!proficiencyReason, "no proficiency-compatible reason when teacher is below learner's level");

// Scenario 5: graded proficiency — a bigger gap above what the learner
// needs should score strictly higher, not just "compatible" either way.
function soloTeacher(proficiency) {
  return {
    skillsToTeach: [{ skill: "React", category: "Programming", proficiency }],
    skillsToLearn: [],
    availability: [],
    learningPreference: "both",
    rating: { average: 0, count: 0 },
  };
}
const beginnerLearner = {
  skillsToTeach: [],
  skillsToLearn: [{ skill: "React", category: "Programming", proficiency: "Beginner" }],
  availability: [],
  learningPreference: "both",
  rating: { average: 0, count: 0 },
};

const exactMatch = calculateMatch(soloTeacher("Beginner"), beginnerLearner);
const oneAbove = calculateMatch(soloTeacher("Intermediate"), beginnerLearner);
const twoAbove = calculateMatch(soloTeacher("Advanced"), beginnerLearner);

assert(
  oneAbove.score > exactMatch.score,
  `Intermediate teaching a Beginner (${oneAbove.score}) scores higher than exact-level match (${exactMatch.score})`
);
assert(
  twoAbove.score > oneAbove.score,
  `Advanced teaching a Beginner (${twoAbove.score}) scores higher than Intermediate teaching a Beginner (${oneAbove.score})`
);

console.log("\nAll matching.js scenarios passed.");
