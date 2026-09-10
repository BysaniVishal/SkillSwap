const { Type } = require("@google/genai");
const { findBestMatchForSkill } = require("../controllers/matchController");
const { createSwapRequestCore } = require("../controllers/swapRequestController");

// Gemini's functionDeclarations use an OpenAPI-subset schema (Type enum,
// no additionalProperties) — a narrower dialect than full JSON Schema.
const TOOLS = [
  {
    name: "find_best_match",
    description:
      "Search SkillSwap's user base for the best possible skill-exchange match for a skill the " +
      "current user wants to learn. Returns the top candidate (name, id, score 0-100, reasons, " +
      "what they teach) or found:false if nobody matches. Always call this before send_swap_request.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        skill: { type: Type.STRING, description: "The skill the user wants to learn, e.g. Python" },
      },
      required: ["skill"],
    },
  },
  {
    name: "send_swap_request",
    description:
      "Send a swap request from the current user to another user. Only call this after " +
      "find_best_match has returned a genuine, reasonably good candidate — do not call this " +
      "for a weak or nonexistent match; explain to the user instead.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        receiverId: { type: Type.STRING, description: "The _id of the match candidate, from find_best_match" },
        senderTeaches: { type: Type.STRING, description: "One of the current user's own skillsToTeach entries" },
        senderLearns: { type: Type.STRING, description: "The skill the current user wants to learn (matches the request)" },
      },
      required: ["receiverId", "senderTeaches", "senderLearns"],
    },
  },
];

async function handleFindBestMatch(input, ctx) {
  const best = await findBestMatchForSkill(ctx.user, input.skill);
  if (!best) return { found: false };

  return {
    found: true,
    candidate: {
      id: best.user._id.toString(),
      name: best.user.name,
      score: best.score,
      reasons: best.reasons.map((r) => r.label),
      teaches: best.user.skillsToTeach.map((s) => `${s.skill} (${s.proficiency})`),
    },
  };
}

async function handleSendSwapRequest(input, ctx) {
  const { receiverId, senderTeaches, senderLearns } = input;

  // Defense-in-depth: never trust the model's tool-call arguments as ground
  // truth, even though the system prompt already lists the user's real
  // skills. This check runs independently of anything the model claims.
  const ownsSkill = ctx.user.skillsToTeach.some(
    (s) => s.skill.toLowerCase() === (senderTeaches || "").toLowerCase()
  );
  if (!ownsSkill) {
    return { error: true, message: `You don't currently list "${senderTeaches}" as a skill you teach.` };
  }

  const result = await createSwapRequestCore({
    senderId: ctx.user._id,
    receiver: receiverId,
    senderTeaches,
    senderLearns,
  });

  if (!result.ok) {
    return { error: true, message: result.message };
  }

  return { ok: true, requestId: result.request._id.toString() };
}

async function executeTool(name, input, ctx) {
  switch (name) {
    case "find_best_match":
      return handleFindBestMatch(input, ctx);
    case "send_swap_request":
      return handleSendSwapRequest(input, ctx);
    default:
      return { error: true, message: `Unknown tool: ${name}` };
  }
}

module.exports = { TOOLS, executeTool };
