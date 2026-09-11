const { SKILL_TAXONOMY } = require("../data/skillTaxonomy");
const { PROFICIENCY_LEVELS } = require("../models/User");
const Certificate = require("../models/Certificate");
const { invalidateCache } = require("../utils/cache");
const { matchCacheKey } = require("./matchController");

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_FILE_BYTES = 2 * 1024 * 1024; // ~2MB

function findCategoryForSkill(skill) {
  for (const cat of SKILL_TAXONOMY) {
    for (const t of cat.topics) {
      if (t.skills.includes(skill)) return cat.category;
    }
  }
  return null;
}

// Rough decoded-size estimate from a base64 string, without actually decoding it.
function base64ByteLength(base64) {
  const cleaned = base64.replace(/^data:[^;]+;base64,/, "");
  const padding = (cleaned.match(/=*$/) || [""])[0].length;
  return Math.floor((cleaned.length * 3) / 4) - padding;
}

async function uploadCertificate(req, res) {
  const { skill, proficiency, fileData, mimeType } = req.body;

  const category = findCategoryForSkill(skill);
  if (!category) {
    return res.status(400).json({ message: "Unknown skill." });
  }

  if (!PROFICIENCY_LEVELS.includes(proficiency)) {
    return res.status(400).json({ message: "Invalid proficiency level." });
  }

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return res.status(400).json({ message: "File must be a JPEG, PNG, or PDF." });
  }

  if (!fileData || typeof fileData !== "string") {
    return res.status(400).json({ message: "No file provided." });
  }

  if (base64ByteLength(fileData) > MAX_FILE_BYTES) {
    return res.status(400).json({ message: "File must be under 2MB." });
  }

  await Certificate.create({
    user: req.user._id,
    skill,
    category,
    proficiency,
    fileData,
    mimeType,
  });

  const existing = req.user.skillsToTeach.find((s) => s.skill === skill);
  if (existing) {
    existing.proficiency = proficiency;
    existing.verificationMethod = "certificate";
  } else {
    req.user.skillsToTeach.push({ skill, category, proficiency, verificationMethod: "certificate" });
  }
  await req.user.save();
  await invalidateCache(matchCacheKey(req.user._id));

  res.status(200).json({ skillsToTeach: req.user.skillsToTeach });
}

module.exports = { uploadCertificate };
