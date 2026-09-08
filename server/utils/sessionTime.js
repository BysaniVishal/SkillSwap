// Combines a Session's separate `date` (day only) and `time` ("HH:MM") fields
// into one absolute instant, always interpreted in UTC — avoids any
// dependency on the server's local timezone, which the app never asks the
// user for in the first place.
function getScheduledDateTime(session) {
  const [hours, minutes] = session.time.split(":").map(Number);
  const dt = new Date(session.date);
  dt.setUTCHours(hours, minutes, 0, 0);
  return dt;
}

module.exports = { getScheduledDateTime };
