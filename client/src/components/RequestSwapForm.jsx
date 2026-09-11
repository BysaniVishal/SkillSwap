import { useState } from "react";
import { createSwapRequest } from "../services/swapRequests";
import Card from "./ui/Card";
import Alert from "./ui/Alert";
import Button from "./ui/Button";
import { useToast } from "./ui/Toast";

function RequestSwapForm({ me, profile }) {
  const toast = useToast();
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
      toast.success("Swap request sent successfully");
    } catch (err) {
      const message = err.response?.data?.message || "Failed to send request. Please try again.";
      setError(message);
      setStatus("error");
      toast.error(message);
    }
  }

  if (status === "sent") {
    return (
      <Card padding="lg">
        <Alert variant="success">Swap request sent to {profile.name}.</Alert>
      </Card>
    );
  }

  if (!canSend) {
    return (
      <Card padding="lg" className="text-sm text-slate-500">
        {me.skillsToTeach?.length === 0
          ? "Add a skill you can teach to your profile before sending swap requests."
          : `${profile.name} hasn't listed any skills they can teach yet.`}
      </Card>
    );
  }

  return (
    <Card padding="lg" className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-800">Request a swap</h2>

        {error && <Alert variant="error">{error}</Alert>}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            You'll teach {profile.name}
          </label>
          <select
            value={senderTeaches}
            onChange={(e) => setSenderTeaches(e.target.value)}
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
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
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
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
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        <Button type="submit" disabled={status === "sending"}>
          {status === "sending" ? "Sending..." : "Send swap request"}
        </Button>
      </form>
    </Card>
  );
}

export default RequestSwapForm;
