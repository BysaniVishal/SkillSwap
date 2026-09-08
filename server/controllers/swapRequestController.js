const SwapRequest = require("../models/SwapRequest");
const Swap = require("../models/Swap");
const User = require("../models/User");

async function activeSwapExists(userIdA, userIdB) {
  const swap = await Swap.findOne({
    status: "active",
    $or: [
      { userA: userIdA, userB: userIdB },
      { userA: userIdB, userB: userIdA },
    ],
  });
  return !!swap;
}

async function pendingRequestExists(userIdA, userIdB) {
  const request = await SwapRequest.findOne({
    status: "pending",
    $or: [
      { sender: userIdA, receiver: userIdB },
      { sender: userIdB, receiver: userIdA },
    ],
  });
  return !!request;
}

async function createSwapRequest(req, res) {
  const { receiver, message, senderTeaches, senderLearns } = req.body;

  if (!receiver || !senderTeaches || !senderLearns) {
    return res
      .status(400)
      .json({ message: "receiver, senderTeaches and senderLearns are required" });
  }

  if (receiver === req.user._id.toString()) {
    return res.status(400).json({ message: "You cannot send a swap request to yourself" });
  }

  const receiverUser = await User.findById(receiver);
  if (!receiverUser) {
    return res.status(404).json({ message: "User not found" });
  }

  if (await activeSwapExists(req.user._id, receiver)) {
    return res.status(409).json({ message: "You already have an active swap with this user" });
  }

  if (await pendingRequestExists(req.user._id, receiver)) {
    return res
      .status(409)
      .json({ message: "A pending request already exists between you and this user" });
  }

  const request = await SwapRequest.create({
    sender: req.user._id,
    receiver,
    message: message || "",
    senderTeaches,
    senderLearns,
  });

  res.status(201).json({ request });
}

async function getMyRequests(req, res) {
  const [sent, received] = await Promise.all([
    SwapRequest.find({ sender: req.user._id })
      .populate("receiver", "name college profilePicture rating")
      .sort("-createdAt"),
    SwapRequest.find({ receiver: req.user._id })
      .populate("sender", "name college profilePicture rating")
      .sort("-createdAt"),
  ]);

  res.status(200).json({ sent, received });
}

async function updateRequestStatus(req, res) {
  const { status } = req.body;
  const validTransitions = ["accepted", "rejected", "cancelled"];

  if (!validTransitions.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const request = await SwapRequest.findById(req.params.id);
  if (!request) {
    return res.status(404).json({ message: "Request not found" });
  }

  if (request.status !== "pending") {
    return res.status(400).json({ message: "This request has already been handled" });
  }

  const isReceiver = request.receiver.toString() === req.user._id.toString();
  const isSender = request.sender.toString() === req.user._id.toString();

  if ((status === "accepted" || status === "rejected") && !isReceiver) {
    return res.status(403).json({ message: "Only the receiver can accept or reject this request" });
  }
  if (status === "cancelled" && !isSender) {
    return res.status(403).json({ message: "Only the sender can cancel this request" });
  }

  request.status = status;
  await request.save();

  let swap = null;
  if (status === "accepted") {
    swap = await Swap.create({
      userA: request.sender,
      userB: request.receiver,
      skills: {
        userATeaches: request.senderTeaches,
        userBTeaches: request.senderLearns,
      },
    });
  }

  res.status(200).json({ request, swap });
}

module.exports = { createSwapRequest, getMyRequests, updateRequestStatus };
