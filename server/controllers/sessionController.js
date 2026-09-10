const Session = require("../models/Session");
const Swap = require("../models/Swap");
const { getSessionEndDateTime } = require("../utils/sessionTime");
// Required lazily inside flagMissedSessions, not at module top: socket.js
// itself requires this file (for assertParticipant), so a top-level
// require here would create a circular load and could pick up socket.js's
// exports before hasActiveRoom is attached.

async function assertParticipant(swap, userId) {
  return swap.userA.toString() === userId.toString() || swap.userB.toString() === userId.toString();
}

async function createSession(req, res) {
  const { swap: swapId, skill, date, time, duration, notes } = req.body;

  if (!swapId || !skill || !date || !time || !duration) {
    return res.status(400).json({ message: "swap, skill, date, time and duration are required" });
  }

  const swap = await Swap.findById(swapId);
  if (!swap) {
    return res.status(404).json({ message: "Swap not found" });
  }

  if (!(await assertParticipant(swap, req.user._id))) {
    return res.status(403).json({ message: "You are not part of this swap" });
  }

  if (swap.status !== "active") {
    return res.status(400).json({ message: "Sessions can only be scheduled on an active swap" });
  }

  const validSkills = [swap.skills.userATeaches, swap.skills.userBTeaches];
  if (!validSkills.includes(skill)) {
    return res.status(400).json({ message: `Skill must be one of: ${validSkills.join(", ")}` });
  }

  const session = await Session.create({ swap: swapId, skill, date, time, duration, notes });
  res.status(201).json({ session });
}

// Lazily flips any stale "upcoming" session whose window has closed to
// "missed" — no cron/scheduler needed, this just runs whenever anyone
// lists sessions (SessionPanel, SessionRoom, the Dashboard widget all read
// through getSessions, so this one site covers every display path).
// Skips any session with a live room so an in-progress call is never
// disrupted just because the scheduled duration elapsed.
async function flagMissedSessions(sessions) {
  const { hasActiveRoom } = require("../socket");
  const now = Date.now();

  const expiredIds = sessions
    .filter((s) => s.status === "upcoming")
    .filter((s) => now > getSessionEndDateTime(s).getTime())
    .filter((s) => !hasActiveRoom(s._id.toString()))
    .map((s) => s._id);

  if (expiredIds.length === 0) return;

  await Session.updateMany({ _id: { $in: expiredIds }, status: "upcoming" }, { status: "missed" });

  const expiredSet = new Set(expiredIds.map((id) => id.toString()));
  sessions.forEach((s) => {
    if (expiredSet.has(s._id.toString())) s.status = "missed";
  });
}

async function getSessions(req, res) {
  let swapIds;

  if (req.query.swap) {
    const swap = await Swap.findById(req.query.swap);
    if (!swap) {
      return res.status(404).json({ message: "Swap not found" });
    }
    if (!(await assertParticipant(swap, req.user._id))) {
      return res.status(403).json({ message: "You are not part of this swap" });
    }
    swapIds = [swap._id];
  } else {
    const mySwaps = await Swap.find({
      $or: [{ userA: req.user._id }, { userB: req.user._id }],
    }).select("_id");
    swapIds = mySwaps.map((s) => s._id);
  }

  const sessions = await Session.find({ swap: { $in: swapIds } })
    .populate({ path: "swap", populate: [{ path: "userA", select: "name" }, { path: "userB", select: "name" }] })
    .sort("date");

  await flagMissedSessions(sessions);

  res.status(200).json({ sessions });
}

async function updateSessionStatus(req, res) {
  const { status } = req.body;
  if (!["completed", "cancelled"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const session = await Session.findById(req.params.id).populate("swap");
  if (!session) {
    return res.status(404).json({ message: "Session not found" });
  }

  if (!(await assertParticipant(session.swap, req.user._id))) {
    return res.status(403).json({ message: "You are not part of this session's swap" });
  }

  if (session.status !== "upcoming") {
    return res.status(400).json({ message: "This session has already been handled" });
  }

  session.status = status;
  await session.save();

  res.status(200).json({ session });
}

module.exports = { createSession, getSessions, updateSessionStatus, assertParticipant };
