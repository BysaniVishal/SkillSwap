const express = require("express");
const { getUserById, updateProfile, removeTeachSkill } = require("../controllers/userController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.put("/profile", protect, updateProfile);
router.delete("/skills/teach/:skill", protect, removeTeachSkill);
router.get("/:id", protect, getUserById);

module.exports = router;
