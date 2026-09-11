const mongoose = require("mongoose");

const SKILL_CATEGORIES = [
  "Programming",
  "Design",
  "Languages",
  "Academics",
  "Music",
  "Sports",
  "Marketing",
  "Other",
];

const PROFICIENCY_LEVELS = ["Beginner", "Intermediate", "Advanced"];

const teachSkillSchema = new mongoose.Schema(
  {
    skill: { type: String, required: true, trim: true },
    category: { type: String, enum: SKILL_CATEGORIES, default: "Other" },
    proficiency: { type: String, enum: PROFICIENCY_LEVELS, required: true },
    verificationMethod: { type: String, enum: ["quiz", "certificate"], default: "quiz" },
  },
  { _id: false }
);

const learnSkillSchema = new mongoose.Schema(
  {
    skill: { type: String, required: true, trim: true },
    category: { type: String, enum: SKILL_CATEGORIES, default: "Other" },
    proficiency: { type: String, enum: PROFICIENCY_LEVELS, required: true },
    goal: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const availabilitySlotSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      required: true,
    },
    start: { type: String, required: true }, // "18:00" 24hr format, keeps overlap math simple
    end: { type: String, required: true },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    college: { type: String, required: true, trim: true },
    bio: { type: String, default: "", maxlength: 500 },
    profilePicture: { type: String, default: "" },
    skillsToTeach: { type: [teachSkillSchema], default: [] },
    skillsToLearn: { type: [learnSkillSchema], default: [] },
    availability: { type: [availabilitySlotSchema], default: [] },
    learningPreference: {
      type: String,
      enum: ["online", "offline", "both"],
      default: "both",
    },
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    completedSwaps: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
module.exports.SKILL_CATEGORIES = SKILL_CATEGORIES;
module.exports.PROFICIENCY_LEVELS = PROFICIENCY_LEVELS;
