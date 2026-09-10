import { useInView } from "../../hooks/useInView";

const FEATURES = [
  {
    title: "Explainable matching",
    desc: "Every compatibility score comes with the exact reasons behind it — never a mystery percentage.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75M12 3c-2.5 2-4.5 2-7.5 1.5v6.5c0 5 3.5 8 7.5 9.5 4-1.5 7.5-4.5 7.5-9.5V4.5C16.5 5 14.5 5 12 3Z"
      />
    ),
  },
  {
    title: "Real skill swaps",
    desc: "Trade what you know for what you want to learn. No money, no tutoring fees.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 3.75 20.25 7.5m0 0L16.5 11.25M20.25 7.5H6.75m0 12.75L3 16.5m0 0 3.75-3.75M3 16.5h13.5"
      />
    ),
  },
  {
    title: "Built for students",
    desc: "Track sessions, complete swaps, and build a reputation across your college community.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 19.5v-3a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v3M12 12a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z"
      />
    ),
  },
];

function FeatureCard({ feature, delay }) {
  const [ref, inView] = useInView({ threshold: 0.2 });

  return (
    <div
      ref={ref}
      className={`reveal ${inView ? "reveal-visible" : ""} bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-shadow transition-transform`}
      style={{ transitionDelay: inView ? `${delay}ms` : "0ms" }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-8 h-8 text-indigo-600 mb-3"
      >
        {feature.icon}
      </svg>
      <h3 className="font-display font-semibold text-slate-900 text-lg">{feature.title}</h3>
      <p className="font-body text-sm text-slate-500 mt-1.5">{feature.desc}</p>
    </div>
  );
}

function Features() {
  return (
    <section className="max-w-6xl mx-auto px-4 pb-20">
      <div className="grid sm:grid-cols-3 gap-4">
        {FEATURES.map((f, i) => (
          <FeatureCard key={f.title} feature={f} delay={i * 100} />
        ))}
      </div>
    </section>
  );
}

export default Features;
