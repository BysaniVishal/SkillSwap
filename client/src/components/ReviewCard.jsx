function Stars({ rating }) {
  return (
    <span className="text-amber-500 text-sm">
      {"★".repeat(rating)}
      <span className="text-slate-300">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

function ReviewCard({ review }) {
  return (
    <div className="border border-slate-200 rounded-xl p-3 bg-white">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-800">{review.reviewer?.name}</span>
        <Stars rating={review.rating} />
      </div>
      {review.comment && <p className="text-sm text-slate-600 mt-1">{review.comment}</p>}
    </div>
  );
}

export default ReviewCard;
