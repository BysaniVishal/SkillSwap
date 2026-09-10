import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMySwaps, updateSwapStatus } from "../services/swaps";
import SwapDetail from "../components/SwapDetail";

const STATUS_STYLES = {
  active: "bg-emerald-100 text-emerald-800",
  completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-slate-100 text-slate-600",
};

function Swaps() {
  const { user } = useAuth();
  const [swaps, setSwaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">My Swaps</h1>

      {error && (
        <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {loading && <div className="text-slate-500 py-8 text-center">Loading...</div>}

      {!loading && swaps.length === 0 && (
        <div className="text-slate-500 py-8 text-center">
          No swaps yet. Accept a swap request to get started.
        </div>
      )}

      <div className="space-y-3">
        {swaps
          .filter((swap) => swap.userA && swap.userB)
          .map((swap) => {
          const isUserA = swap.userA._id === user._id;
          const other = isUserA ? swap.userB : swap.userA;
          const iTeach = isUserA ? swap.skills.userATeaches : swap.skills.userBTeaches;
          const iLearn = isUserA ? swap.skills.userBTeaches : swap.skills.userATeaches;

          return (
            <div key={swap._id} className="bg-white border border-slate-200 rounded-xl p-4">
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
                  <span
                    className={`inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[swap.status]}`}
                  >
                    {swap.status}
                  </span>
                </div>

                {swap.status !== "cancelled" && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <Link
                      to={`/swaps/${swap._id}/chat`}
                      className="text-center border border-slate-300 text-sm rounded-md px-3 py-1.5 hover:bg-slate-50"
                    >
                      Chat
                    </Link>
                    {swap.status === "active" && (
                      <>
                        <button
                          onClick={() => handleStatus(swap._id, "completed")}
                          className="bg-slate-900 text-white text-sm rounded-md px-3 py-1.5 hover:bg-slate-700"
                        >
                          Mark Completed
                        </button>
                        <button
                          onClick={() => handleStatus(swap._id, "cancelled")}
                          className="border border-slate-300 text-sm rounded-md px-3 py-1.5 hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {swap.status !== "cancelled" && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <SwapDetail swap={swap} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Swaps;
