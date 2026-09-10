import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createSession, getSessions, updateSessionStatus } from "../services/sessions";
import {
  getScheduledDateTime,
  isJoinable,
  isExpired,
  formatIST,
  formatSessionDate,
  todayIST,
} from "../utils/sessionTime";
import StatusPill from "./ui/StatusPill";
import Button from "./ui/Button";
import Alert from "./ui/Alert";

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];

function emptyForm(skillOptions) {
  return { skill: skillOptions[0] || "", date: todayIST(), time: "18:00", duration: 60, notes: "" };
}

function SessionPanel({ swap }) {
  const skillOptions = [swap.skills.userATeaches, swap.skills.userBTeaches];
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm(skillOptions));
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);

  function load() {
    setLoading(true);
    getSessions(swap._id)
      .then(setSessions)
      .catch((err) => setError(err.response?.data?.message || "Failed to load sessions"))
      .finally(() => setLoading(false));
  }

  useEffect(load, [swap._id]);

  // Re-checks joinability periodically so a session's "Starts at ..." label
  // flips to an active Join button on its own, without a page refresh.
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      await createSession({ swap: swap._id, ...form, duration: Number(form.duration) });
      setForm(emptyForm(skillOptions));
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to schedule session");
    }
  }

  async function handleStatus(id, status) {
    try {
      await updateSessionStatus(id, status);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update session");
    }
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-3">
      <p className="text-sm font-medium text-slate-700">Sessions</p>
      {error && <Alert variant="error">{error}</Alert>}

      {loading && <p className="text-sm text-slate-400">Loading...</p>}

      {!loading && sessions.length === 0 && (
        <p className="text-sm text-slate-400 italic">No sessions scheduled yet.</p>
      )}

      <div className="space-y-2">
        {sessions.map((s) => {
          const expiredButStale = tick >= 0 && s.status === "upcoming" && isExpired(s);
          const joinable = s.status === "upcoming" && isJoinable(s) && !expiredButStale;
          return (
            <div key={s._id} className="flex items-center justify-between text-sm border-b border-slate-100 pb-2">
              <div>
                <span className="font-medium">{s.skill}</span> —{" "}
                {formatSessionDate(s)} at {s.time} IST ({s.duration}min)
                {s.notes && <p className="text-slate-500 text-xs mt-0.5">{s.notes}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusPill status={s.status} />
                {s.status === "upcoming" && !expiredButStale && (
                  <>
                    {joinable ? (
                      <Link
                        to={`/sessions/${s._id}/room`}
                        className="text-xs font-medium text-white bg-slate-900 rounded-md px-2 py-1 hover:bg-slate-700"
                      >
                        Join Meeting
                      </Link>
                    ) : (
                      <span
                        title={`This session unlocks 5 minutes before ${formatIST(getScheduledDateTime(s))}`}
                        className="text-xs text-slate-400 border border-slate-200 rounded-md px-2 py-1 cursor-default"
                      >
                        Starts at {s.time} IST
                      </span>
                    )}
                    <button
                      onClick={() => handleStatus(s._id, "cancelled")}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Cancel
                    </button>
                  </>
                )}
                {expiredButStale && (
                  <span className="text-xs text-amber-700 border border-amber-200 bg-amber-50 rounded-md px-2 py-1 cursor-default">
                    Session window closed
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {swap.status === "active" && (
        <form onSubmit={handleCreate} className="grid grid-cols-2 gap-2 pt-2">
          <select
            value={form.skill}
            onChange={(e) => setForm({ ...form, skill: e.target.value })}
            className="border border-slate-300 rounded-md px-2 py-1.5 text-sm col-span-2"
          >
            {skillOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={form.date}
            min={todayIST()}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
            className="border border-slate-300 rounded-md px-2 py-1.5 text-sm"
          />
          <input
            type="time"
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
            title="Time is in India Standard Time (IST)"
            required
            className="border border-slate-300 rounded-md px-2 py-1.5 text-sm"
          />
          <select
            value={form.duration}
            onChange={(e) => setForm({ ...form, duration: e.target.value })}
            className="border border-slate-300 rounded-md px-2 py-1.5 text-sm"
          >
            {DURATION_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d} minutes
              </option>
            ))}
          </select>
          <input
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Notes (optional)"
            className="border border-slate-300 rounded-md px-2 py-1.5 text-sm"
          />
          <Button type="submit" className="col-span-2">
            Schedule session
          </Button>
        </form>
      )}
    </div>
  );
}

export default SessionPanel;
