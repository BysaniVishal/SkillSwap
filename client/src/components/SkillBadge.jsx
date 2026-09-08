const PROFICIENCY_COLORS = {
  Beginner: "bg-amber-100 text-amber-800",
  Intermediate: "bg-blue-100 text-blue-800",
  Advanced: "bg-emerald-100 text-emerald-800",
};

function SkillBadge({ skill, proficiency }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
        PROFICIENCY_COLORS[proficiency] || "bg-slate-100 text-slate-700"
      }`}
    >
      {skill}
      {proficiency && <span className="opacity-70">· {proficiency}</span>}
    </span>
  );
}

export default SkillBadge;
