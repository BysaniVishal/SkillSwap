import { useEffect, useState } from "react";
import { getMyRequests, updateRequestStatus } from "../services/swapRequests";
import RequestCard from "../components/RequestCard";
import Alert from "../components/ui/Alert";
import { useInView } from "../hooks/useInView";

function Requests() {
  const [data, setData] = useState({ sent: [], received: [] });
  const [tab, setTab] = useState("received");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [listRef, listInView] = useInView({ threshold: 0.05 });

  function load() {
    setLoading(true);
    getMyRequests()
      .then(setData)
      .catch((err) => setError(err.response?.data?.message || "Failed to load requests"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleAction(id, status) {
    try {
      await updateRequestStatus(id, status);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update request");
    }
  }

  const list = tab === "sent" ? data.sent : data.received;
  const pendingReceivedCount = data.received.filter((r) => r.status === "pending").length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 bg-slate-100 min-h-[calc(100vh-4rem)]">
      <h1 className="font-display text-2xl font-bold text-slate-900 mb-6">Swap Requests</h1>

      <div className="flex gap-1 mb-6 border-b border-slate-200">
        <button
          onClick={() => setTab("received")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
            tab === "received"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Received {pendingReceivedCount > 0 && `(${pendingReceivedCount})`}
        </button>
        <button
          onClick={() => setTab("sent")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
            tab === "sent"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Sent
        </button>
      </div>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {loading && <div className="text-slate-500 py-8 text-center">Loading...</div>}

      {!loading && list.length === 0 && (
        <div className="text-slate-500 py-8 text-center">
          {tab === "sent" ? "You haven't sent any requests yet." : "No requests received yet."}
        </div>
      )}

      <div ref={listRef} className={`reveal ${listInView ? "reveal-visible" : ""} space-y-3`}>
        {list.map((r) => (
          <RequestCard key={r._id} request={r} role={tab} onAction={handleAction} />
        ))}
      </div>
    </div>
  );
}

export default Requests;
