// Static Category -> Topic -> Skill taxonomy. Skill names here are the
// authoritative vocabulary the whole app uses for skill selection — they
// exactly match server/utils/seed.js's skill names (continuity with
// existing demo data) and are the exact keys used in quizBank.js.
const SKILL_TAXONOMY = [
  {
    category: "Programming",
    topics: [
      { topic: "Web Development", skills: ["React", "JavaScript"] },
      { topic: "Core Programming", skills: ["C++", "Python", "Data Structures", "Java"] },
      { topic: "Databases", skills: ["SQL"] },
    ],
  },
  {
    category: "Design",
    topics: [{ topic: "Product & UI Design", skills: ["UI/UX", "Figma", "Illustrator"] }],
  },
  {
    category: "Languages",
    topics: [
      { topic: "Spoken Languages", skills: ["Spanish", "Hindi", "Tamil", "French", "German"] },
    ],
  },
  {
    category: "Academics",
    topics: [
      { topic: "Mathematics & Science", skills: ["Calculus", "Chemistry", "Physics", "Statistics"] },
      { topic: "Communication", skills: ["Public Speaking"] },
    ],
  },
  {
    category: "Music",
    topics: [{ topic: "Instruments", skills: ["Guitar", "Piano"] }],
  },
  {
    category: "Sports",
    topics: [
      { topic: "Games & Strategy", skills: ["Chess"] },
      { topic: "Racquet Sports", skills: ["Badminton"] },
      { topic: "Team Sports", skills: ["Cricket"] },
    ],
  },
  {
    category: "Marketing",
    topics: [
      { topic: "Content & Analytics", skills: ["Content Writing", "Excel", "Social Media Marketing"] },
    ],
  },
  {
    category: "Other",
    topics: [{ topic: "Creative & Lifestyle", skills: ["Photography", "Cooking"] }],
  },
];

module.exports = { SKILL_TAXONOMY };
