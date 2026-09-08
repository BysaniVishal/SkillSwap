import { useState } from "react";
import { createSwapRequest } from "../services/swapRequests";

function RequestSwapForm({ me, profile }) {
  const [senderTeaches, setSenderTeaches] = useState(me.skillsToTeach?.[0]?.skill || "");
  const [senderLearns, setSenderLearns] = useState(profile.skillsToTeach?.[0]?.skill || "");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [error, setError] = useState("");

  const canSend = me.skillsToTeach?.length > 0 && profile.skillsToTeach?.length > 0;

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("sending");
    setError("");
    try {
      await createSwapRequest({
        receiver: profile._id,
        senderTeaches,
        senderLearns,
        message,
      });
      setStatus("sent");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send request");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-emerald-700 text-sm">
        Swap request sent to {profile.name}.
      </div>
    );
  }

  if (!canSend) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 text-sm text-slate-500">
        {me.skillsToTeach?.length === 0
          ? "Add a skill you can teach to your profile before sending swap requests."
          : `${profile.name} hasn't listed any skills they can teach yet.`}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
      <h2 className="text-sm font-semibold text-slate-800">Request a swap</h2>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          You'll teach {profile.name}
        </label>
        <select
          value={senderTeaches}
          onChange={(e) => setSenderTeaches(e.target.value)}
          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
        >
          {me.skillsToTeach.map((s, i) => (
            <option key={i} value={s.skill}>
              {s.skill} ({s.proficiency})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          You'll learn from {profile.name}
        </label>
        <select
          value={senderLearns}
          onChange={(e) => setSenderLearns(e.target.value)}
          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
        >
          {profile.skillsToTeach.map((s, i) => (
            <option key={i} value={s.skill}>
              {s.skill} ({s.proficiency})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Message (optional)
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder={`I can teach you ${senderTeaches} and I'd like to learn ${senderLearns} from you.`}
          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={status === "sending"}
        className="bg-slate-900 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-slate-700 disabled:opacity-50"
      >
        {status === "sending" ? "Sending..." : "Send swap request"}
      </button>
    </form>
  );
}

export default RequestSwapForm;
