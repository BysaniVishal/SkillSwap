const express = require("express");
const { getResources } = require("../controllers/resourceController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getResources);

module.exports = router;
