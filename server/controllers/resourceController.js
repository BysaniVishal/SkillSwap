const { SKILL_TAXONOMY } = require("../data/skillTaxonomy");
const { CATEGORY_GUIDANCE } = require("../data/categoryGuidance");
const { getResourceLinks } = require("../utils/resourceLinks");

function getResources(req, res) {
  const taxonomy = SKILL_TAXONOMY.map((cat) => ({
    category: cat.category,
    guidance: CATEGORY_GUIDANCE[cat.category] || "",
    topics: cat.topics.map((t) => ({
      topic: t.topic,
      skills: t.skills.map((skill) => ({
        skill,
        links: getResourceLinks(skill),
      })),
    })),
  }));

  res.json({ taxonomy });
}

module.exports = { getResources };
