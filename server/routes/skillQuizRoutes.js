const express = require("express");
const { getQuizQuestions, submitQuiz } = require("../controllers/skillQuizController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/:skill", protect, getQuizQuestions);
router.post("/submit", protect, submitQuiz);

module.exports = router;
