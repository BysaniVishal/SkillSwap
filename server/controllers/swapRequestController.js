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

// Pure extract of createSwapRequest's logic, decoupled from req/res so a
// non-HTTP caller (the chatbot's tool handler) gets the exact same
// validation guarantees — self-request/active-swap/duplicate-pending —
// without duplicating any of it.
async function createSwapRequestCore({ senderId, receiver, senderTeaches, senderLearns, message }) {
  if (!receiver || !senderTeaches || !senderLearns) {
    return { ok: false, status: 400, message: "receiver, senderTeaches and senderLearns are required" };
  }

  if (receiver === senderId.toString()) {
    return { ok: false, status: 400, message: "You cannot send a swap request to yourself" };
  }

  const receiverUser = await User.findById(receiver);
  if (!receiverUser) {
    return { ok: false, status: 404, message: "User not found" };
  }

  if (await activeSwapExists(senderId, receiver)) {
    return { ok: false, status: 409, message: "You already have an active swap with this user" };
  }

  if (await pendingRequestExists(senderId, receiver)) {
    return {
      ok: false,
      status: 409,
      message: "A pending request already exists between you and this user",
    };
  }

  const request = await SwapRequest.create({
    sender: senderId,
    receiver,
    message: message || "",
    senderTeaches,
    senderLearns,
  });

  return { ok: true, request };
}

async function createSwapRequest(req, res) {
  const { receiver, message, senderTeaches, senderLearns } = req.body;

  const result = await createSwapRequestCore({
    senderId: req.user._id,
    receiver,
    senderTeaches,
    senderLearns,
    message,
  });

  if (!result.ok) {
    return res.status(result.status).json({ message: result.message });
  }

  res.status(201).json({ request: result.request });
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

module.exports = { createSwapRequest, createSwapRequestCore, getMyRequests, updateRequestStatus };
