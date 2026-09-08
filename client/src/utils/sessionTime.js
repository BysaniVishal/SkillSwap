// Mirrors server/utils/sessionTime.js — must stay in sync with the server's
// definition since the server is the actual authority; this copy exists
// purely so the UI can show the right state *before* navigating into the
// room, not to replace the server-side check.
export const EARLY_JOIN_BUFFER_MS = 5 * 60 * 1000;

export function getScheduledDateTime(session) {
  const [hours, minutes] = session.time.split(":").map(Number);
  const dt = new Date(session.date);
  dt.setUTCHours(hours, minutes, 0, 0);
  return dt;
}

export function isJoinable(session) {
  return Date.now() >= getScheduledDateTime(session).getTime() - EARLY_JOIN_BUFFER_MS;
}
