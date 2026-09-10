const { GoogleGenAI } = require("@google/genai");

let client = null;

// Lazy singleton — returns null (never throws) when no key is configured,
// so callers can degrade gracefully instead of crashing the request.
function getClient() {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!client) client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

module.exports = { getClient, MODEL };
