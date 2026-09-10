const { getClient, MODEL, Anthropic } = require("../utils/anthropicClient");
const { TOOLS, executeTool } = require("../utils/assistantTools");

const MAX_ITERATIONS = 6; // safety cap against runaway tool-call loops

function buildSystemPrompt(user) {
  const teaches = user.skillsToTeach.length
    ? user.skillsToTeach.map((s) => `${s.skill} (${s.proficiency})`).join(", ")
    : "nothing listed yet";
  const learns = user.skillsToLearn.length
    ? user.skillsToLearn.map((s) => `${s.skill} (${s.proficiency})`).join(", ")
    : "nothing listed yet";

  return `You are SkillSwap's in-app assistant. SkillSwap is a peer skill-exchange platform where students teach each other skills. You can:
1. Answer questions about how SkillSwap works (see "How SkillSwap works" below).
2. Automatically find the best match and send a swap request when a user expresses a clear intent to learn something (e.g. "I want to learn Python", "can you find me someone who teaches guitar").

How SkillSwap works:
- Matching: a deterministic 0-100 scoring algorithm compares two users across 6 weighted factors: mutual skill exchange (40 pts — can each teach the other something the other wants to learn), skill relevance/breadth (20 pts), proficiency compatibility (15 pts — is the teacher's level high enough for the learner's goal), availability overlap (10 pts), learning preference compatibility online/offline (5 pts), and the candidate's reputation/rating (10 pts). It is not AI-based — every point is explainable.
- Swap requests: a user sends a request naming what they will teach and what they want to learn; the receiver accepts or rejects it. An accepted request becomes an active "Swap." You cannot send a request to yourself, to someone you already have an active swap with, or when a pending request already exists between you two in either direction.
- Sessions: once a swap is active, users meet in a real-time video/whiteboard session room, at a scheduled time.
- Reviews: after a swap completes, users rate each other, feeding into future reputation scoring.

The current user, ${user.name}, teaches: ${teaches}.
They want to learn: ${learns}.

When the user expresses intent to learn a specific skill:
1. Call find_best_match with that skill.
2. Only call send_swap_request if a candidate was found AND the match is genuinely good (meaningful mutual value — do not send requests for weak, generic, or nonexistent matches). When calling it, senderTeaches must be one of the user's own skillsToTeach listed above (pick the most relevant one to what the candidate wants to learn, if disambiguation is needed), and senderLearns should be the skill the user asked about.
3. If no good match exists, or send_swap_request fails (e.g. a pending/active relationship already exists with that person), explain plainly and helpfully — do not show raw error text or apologize excessively. Suggest what the user could do next.
4. After a successful send, briefly confirm who the request went to and why they were a good match (cite 1-2 of the top match reasons), in plain conversational language.

For general questions with no learn-intent, just answer using the "How SkillSwap works" information above — do not call any tools.`;
}

async function runAgentLoop({ client, system, messages, ctx }) {
  const conversation = [...messages];

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system,
      tools: TOOLS,
      messages: conversation,
    });

    if (response.stop_reason !== "tool_use") {
      const textBlock = response.content.find((b) => b.type === "text");
      return textBlock ? textBlock.text : "";
    }

    conversation.push({ role: "assistant", content: response.content });

    const toolUseBlocks = response.content.filter((b) => b.type === "tool_use");
    const toolResults = [];
    for (const block of toolUseBlocks) {
      const result = await executeTool(block.name, block.input, ctx);
      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: JSON.stringify(result),
        is_error: !!result.error,
      });
    }
    conversation.push({ role: "user", content: toolResults });
  }

  return "I wasn't able to finish that — please try rephrasing.";
}

async function chat(req, res) {
  const { messages } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ message: "messages array is required" });
  }

  const client = getClient();
  if (!client) {
    return res.status(503).json({ message: "The AI assistant isn't configured yet." });
  }

  const user = req.user.toObject();
  const system = buildSystemPrompt(user);

  try {
    const reply = await runAgentLoop({ client, system, messages, ctx: { user } });
    res.status(200).json({ reply });
  } catch (err) {
    console.error("Assistant chat error:", err);
    if (
      err instanceof Anthropic.AuthenticationError ||
      err instanceof Anthropic.APIConnectionError ||
      err instanceof Anthropic.RateLimitError ||
      err instanceof Anthropic.APIError
    ) {
      return res.status(503).json({ message: "The AI assistant is temporarily unavailable." });
    }
    res.status(500).json({ message: "Something went wrong talking to the assistant." });
  }
}

module.exports = { chat };
