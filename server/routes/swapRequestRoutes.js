const express = require("express");
const {
  createSwapRequest,
  getMyRequests,
  updateRequestStatus,
} = require("../controllers/swapRequestController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createSwapRequest);
router.get("/", protect, getMyRequests);
router.put("/:id", protect, updateRequestStatus);

module.exports = router;
