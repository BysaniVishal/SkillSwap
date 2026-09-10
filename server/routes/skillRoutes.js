const express = require("express");
const { SKILL_CATEGORIES, PROFICIENCY_LEVELS } = require("../models/User");
const { SKILL_TAXONOMY } = require("../data/skillTaxonomy");

const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({
    categories: SKILL_CATEGORIES,
    proficiencyLevels: PROFICIENCY_LEVELS,
    taxonomy: SKILL_TAXONOMY,
  });
});

module.exports = router;
