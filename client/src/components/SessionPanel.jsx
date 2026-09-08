import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createSession, getSessions, updateSessionStatus } from "../services/sessions";

const STATUS_STYLES = {
  upcoming: "bg-blue-100 text-blue-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-slate-100 text-slate-600",
};

function emptyForm(skillOptions) {
  return { skill: skillOptions[0] || "", date: "", time: "18:00", duration: 60, notes: "" };
}

function SessionPanel({ swap }) {
  const skillOptions = [swap.skills.userATeaches, swap.skills.userBTeaches];
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm(skillOptions));
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    getSessions(swap._id)
      .then(setSessions)
      .catch((err) => setError(err.response?.data?.message || "Failed to load sessions"))
      .finally(() => setLoading(false));
  }

  useEffect(load, [swap._id]);

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
    <div className="border border-slate-200 rounded-lg p-3 space-y-3">
      <p className="text-sm font-medium text-slate-700">Sessions</p>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading && <p className="text-sm text-slate-400">Loading...</p>}

      {!loading && sessions.length === 0 && (
        <p className="text-sm text-slate-400 italic">No sessions scheduled yet.</p>
      )}

      <div className="space-y-2">
        {sessions.map((s) => (
          <div key={s._id} className="flex items-center justify-between text-sm border-b border-slate-100 pb-2">
            <div>
              <span className="font-medium">{s.skill}</span> —{" "}
              {new Date(s.date).toLocaleDateString()} at {s.time} ({s.duration}min)
              {s.notes && <p className="text-slate-500 text-xs mt-0.5">{s.notes}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[s.status]}`}>
                {s.status}
              </span>
              {s.status === "upcoming" && (
                <>
                  <Link
                    to={`/sessions/${s._id}/room`}
                    className="text-xs font-medium text-white bg-slate-900 rounded-md px-2 py-1 hover:bg-slate-700"
                  >
                    Join Meeting
                  </Link>
                  <button
                    onClick={() => handleStatus(s._id, "cancelled")}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
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
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
            className="border border-slate-300 rounded-md px-2 py-1.5 text-sm"
          />
          <input
            type="time"
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
            required
            className="border border-slate-300 rounded-md px-2 py-1.5 text-sm"
          />
          <input
            type="number"
            min="15"
            step="15"
            value={form.duration}
            onChange={(e) => setForm({ ...form, duration: e.target.value })}
            placeholder="Duration (min)"
            className="border border-slate-300 rounded-md px-2 py-1.5 text-sm"
          />
          <input
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Notes (optional)"
            className="border border-slate-300 rounded-md px-2 py-1.5 text-sm"
          />
          <button
            type="submit"
            className="col-span-2 bg-slate-900 text-white text-sm rounded-md px-3 py-1.5 hover:bg-slate-700"
          >
            Schedule session
          </button>
        </form>
      )}
    </div>
  );
}

export default SessionPanel;
