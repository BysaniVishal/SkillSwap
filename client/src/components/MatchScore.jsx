function scoreColor(score) {
  if (score >= 75) return "text-emerald-600";
  if (score >= 45) return "text-amber-600";
  return "text-slate-500";
}

function MatchScore({ score, size = "md" }) {
  const textSize = size === "lg" ? "text-3xl" : "text-xl";
  return (
    <div className="flex flex-col items-center">
      <span className={`font-bold ${textSize} ${scoreColor(score)}`}>{score}%</span>
      <span className="text-xs text-slate-400">Match</span>
    </div>
  );
}

export default MatchScore;
