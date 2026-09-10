const { QUIZ_BANK } = require("../data/quizBank");
const { SKILL_TAXONOMY } = require("../data/skillTaxonomy");
const QuizAttempt = require("../models/QuizAttempt");

const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 1 week
const QUESTIONS_PER_ATTEMPT = 8;

function findTaxonomyEntry(skill) {
  for (const cat of SKILL_TAXONOMY) {
    for (const t of cat.topics) {
      if (t.skills.includes(skill)) return { category: cat.category, topic: t.topic };
    }
  }
  return null;
}

// Fisher-Yates shuffle, returns a new array — doesn't mutate the input.
function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function resourceLinkFor(skill) {
  const query = encodeURIComponent(`${skill} tutorial for beginners`);
  return `https://www.youtube.com/results?search_query=${query}`;
}

async function getCooldownRemaining(userId, skill) {
  const attempt = await QuizAttempt.findOne({ user: userId, skill });
  if (!attempt) return null;
  const unlocksAt = attempt.attemptedAt.getTime() + COOLDOWN_MS;
  if (Date.now() >= unlocksAt) return null;
  return new Date(unlocksAt);
}

async function getQuizQuestions(req, res) {
  const skill = req.params.skill;
  const pool = QUIZ_BANK[skill];
  if (!pool) {
    return res.status(404).json({ message: "No quiz available for this skill" });
  }

  const unlocksAt = await getCooldownRemaining(req.user._id, skill);
  if (unlocksAt) {
    return res.status(429).json({
      message: `You already attempted this skill's test recently. You can retake it after ${unlocksAt.toLocaleString()}.`,
      unlocksAt: unlocksAt.toISOString(),
    });
  }

  // Random subset each time — indices are the stable identity used for
  // grading, since the pool order never changes but the displayed subset
  // and order do.
  const indices = shuffle(pool.map((_, i) => i)).slice(0, QUESTIONS_PER_ATTEMPT);
  const questions = indices.map((index) => ({
    index,
    question: pool[index].question,
    options: pool[index].options,
  }));

  res.status(200).json({ skill, questions });
}

async function submitQuiz(req, res) {
  const { skill, category, answers } = req.body;

  if (!skill || !category || !Array.isArray(answers)) {
    return res.status(400).json({ message: "skill, category and answers are required" });
  }

  const pool = QUIZ_BANK[skill];
  if (!pool) {
    return res.status(404).json({ message: "No quiz available for this skill" });
  }

  const taxonomyEntry = findTaxonomyEntry(skill);
  if (!taxonomyEntry || taxonomyEntry.category !== category) {
    return res.status(400).json({ message: "Skill does not belong to the given category" });
  }

  // Defense-in-depth: re-check cooldown here too, not just at GET, in case
  // a client cached an old fetch from before the cooldown started.
  const unlocksAt = await getCooldownRemaining(req.user._id, skill);
  if (unlocksAt) {
    return res.status(429).json({
      message: `You already attempted this skill's test recently. You can retake it after ${unlocksAt.toLocaleString()}.`,
      unlocksAt: unlocksAt.toISOString(),
    });
  }

  if (
    answers.length === 0 ||
    answers.some((a) => typeof a.index !== "number" || pool[a.index] === undefined)
  ) {
    return res.status(400).json({ message: "answers must reference valid question indices" });
  }

  const total = answers.length;
  const correct = answers.reduce(
    (count, a) => count + (a.selected === pool[a.index].correctIndex ? 1 : 0),
    0
  );
  const percent = Math.round((correct / total) * 1000) / 10;

  // Attempting the quiz — pass or fail — starts the cooldown. Upsert since
  // there's only ever one "last attempt" record per (user, skill).
  await QuizAttempt.findOneAndUpdate(
    { user: req.user._id, skill },
    { attemptedAt: new Date() },
    { upsert: true }
  );

  let proficiency = null;
  if (percent >= 80) proficiency = "Advanced";
  else if (percent >= 50) proficiency = "Intermediate";
  else if (percent >= 25) proficiency = "Beginner";

  if (!proficiency) {
    return res.status(200).json({
      passed: false,
      correct,
      total,
      percent,
      message: "Your score was too low to add this skill yet. Review the basics and try again.",
      resource: resourceLinkFor(skill),
    });
  }

  const existing = req.user.skillsToTeach.find((s) => s.skill === skill);
  if (existing) {
    existing.proficiency = proficiency;
  } else {
    req.user.skillsToTeach.push({ skill, category, proficiency });
  }
  await req.user.save();

  res.status(200).json({
    passed: true,
    correct,
    total,
    percent,
    proficiency,
    skillsToTeach: req.user.skillsToTeach,
  });
}

module.exports = { getQuizQuestions, submitQuiz };
