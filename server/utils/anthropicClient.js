const Anthropic = require("@anthropic-ai/sdk");

let client = null;

// Lazy singleton — returns null (never throws) when no key is configured,
// so callers can degrade gracefully instead of crashing the request.
function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

module.exports = { getClient, MODEL, Anthropic };
