import { useEffect, useState } from "react";
import { getResources } from "../services/resources";
import Card from "../components/ui/Card";
import Alert from "../components/ui/Alert";
import { useInView } from "../hooks/useInView";

function CategorySection({ cat }) {
  const [ref, inView] = useInView({ threshold: 0.05 });

  return (
    <section ref={ref} className={`reveal ${inView ? "reveal-visible" : ""}`}>
      <h2 className="font-display text-xl font-bold text-slate-900">{cat.category}</h2>
      <p className="text-sm text-slate-600 mt-1 mb-4 max-w-2xl">{cat.guidance}</p>

      <div className="space-y-4">
        {cat.topics.map((t) => (
          <div key={t.topic}>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              {t.topic}
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {t.skills.map((s) => (
                <Card key={s.skill} padding="sm" hover>
                  <p className="font-medium text-sm text-slate-800 mb-2">{s.skill}</p>
                  <ul className="space-y-1">
                    {s.links.map((link) => (
                      <li key={link.url}>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-slate-600 hover:text-slate-900 hover:underline"
                        >
                          {link.label} →
                        </a>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ResourceHub() {
  const [taxonomy, setTaxonomy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getResources()
      .then(setTaxonomy)
      .catch((err) => setError(err.response?.data?.message || "Failed to load resources"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 bg-slate-100 min-h-[calc(100vh-4rem)]">
      <h1 className="font-display text-2xl font-bold text-slate-900 mb-2">Resource Hub</h1>
      <p className="text-sm text-slate-500 mb-6">
        Curated learning links and guidance for every skill on SkillSwap.
      </p>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {loading && <div className="text-slate-500 py-8 text-center">Loading...</div>}

      <div className="space-y-10">
        {taxonomy.map((cat) => (
          <CategorySection key={cat.category} cat={cat} />
        ))}
      </div>
    </div>
  );
}

export default ResourceHub;
