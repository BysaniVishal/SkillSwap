const express = require("express");
const { SKILL_CATEGORIES, PROFICIENCY_LEVELS } = require("../models/User");

const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({ categories: SKILL_CATEGORIES, proficiencyLevels: PROFICIENCY_LEVELS });
});

module.exports = router;
