import { useEffect, useState } from "react";
import Modal from "./ui/Modal";
import SkillPicker from "./SkillPicker";
import Button from "./ui/Button";
import Alert from "./ui/Alert";

function firstSelection(taxonomy) {
  const firstCategory = taxonomy[0];
  const firstTopic = firstCategory.topics[0];
  return { category: firstCategory.category, skill: firstTopic.skills[0] };
}

// Used for "skills I want to learn" — self-declared proficiency, no
// verification needed there (see TeachSkillManager for the teach side,
// which is quiz-gated instead of a free proficiency dropdown, and keeps
// its own inline "add a new teaching skill" flow since a multi-question
// quiz doesn't fit a small modal).
function AddSkillModal({ open, onClose, taxonomy, proficiencyLevels, existingSkills, onAdd }) {
  const [selection, setSelection] = useState(() => firstSelection(taxonomy));
  const [proficiency, setProficiency] = useState(proficiencyLevels[0]);
  const [goal, setGoal] = useState("");
  const [error, setError] = useState("");

  // Reset to a clean form every time the modal opens, rather than carrying
  // over whatever was left from the last time it was closed.
  useEffect(() => {
    if (open) {
      setSelection(firstSelection(taxonomy));
      setProficiency(proficiencyLevels[0]);
      setGoal("");
      setError("");
    }
  }, [open, taxonomy, proficiencyLevels]);

  function handleSubmit(e) {
    e.preventDefault();
    // This form is rendered through Modal's createPortal, so its DOM node
    // sits outside EditProfile's outer "Save profile" <form> — but React's
    // synthetic events still bubble through the *React* tree, not the DOM
    // tree. Without stopping it here, submitting this modal also fires the
    // outer form's onSubmit with stale (pre-add) state, immediately
    // overwriting the skill that was just added.
    e.stopPropagation();

    const alreadyAdded = existingSkills.some((s) => s.skill === selection.skill);
    if (alreadyAdded) {
      setError(`${selection.skill} is already in your list.`);
      return;
    }

    onAdd({ ...selection, proficiency, goal: goal.trim() });
  }

  return (
    <Modal open={open} onClose={onClose} title="Add a Skill">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Category / Skill</label>
          <SkillPicker
            taxonomy={taxonomy}
            category={selection.category}
            skill={selection.skill}
            onChange={setSelection}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Proficiency</label>
          <select
            value={proficiency}
            onChange={(e) => setProficiency(e.target.value)}
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            {proficiencyLevels.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Learning Goal (optional)
          </label>
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. Build a full-stack portfolio project"
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Add Skill</Button>
        </div>
      </form>
    </Modal>
  );
}

export default AddSkillModal;
