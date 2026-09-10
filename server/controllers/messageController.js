const Message = require("../models/Message");
const Swap = require("../models/Swap");
const { assertParticipant } = require("./sessionController");

const HISTORY_LIMIT = 200;

async function getMessages(req, res) {
  const { swap: swapId } = req.query;
  if (!swapId) {
    return res.status(400).json({ message: "swap query param is required" });
  }

  const swap = await Swap.findById(swapId);
  if (!swap) {
    return res.status(404).json({ message: "Swap not found" });
  }

  if (!(await assertParticipant(swap, req.user._id))) {
    return res.status(403).json({ message: "You are not part of this swap" });
  }

  const messages = await Message.find({ swap: swapId })
    .sort("createdAt")
    .limit(HISTORY_LIMIT)
    .populate("sender", "name");

  res.status(200).json({ messages });
}

module.exports = { getMessages };
