const mongoose = require("mongoose");

// One document per (user, skill) pair — not a full history, just "when did
// this user last attempt this skill's quiz." Refreshed on every submission
// regardless of pass/fail, since seeing the questions is what creates the
// memorization risk the cooldown guards against, not the outcome.
const quizAttemptSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  skill: { type: String, required: true },
  attemptedAt: { type: Date, required: true, default: Date.now },
});

quizAttemptSchema.index({ user: 1, skill: 1 }, { unique: true });

module.exports = mongoose.model("QuizAttempt", quizAttemptSchema);
