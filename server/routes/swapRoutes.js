const express = require("express");
const { getMySwaps, updateSwapStatus } = require("../controllers/swapController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getMySwaps);
router.put("/:id", protect, updateSwapStatus);

module.exports = router;
