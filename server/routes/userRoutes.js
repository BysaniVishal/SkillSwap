const express = require("express");
const { getUserById, updateProfile, removeTeachSkill } = require("../controllers/userController");
const { uploadCertificate } = require("../controllers/certificateController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.put("/profile", protect, updateProfile);
router.post("/skills/teach/certificate", protect, uploadCertificate);
router.delete("/skills/teach/:skill", protect, removeTeachSkill);
router.get("/:id", protect, getUserById);

module.exports = router;
