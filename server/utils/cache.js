const redis = require("../config/redis");

// Every function here fails soft: if Redis isn't configured, isn't
// connected, or errors mid-request, callers just get a cache miss (null) or
// a silently-skipped write — never an exception that would take down an
// otherwise-working request.

async function getCache(key) {
  if (!redis || redis.status !== "ready") return null;
  try {
    const raw = await redis.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn(`Cache read failed for "${key}":`, err.message);
    return null;
  }
}

async function setCache(key, value, ttlSeconds) {
  if (!redis || redis.status !== "ready") return;
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (err) {
    console.warn(`Cache write failed for "${key}":`, err.message);
  }
}

async function invalidateCache(key) {
  if (!redis || redis.status !== "ready") return;
  try {
    await redis.del(key);
  } catch (err) {
    console.warn(`Cache invalidation failed for "${key}":`, err.message);
  }
}

module.exports = { getCache, setCache, invalidateCache };
