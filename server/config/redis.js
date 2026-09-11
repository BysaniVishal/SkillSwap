const Redis = require("ioredis");

// Optional cache layer — the app must keep working with zero Redis
// available (e.g. a friend cloning this repo without setting REDIS_URL),
// so connection is lazy and every failure mode degrades to "no cache"
// rather than crashing or blocking requests.
let client = null;

if (process.env.REDIS_URL) {
  const options = {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null, // don't keep retrying forever in the background
  };

  // ioredis doesn't set SNI from the URL's hostname on its own, and
  // providers like Upstash route TLS by SNI across shared infrastructure —
  // without this, the server hands back the wrong certificate and every
  // connection fails with "unable to verify the first certificate," even
  // though the real cert chain is perfectly valid.
  if (process.env.REDIS_URL.startsWith("rediss://")) {
    options.tls = { servername: new URL(process.env.REDIS_URL).hostname };
  }

  client = new Redis(process.env.REDIS_URL, options);

  client.on("error", (err) => {
    console.warn("Redis error (falling back to no cache):", err.message);
  });

  client.on("ready", () => {
    console.log("Redis connected — cache layer active.");
  });

  client.connect().catch((err) => {
    console.warn("Redis connection failed (falling back to no cache):", err.message);
  });
} else {
  console.log("REDIS_URL not set — running without a cache layer.");
}

module.exports = client;
