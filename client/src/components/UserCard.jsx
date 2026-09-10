import { useState } from "react";
import MatchScore from "./MatchScore";
import MatchReasons from "./MatchReasons";
import SkillBadge from "./SkillBadge";
import Card from "./ui/Card";
import Button from "./ui/Button";

function UserCard({ match }) {
  const [expanded, setExpanded] = useState(false);
  const { user, score, reasons } = match;

  return (
    <Card hover>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-lg font-semibold text-slate-900 truncate">{user.name}</h3>
          <p className="text-sm text-slate-500">{user.college}</p>

          <div className="mt-3">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">
              Teaches
            </p>
            <div className="flex flex-wrap gap-1.5">
              {user.skillsToTeach.length ? (
                user.skillsToTeach.map((s, i) => (
                  <SkillBadge key={i} skill={s.skill} proficiency={s.proficiency} />
                ))
              ) : (
                <span className="text-sm text-slate-400 italic">Nothing listed yet</span>
              )}
            </div>
          </div>

          <div className="mt-2">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">
              Wants to learn
            </p>
            <div className="flex flex-wrap gap-1.5">
              {user.skillsToLearn.length ? (
                user.skillsToLearn.map((s, i) => (
                  <SkillBadge key={i} skill={s.skill} proficiency={s.proficiency} />
                ))
              ) : (
                <span className="text-sm text-slate-400 italic">Nothing listed yet</span>
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3 text-sm text-slate-500">
            <span>
              ⭐ {user.rating?.average?.toFixed(1) ?? "0.0"} ({user.rating?.count ?? 0})
            </span>
            <span>{user.completedSwaps ?? 0} swaps completed</span>
          </div>
        </div>

        <MatchScore score={score} />
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-4 text-sm font-medium text-slate-700 hover:text-slate-900"
      >
        {expanded ? "Hide match breakdown ▲" : "Why this match? ▼"}
      </button>

      {expanded && (
        <div className="mt-3">
          <MatchReasons reasons={reasons} score={score} />
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <Button variant="secondary" to={`/profile/${user._id}`} className="flex-1">
          View Profile
        </Button>
        <Button to={`/profile/${user._id}`} className="flex-1">
          Request Swap
        </Button>
      </div>
    </Card>
  );
}

export default UserCard;
