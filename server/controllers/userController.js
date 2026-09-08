const User = require("../models/User");

async function getUserById(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  res.status(200).json({ user });
}

const ALLOWED_FIELDS = [
  "name",
  "bio",
  "college",
  "profilePicture",
  "skillsToTeach",
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

module.exports = { getUserById, updateProfile };
