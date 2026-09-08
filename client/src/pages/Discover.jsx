import { useEffect, useState } from "react";
import { getMatches } from "../services/matches";
import { getSkillsMeta } from "../services/users";
import UserCard from "../components/UserCard";

function Discover() {
  const [matches, setMatches] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    skill: "",
    category: "",
    minScore: "",
    preference: "",
    sort: "best",
  });

  useEffect(() => {
    getSkillsMeta().then(setMeta);
  }, []);

  useEffect(() => {
    setLoading(true);
    setError("");
    const params = {};
    if (filters.skill) params.skill = filters.skill;
    if (filters.category) params.category = filters.category;
    if (filters.minScore) params.minScore = filters.minScore;
    if (filters.preference) params.preference = filters.preference;
    if (filters.sort) params.sort = filters.sort;

    getMatches(params)
      .then(setMatches)
      .catch((err) => setError(err.response?.data?.message || "Failed to load matches"))
      .finally(() => setLoading(false));
  }, [filters]);

  function updateFilter(field, value) {
    setFilters({ ...filters, [field]: value });
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Discover</h1>
      <p className="text-slate-500 mb-6">Ranked by compatibility with your profile.</p>

      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Skill</label>
          <input
            value={filters.skill}
            onChange={(e) => updateFilter("skill", e.target.value)}
            placeholder="e.g. React"
            className="border border-slate-300 rounded-md px-2 py-1.5 text-sm w-36"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
          <select
            value={filters.category}
            onChange={(e) => updateFilter("category", e.target.value)}
            className="border border-slate-300 rounded-md px-2 py-1.5 text-sm"
          >
            <option value="">Any</option>
            {meta?.categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Min. match %</label>
          <input
            type="number"
            min="0"
            max="100"
            value={filters.minScore}
            onChange={(e) => updateFilter("minScore", e.target.value)}
            placeholder="0"
            className="border border-slate-300 rounded-md px-2 py-1.5 text-sm w-20"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Preference</label>
          <select
            value={filters.preference}
            onChange={(e) => updateFilter("preference", e.target.value)}
            className="border border-slate-300 rounded-md px-2 py-1.5 text-sm"
          >
            <option value="">Any</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Sort by</label>
          <select
            value={filters.sort}
            onChange={(e) => updateFilter("sort", e.target.value)}
            className="border border-slate-300 rounded-md px-2 py-1.5 text-sm"
          >
            <option value="best">Best Match</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>

      {loading && <div className="text-slate-500 py-12 text-center">Loading matches...</div>}
      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}
      {!loading && !error && matches.length === 0 && (
        <div className="text-slate-500 py-12 text-center">
          No matches found. Try widening your filters, or add more skills to your profile.
        </div>
      )}

      <div className="space-y-4">
        {matches.map((m) => (
          <UserCard key={m.user._id} match={m} />
        ))}
      </div>
    </div>
  );
}

export default Discover;
