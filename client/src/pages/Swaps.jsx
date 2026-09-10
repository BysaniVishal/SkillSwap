import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMySwaps, updateSwapStatus } from "../services/swaps";
import SwapDetail from "../components/SwapDetail";
import Card from "../components/ui/Card";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import StatusPill from "../components/ui/StatusPill";
import { useInView } from "../hooks/useInView";

function Swaps() {
  const { user } = useAuth();
  const [swaps, setSwaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [listRef, listInView] = useInView({ threshold: 0.05 });

  function toggleExpanded(id) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openForScheduling(id) {
    setExpandedIds((prev) => new Set(prev).add(id));
  }

  function load() {
    setLoading(true);
    getMySwaps()
      .then(setSwaps)
      .catch((err) => setError(err.response?.data?.message || "Failed to load swaps"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleStatus(id, status) {
    try {
      await updateSwapStatus(id, status);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update swap");
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 bg-slate-100 min-h-[calc(100vh-4rem)]">
      <h1 className="font-display text-2xl font-bold text-slate-900 mb-6">My Swaps</h1>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {loading && <div className="text-slate-500 py-8 text-center">Loading...</div>}

      {!loading && swaps.length === 0 && (
        <div className="text-slate-500 py-8 text-center">
          No swaps yet. Accept a swap request to get started.
        </div>
      )}

      <div ref={listRef} className={`reveal ${listInView ? "reveal-visible" : ""} space-y-3`}>
        {swaps
          .filter((swap) => swap.userA && swap.userB)
          .map((swap) => {
          const isUserA = swap.userA._id === user._id;
          const other = isUserA ? swap.userB : swap.userA;
          const iTeach = isUserA ? swap.skills.userATeaches : swap.skills.userBTeaches;
          const iLearn = isUserA ? swap.skills.userBTeaches : swap.skills.userATeaches;

          return (
            <Card key={swap._id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Link
                    to={`/profile/${other._id}`}
                    className="font-medium text-slate-900 hover:underline"
                  >
                    {other.name}
                  </Link>
                  <p className="text-sm text-slate-500">{other.college}</p>
                  <p className="text-sm text-slate-700 mt-2">
                    You teach <strong>{iTeach}</strong> · You learn <strong>{iLearn}</strong>
                  </p>
                  <div className="mt-2">
                    <StatusPill status={swap.status} />
                  </div>
                </div>

                {swap.status !== "cancelled" && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button variant="secondary" size="sm" to={`/swaps/${swap._id}/chat`}>
                      Chat
                    </Button>
                    {swap.status === "active" && (
                      <>
                        <Button size="sm" onClick={() => openForScheduling(swap._id)}>
                          Schedule Session
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleStatus(swap._id, "completed")}
                        >
                          Mark Completed
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleStatus(swap._id, "cancelled")}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {swap.status !== "cancelled" && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <SwapDetail
                    swap={swap}
                    expanded={expandedIds.has(swap._id)}
                    onToggle={() => toggleExpanded(swap._id)}
                  />
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default Swaps;
