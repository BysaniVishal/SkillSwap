import { useState } from "react";
import { createReview } from "../services/reviews";
import Button from "./ui/Button";
import Alert from "./ui/Alert";

function ReviewForm({ swapId, onSubmitted }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await createReview({ swap: swapId, rating, comment });
      onSubmitted();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit review");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border border-slate-200 rounded-xl p-3 space-y-2 bg-white">
      <p className="text-sm font-medium text-slate-700">Leave a review</p>
      {error && <Alert variant="error">{error}</Alert>}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className={`text-xl ${n <= rating ? "text-amber-500" : "text-slate-300"}`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        maxLength={500}
        placeholder="How was the swap?"
        className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
      />
      <Button type="submit" size="sm" disabled={saving}>
        {saving ? "Submitting..." : "Submit review"}
      </Button>
    </form>
  );
}

export default ReviewForm;
