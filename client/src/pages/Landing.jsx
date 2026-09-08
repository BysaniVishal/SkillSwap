import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const FEATURES = [
  {
    title: "Explainable matching",
    desc: "Every compatibility score comes with the exact reasons behind it — never a mystery percentage.",
  },
  {
    title: "Real skill swaps",
    desc: "Trade what you know for what you want to learn. No money, no tutoring fees.",
  },
  {
    title: "Built for students",
    desc: "Track sessions, complete swaps, and build a reputation across your college community.",
  },
];

function Landing() {
  const { user } = useAuth();

  return (
    <div className="bg-slate-50 min-h-screen">
      <section className="max-w-4xl mx-auto px-4 pt-20 pb-16 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">
          Learn what you want.
          <br />
          Teach what you know.
        </h1>
        <p className="mt-5 text-lg text-slate-600 max-w-xl mx-auto">
          SkillSwap matches students who can teach each other — no tutoring fees, just a fair
          trade of skills.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          {user ? (
            <Link
              to="/discover"
              className="bg-slate-900 text-white rounded-md px-6 py-3 text-sm font-medium hover:bg-slate-700"
            >
              Discover matches
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="bg-slate-900 text-white rounded-md px-6 py-3 text-sm font-medium hover:bg-slate-700"
              >
                Get started
              </Link>
              <Link
                to="/login"
                className="border border-slate-300 rounded-md px-6 py-3 text-sm font-medium hover:bg-white"
              >
                Log in
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 pb-20">
        <div className="grid sm:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="font-semibold text-slate-900">{f.title}</h3>
              <p className="text-sm text-slate-500 mt-1.5">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-2xl mx-auto px-4 pb-20">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
            Example match
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-900">Rahul Kumar</p>
              <p className="text-sm text-slate-500">SSN College · Teaches C++, UI/UX</p>
            </div>
            <span className="text-2xl font-bold text-emerald-600">92%</span>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-1 text-sm text-slate-600">
            <p>✓ You can teach C++ · They want to learn it</p>
            <p>✓ They can teach UI/UX · You want to learn it</p>
            <p>✓ Your weekend availability overlaps</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Landing;
