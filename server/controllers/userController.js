const User = require("../models/User");

async function getUserById(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  res.status(200).json({ user });
}

// skillsToTeach is deliberately NOT in this whitelist — teaching
// proficiency is earned via the skill quiz (see skillQuizController.js),
// never self-declared. Letting it through here would let a client PUT an
// arbitrary self-declared "Advanced" straight past the quiz gate, which
// is exactly the mass-assignment hole this feature exists to close.
const ALLOWED_FIELDS = [
  "name",
  "bio",
  "college",
  "profilePicture",
  "skillsToLearn",
  "availability",
  "learningPreference",
];

async function updateProfile(req, res) {
  const updates = {};
  for (const field of ALLOWED_FIELDS) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    returnDocument: "after",
    runValidators: true,
  });

  res.status(200).json({ user });
}

// Pure removal — no quiz needed, since removing a taught skill makes no
// false claim about your ability. Kept as its own small route rather than
// reopening skillsToTeach in ALLOWED_FIELDS, since that whitelist path
// would accept a client-supplied array with zero per-item validation.
async function removeTeachSkill(req, res) {
  const skill = req.params.skill;
  req.user.skillsToTeach = req.user.skillsToTeach.filter((s) => s.skill !== skill);
  await req.user.save();
  res.status(200).json({ skillsToTeach: req.user.skillsToTeach });
}

module.exports = { getUserById, updateProfile, removeTeachSkill };
