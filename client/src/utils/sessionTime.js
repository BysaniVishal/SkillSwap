// Mirrors server/utils/sessionTime.js — must stay in sync with the server's
// definition since the server is the actual authority; this copy exists
// purely so the UI can show the right state *before* navigating into the
// room, not to replace the server-side check.
export const EARLY_JOIN_BUFFER_MS = 5 * 60 * 1000;

// India Standard Time, fixed UTC+5:30, no DST.
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

export function getScheduledDateTime(session) {
  const [hours, minutes] = session.time.split(":").map(Number);
  const d = new Date(session.date);

  const istWallClockAsUtcMs = Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate(),
    hours,
    minutes
  );

  return new Date(istWallClockAsUtcMs - IST_OFFSET_MS);
}

// Today's calendar date in IST — used as the date picker's minimum, since
// "today" can differ from the UTC calendar date near the day boundary
// (IST is 5.5 hours ahead of UTC).
export function todayIST() {
  return new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

export function isJoinable(session) {
  return Date.now() >= getScheduledDateTime(session).getTime() - EARLY_JOIN_BUFFER_MS;
}

// Formats a Date explicitly in IST regardless of the viewer's own system
// timezone, so "the time we scheduled" always reads the same for both
// participants.
export function formatIST(date, opts = {}) {
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
    ...opts,
  }) + " IST";
}

// session.date is a date-only value (no real time component) — reading it
// back through the viewer's local timezone can shift the displayed day, so
// this reads the stored calendar day directly instead of converting it.
export function formatSessionDate(session) {
  const d = new Date(session.date);
  return d.toLocaleDateString("en-IN", { timeZone: "UTC", dateStyle: "medium" });
}
