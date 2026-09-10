import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMySwaps } from "../services/swaps";
import SwapChat from "../components/SwapChat";
import Alert from "../components/ui/Alert";

function SwapChatPage() {
  const { swapId } = useParams();
  const { user } = useAuth();
  const [swap, setSwap] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    getMySwaps().then((all) => {
      const found = all.find((s) => s._id === swapId);
      if (found) setSwap(found);
      else setNotFound(true);
    });
  }, [swapId]);

  const other = swap && user ? (swap.userA._id === user._id ? swap.userB : swap.userA) : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 h-[calc(100vh-4rem)] flex flex-col bg-slate-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-xl font-bold text-slate-900">
            Chat {other && `with ${other.name}`}
          </h1>
          {swap && <p className="text-sm text-slate-500 capitalize">{swap.status} swap</p>}
        </div>
        <Link to="/swaps" className="text-sm text-slate-500 hover:text-slate-900">
          ← Back to swaps
        </Link>
      </div>

      {notFound && <Alert variant="error">Swap not found.</Alert>}

      {swap && (
        <div className="flex-1 min-h-0">
          <SwapChat swap={swap} />
        </div>
      )}
    </div>
  );
}

export default SwapChatPage;
