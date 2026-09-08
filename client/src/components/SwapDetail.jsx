import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getReviews } from "../services/reviews";
import SessionPanel from "./SessionPanel";
import ReviewForm from "./ReviewForm";
import ReviewCard from "./ReviewCard";

function SwapDetail({ swap }) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [reviews, setReviews] = useState(null);

  function loadReviews() {
    getReviews({ swap: swap._id }).then(setReviews);
  }

  useEffect(() => {
    if (expanded && swap.status === "completed" && reviews === null) {
      loadReviews();
    }
  }, [expanded]);

  const myReview = reviews?.find((r) => r.reviewer._id === user._id);
  const theirReview = reviews?.find((r) => r.reviewer._id !== user._id);

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-sm font-medium text-slate-700 hover:text-slate-900"
      >
        {expanded ? "Hide details ▲" : "Sessions & reviews ▼"}
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          <SessionPanel swap={swap} />

          {swap.status === "completed" && (
            <div className="space-y-2">
              {theirReview && <ReviewCard review={theirReview} />}
              {myReview ? (
                <ReviewCard review={myReview} />
              ) : reviews !== null ? (
                <ReviewForm swapId={swap._id} onSubmitted={loadReviews} />
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SwapDetail;
