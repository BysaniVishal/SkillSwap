const Swap = require("../models/Swap");
const User = require("../models/User");

async function getMySwaps(req, res) {
  const filter = { $or: [{ userA: req.user._id }, { userB: req.user._id }] };
  if (req.query.status) {
    filter.status = req.query.status;
  }

  const swaps = await Swap.find(filter)
    .populate("userA", "name college profilePicture rating")
    .populate("userB", "name college profilePicture rating")
    .sort("-createdAt");

  res.status(200).json({ swaps });
}

async function updateSwapStatus(req, res) {
  const { status } = req.body;
  if (!["completed", "cancelled"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const swap = await Swap.findById(req.params.id);
  if (!swap) {
    return res.status(404).json({ message: "Swap not found" });
  }

  const isParticipant =
    swap.userA.toString() === req.user._id.toString() ||
    swap.userB.toString() === req.user._id.toString();
  if (!isParticipant) {
    return res.status(403).json({ message: "You are not part of this swap" });
  }

  if (swap.status !== "active") {
    return res.status(400).json({ message: "This swap is no longer active" });
  }

  swap.status = status;
  if (status === "completed") {
    swap.completedAt = new Date();
    await User.updateMany(
      { _id: { $in: [swap.userA, swap.userB] } },
      { $inc: { completedSwaps: 1 } }
    );
  }
  await swap.save();

  res.status(200).json({ swap });
}

module.exports = { getMySwaps, updateSwapStatus };
