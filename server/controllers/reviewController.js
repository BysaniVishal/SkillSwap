const Review = require("../models/Review");
const Swap = require("../models/Swap");
const User = require("../models/User");

// Recompute a user's average rating from scratch off their actual reviews.
// Simple and always-correct, and cheap at this scale — no running-average bookkeeping to get wrong.
async function recomputeRating(userId) {
  const reviews = await Review.find({ reviewedUser: userId });
  const count = reviews.length;
  const average = count ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;
  await User.findByIdAndUpdate(userId, { rating: { average, count } });
}

async function createReview(req, res) {
  const { swap: swapId, rating, comment } = req.body;

  if (!swapId || !rating) {
    return res.status(400).json({ message: "swap and rating are required" });
  }
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Rating must be between 1 and 5" });
  }

  const swap = await Swap.findById(swapId);
  if (!swap) {
    return res.status(404).json({ message: "Swap not found" });
  }

  const isUserA = swap.userA.toString() === req.user._id.toString();
  const isUserB = swap.userB.toString() === req.user._id.toString();
  if (!isUserA && !isUserB) {
    return res.status(403).json({ message: "You are not part of this swap" });
  }

  if (swap.status !== "completed") {
    return res.status(400).json({ message: "You can only review a swap after it is completed" });
  }

  const reviewedUser = isUserA ? swap.userB : swap.userA;

  const existing = await Review.findOne({ swap: swapId, reviewer: req.user._id });
  if (existing) {
    return res.status(409).json({ message: "You have already reviewed this swap" });
  }

  const review = await Review.create({
    swap: swapId,
    reviewer: req.user._id,
    reviewedUser,
    rating,
    comment: comment || "",
  });

  await recomputeRating(reviewedUser);

  res.status(201).json({ review });
}

async function getReviewsForUser(req, res) {
  const { user, swap } = req.query;
  if (!user && !swap) {
    return res.status(400).json({ message: "user or swap query param is required" });
  }

  const filter = {};
  if (user) filter.reviewedUser = user;
  if (swap) filter.swap = swap;

  const reviews = await Review.find(filter)
    .populate("reviewer", "name profilePicture")
    .sort("-createdAt");

  res.status(200).json({ reviews });
}

module.exports = { createReview, getReviewsForUser };
