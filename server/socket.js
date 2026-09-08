const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const Session = require("./models/Session");
const { assertParticipant } = require("./controllers/sessionController");
const { getScheduledDateTime } = require("./utils/sessionTime");

// Joining is allowed from this many minutes before the scheduled start —
// a small grace window, not an open-ended "anytime while upcoming" policy.
const EARLY_JOIN_BUFFER_MS = 5 * 60 * 1000;

// sessionId -> Map<socketId, { userId, name, screenSharing }>
const rooms = new Map();

function getRoom(sessionId) {
  if (!rooms.has(sessionId)) {
    rooms.set(sessionId, new Map());
  }
  return rooms.get(sessionId);
}

function participantList(room) {
  return [...room.entries()].map(([socketId, p]) => ({
    socketId,
    userId: p.userId,
    name: p.name,
  }));
}

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  // Authenticate once at connection time, same JWT the REST API uses —
  // just verified on the handshake instead of per-request.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("unauthorized"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error("unauthorized"));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    let currentSessionId = null;

    socket.on("join-room", async ({ sessionId }) => {
      try {
        const session = await Session.findById(sessionId).populate("swap");
        if (!session) {
          return socket.emit("join-error", { reason: "not-found" });
        }

        if (!(await assertParticipant(session.swap, socket.user._id))) {
          return socket.emit("join-error", { reason: "forbidden" });
        }

        if (session.status !== "upcoming") {
          return socket.emit("join-error", { reason: "session-not-active" });
        }

        const scheduledAt = getScheduledDateTime(session);
        if (Date.now() < scheduledAt.getTime() - EARLY_JOIN_BUFFER_MS) {
          return socket.emit("join-error", {
            reason: "too-early",
            scheduledAt: scheduledAt.toISOString(),
          });
        }

        const room = getRoom(sessionId);

        // A user rejoining (e.g. a second tab, or a refresh the server hasn't
        // cleaned up yet) replaces their own stale slot rather than occupying
        // a second seat and locking out their actual swap partner.
        for (const [socketId, p] of room.entries()) {
          if (p.userId === socket.user._id.toString()) {
            room.delete(socketId);
            io.sockets.sockets.get(socketId)?.disconnect(true);
          }
        }

        if (room.size >= 2) {
          return socket.emit("join-error", { reason: "room-full" });
        }

        room.set(socket.id, {
          userId: socket.user._id.toString(),
          name: socket.user.name,
          screenSharing: false,
        });
        currentSessionId = sessionId;
        socket.join(sessionId);

        socket.emit("joined-room", { sessionId, participants: participantList(room) });
        socket.to(sessionId).emit("participant-joined", {
          socketId: socket.id,
          userId: socket.user._id.toString(),
          name: socket.user.name,
        });
      } catch (err) {
        socket.emit("join-error", { reason: "not-found" });
      }
    });

    socket.on("leave-room", () => leaveCurrentRoom());

    socket.on("offer", ({ sdp }) => {
      if (currentSessionId) socket.to(currentSessionId).emit("offer", { sdp });
    });

    socket.on("answer", ({ sdp }) => {
      if (currentSessionId) socket.to(currentSessionId).emit("answer", { sdp });
    });

    socket.on("ice-candidate", ({ candidate }) => {
      if (currentSessionId) socket.to(currentSessionId).emit("ice-candidate", { candidate });
    });

    socket.on("screen-share-started", () => {
      if (currentSessionId) socket.to(currentSessionId).emit("screen-share-started");
    });

    socket.on("screen-share-stopped", () => {
      if (currentSessionId) socket.to(currentSessionId).emit("screen-share-stopped");
    });

    socket.on("chat-message", ({ text }) => {
      if (!currentSessionId || !text) return;
      socket.to(currentSessionId).emit("chat-message", {
        text,
        from: socket.user.name,
        at: new Date().toISOString(),
      });
    });

    socket.on("draw", (segment) => {
      if (currentSessionId) socket.to(currentSessionId).emit("draw", segment);
    });

    socket.on("clear-board", () => {
      if (currentSessionId) socket.to(currentSessionId).emit("clear-board");
    });

    // The REST call that actually marks the Session completed happens
    // separately (see updateSessionStatus) — this just lets the other
    // participant's UI react live instead of silently losing the peer.
    socket.on("session-ended", () => {
      if (currentSessionId) socket.to(currentSessionId).emit("session-ended");
    });

    socket.on("disconnect", () => leaveCurrentRoom());

    function leaveCurrentRoom() {
      if (!currentSessionId) return;
      const room = rooms.get(currentSessionId);
      if (room) {
        room.delete(socket.id);
        if (room.size === 0) rooms.delete(currentSessionId);
      }
      socket.to(currentSessionId).emit("participant-left", { socketId: socket.id });
      socket.leave(currentSessionId);
      currentSessionId = null;
    }
  });

  return io;
}

module.exports = initSocket;
