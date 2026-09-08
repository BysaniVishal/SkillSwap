function MatchReasons({ reasons, score }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-slate-800 mb-2">Why this match?</h3>
      <ul className="space-y-1.5">
        {reasons.map((r, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
            <span className="text-emerald-600 font-medium tabular-nums shrink-0">
              +{r.points}
            </span>
            <span>{r.label}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-600">Total</span>
        <span className="text-sm font-bold text-slate-900">{score}% Compatible</span>
      </div>
    </div>
  );
}

export default MatchReasons;
