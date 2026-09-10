import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getQuizQuestions, submitQuiz, removeTeachSkill } from "../services/users";
import SkillPicker from "./SkillPicker";

function TeachSkillManager({ taxonomy }) {
  const { user, setUser } = useAuth();
  const firstCategory = taxonomy[0];
  const firstSkill = firstCategory.topics[0].skills[0];

  const [picker, setPicker] = useState({ category: firstCategory.category, skill: firstSkill });
  const [quiz, setQuiz] = useState(null); // { questions: [{index, question, options}] }
  const [selected, setSelected] = useState({}); // { [poolIndex]: chosenOptionIndex }
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState("");
  const [error, setError] = useState("");
  const [cooldownUntil, setCooldownUntil] = useState(null);

  const teachList = user?.skillsToTeach || [];

  function describeCooldownError(err) {
    const data = err.response?.data;
    if (err.response?.status === 429 && data?.unlocksAt) {
      setCooldownUntil(new Date(data.unlocksAt));
    }
    return data?.message || "Something went wrong.";
  }

  async function handleStartQuiz() {
    setError("");
    setResult(null);
    setCooldownUntil(null);
    setLoading(true);
    try {
      const { questions } = await getQuizQuestions(picker.skill);
      setQuiz({ questions });
      setSelected({});
    } catch (err) {
      setError(describeCooldownError(err));
    } finally {
      setLoading(false);
    }
  }

  function handleSelectAnswer(poolIndex, optionIndex) {
    setSelected((prev) => ({ ...prev, [poolIndex]: optionIndex }));
  }

  async function handleSubmitQuiz(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const answers = quiz.questions.map((q) => ({ index: q.index, selected: selected[q.index] }));
      const res = await submitQuiz({ skill: picker.skill, category: picker.category, answers });
      setResult(res);
      if (res.passed) {
        setUser({ ...user, skillsToTeach: res.skillsToTeach });
        setQuiz(null);
      }
    } catch (err) {
      setError(describeCooldownError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(skill) {
    setRemoving(skill);
    setError("");
    try {
      const skillsToTeach = await removeTeachSkill(skill);
      setUser({ ...user, skillsToTeach });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove skill");
    } finally {
      setRemoving("");
    }
  }

  const allAnswered =
    quiz && quiz.questions.every((q) => selected[q.index] !== undefined);

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-800 mb-1">Skills I can teach</h3>
      <p className="text-xs text-slate-500 mb-3">
        Teaching proficiency is earned by passing a short skill test — not self-declared. This
        keeps match scores honest. Each skill's test can be retaken once a week.
      </p>

      {error && (
        <p className="text-sm text-red-600 mb-2">
          {error}
          {cooldownUntil && (
            <span className="block text-xs text-slate-500 mt-0.5">
              Unlocks {cooldownUntil.toLocaleString()}.
            </span>
          )}
        </p>
      )}

      {teachList.length === 0 && (
        <p className="text-sm text-slate-400 italic mb-3">No verified teaching skills yet.</p>
      )}

      <div className="space-y-2 mb-4">
        {teachList.map((s) => (
          <div
            key={s.skill}
            className="flex items-center justify-between border border-slate-200 rounded-md p-3"
          >
            <div>
              <span className="font-medium text-sm text-slate-800">{s.skill}</span>
              <span className="text-xs text-slate-500 ml-2">{s.category}</span>
              <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {s.proficiency}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setPicker({ category: s.category, skill: s.skill });
                  setResult(null);
                  setQuiz(null);
                  setError("");
                  setCooldownUntil(null);
                }}
                className="text-xs text-slate-600 hover:underline"
              >
                Retake test
              </button>
              <button
                type="button"
                onClick={() => handleRemove(s.skill)}
                disabled={removing === s.skill}
                className="text-xs text-red-600 hover:underline disabled:opacity-50"
              >
                {removing === s.skill ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {!quiz && !result && (
        <div className="border-t border-slate-100 pt-3">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
            Add a new teaching skill
          </p>
          <SkillPicker taxonomy={taxonomy} category={picker.category} skill={picker.skill} onChange={setPicker} />
          <button
            type="button"
            onClick={handleStartQuiz}
            disabled={loading}
            className="mt-2 bg-slate-900 text-white text-sm rounded-md px-3 py-1.5 hover:bg-slate-700 disabled:opacity-50"
          >
            {loading ? "Loading..." : `Take skill test for ${picker.skill}`}
          </button>
        </div>
      )}

      {quiz && (
        <form onSubmit={handleSubmitQuiz} className="border-t border-slate-100 pt-3 space-y-4">
          <p className="text-sm font-medium text-slate-700">Skill test: {picker.skill}</p>
          {quiz.questions.map((q, qi) => (
            <div key={q.index} className="border border-slate-200 rounded-md p-3">
              <p className="text-sm text-slate-800 mb-2">
                {qi + 1}. {q.question}
              </p>
              <div className="space-y-1">
                {q.options.map((opt, oi) => (
                  <label key={oi} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="radio"
                      name={`q${q.index}`}
                      checked={selected[q.index] === oi}
                      onChange={() => handleSelectAnswer(q.index, oi)}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={!allAnswered || loading}
              className="bg-slate-900 text-white text-sm rounded-md px-3 py-1.5 hover:bg-slate-700 disabled:opacity-50"
            >
              {loading ? "Grading..." : "Submit answers"}
            </button>
            <button
              type="button"
              onClick={() => setQuiz(null)}
              className="text-sm text-slate-500 hover:text-slate-900"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {result && (
        <div className="border-t border-slate-100 pt-3 mt-3">
          <div
            className={`rounded-md p-3 text-sm ${
              result.passed
                ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                : "bg-amber-50 border border-amber-200 text-amber-800"
            }`}
          >
            <p className="font-medium">
              {result.correct}/{result.total} correct ({result.percent}%)
            </p>
            {result.passed ? (
              <p>Added {picker.skill} as {result.proficiency}.</p>
            ) : (
              <>
                <p>{result.message}</p>
                {result.resource && (
                  <a
                    href={result.resource}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-1 text-amber-900 underline"
                  >
                    Find tutorials for {picker.skill} →
                  </a>
                )}
                <p className="text-xs text-amber-700 mt-1">You can retake this test in a week.</p>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => setResult(null)}
            className="mt-2 text-xs text-slate-600 hover:underline"
          >
            {result.passed ? "Add another skill" : "Close"}
          </button>
        </div>
      )}
    </div>
  );
}

export default TeachSkillManager;
