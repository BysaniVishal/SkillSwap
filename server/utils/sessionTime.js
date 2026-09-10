// India Standard Time is a fixed UTC+5:30 offset — no DST to worry about,
// so a plain constant is correct year-round.
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

// Combines a Session's separate `date` (day only) and `time` ("HH:MM") fields
// into one absolute instant. The date/time the user picked are always
// treated as India Standard Time (that's the audience this app is built
// for), converted here to a true UTC instant so it can be compared against
// Date.now() correctly regardless of what timezone the server process
// itself happens to be running in.
function getScheduledDateTime(session) {
  const [hours, minutes] = session.time.split(":").map(Number);
  const d = new Date(session.date);

  // session.date is stored as UTC midnight for the chosen calendar day
  // (e.g. "2026-09-15" -> 2026-09-15T00:00:00Z). Read the day back out via
  // the UTC getters so we never accidentally shift the calendar date, then
  // build the IST wall-clock instant and subtract the offset to get UTC.
  const istWallClockAsUtcMs = Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate(),
    hours,
    minutes
  );

  return new Date(istWallClockAsUtcMs - IST_OFFSET_MS);
}

// The instant the scheduled window closes — scheduled start + duration.
function getSessionEndDateTime(session) {
  return new Date(getScheduledDateTime(session).getTime() + session.duration * 60 * 1000);
}

module.exports = { getScheduledDateTime, getSessionEndDateTime };
