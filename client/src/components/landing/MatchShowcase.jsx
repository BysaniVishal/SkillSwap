import { useInView } from "../../hooks/useInView";
import { useCountUp } from "../../hooks/useCountUp";

function MatchShowcase() {
  const [ref, inView] = useInView({ threshold: 0.3 });
  const score = useCountUp(92, inView);

  return (
    <section className="max-w-2xl mx-auto px-4 pb-20">
      <div
        ref={ref}
        className={`reveal ${inView ? "reveal-visible" : ""} bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl p-6 shadow-xl`}
      >
        <p className="font-body text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
          Example match
        </p>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display font-semibold text-slate-900 text-lg">Rahul Kumar</p>
            <p className="font-body text-sm text-slate-500">SSN College · Teaches C++, UI/UX</p>
          </div>
          <span className="font-display text-3xl font-bold text-emerald-600">{score}%</span>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-200/70 space-y-1 text-sm text-slate-600 font-body">
          <p>✓ You can teach C++ · They want to learn it</p>
          <p>✓ They can teach UI/UX · You want to learn it</p>
          <p>✓ Your weekend availability overlaps</p>
        </div>
      </div>
    </section>
  );
}

export default MatchShowcase;
