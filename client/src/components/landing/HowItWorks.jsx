import { useInView } from "../../hooks/useInView";

const STEPS = [
  { step: "01", title: "Sign up", desc: "List the skills you can teach and what you want to learn." },
  { step: "02", title: "Get matched", desc: "See explainable compatibility scores with students nearby." },
  { step: "03", title: "Swap skills", desc: "Schedule a session, chat, and trade knowledge — no fees." },
];

function HowItWorks() {
  const [ref, inView] = useInView({ threshold: 0.2 });

  return (
    <section className="max-w-6xl mx-auto px-4 pb-20">
      <div ref={ref} className={`reveal ${inView ? "reveal-visible" : ""}`}>
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-10">
          How it works
        </h2>
        <div className="grid sm:grid-cols-3 gap-8">
          {STEPS.map((s) => (
            <div key={s.step} className="text-center">
              <span className="font-display text-4xl font-bold text-indigo-200">{s.step}</span>
              <h3 className="font-display font-semibold text-slate-900 text-lg mt-2">{s.title}</h3>
              <p className="font-body text-sm text-slate-500 mt-1.5 max-w-xs mx-auto">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
