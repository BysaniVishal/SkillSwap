import { useState } from "react";
import SkillPicker from "./SkillPicker";
import AddSkillModal from "./AddSkillModal";
import Button from "./ui/Button";
import { useToast } from "./ui/Toast";

// Used for "skills I want to learn" only — self-declared proficiency, no
// verification needed there (see TeachSkillManager for the teach side,
// which is quiz-gated instead of a free proficiency dropdown).
function SkillEditor({ title, items, onChange, taxonomy, proficiencyLevels }) {
  const [modalOpen, setModalOpen] = useState(false);
  const toast = useToast();

  function updateRow(index, field, value) {
    const next = items.map((row, i) => (i === index ? { ...row, [field]: value } : row));
    onChange(next);
  }

  function handleAdd(newSkill) {
    onChange([...items, newSkill]);
    setModalOpen(false);
    toast.success("Skill added successfully");
  }

  function removeRow(index) {
    onChange(items.filter((_, i) => i !== index));
    toast.success("Skill removed successfully");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        <Button type="button" variant="secondary" size="sm" onClick={() => setModalOpen(true)}>
          + Add skill
        </Button>
      </div>

      {items.length === 0 && (
        <p className="text-sm text-slate-400 italic">No skills added yet.</p>
      )}

      <div className="space-y-3">
        {items.map((row, index) => (
          <div key={index} className="border border-slate-200 rounded-xl p-3 space-y-2">
            <SkillPicker
              taxonomy={taxonomy}
              category={row.category}
              skill={row.skill}
              onChange={({ category, skill }) => {
                const next = items.map((r, i) => (i === index ? { ...r, category, skill } : r));
                onChange(next);
              }}
            />
            <div className="flex items-center gap-2">
              <select
                value={row.proficiency}
                onChange={(e) => updateRow(index, "proficiency", e.target.value)}
                className="border border-slate-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                {proficiencyLevels.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => removeRow(index)}
                className="text-xs text-red-600 hover:underline ml-auto"
              >
                Remove
              </button>
            </div>
            <input
              placeholder="Goal (optional) — e.g. Build a full-stack portfolio project"
              value={row.goal || ""}
              onChange={(e) => updateRow(index, "goal", e.target.value)}
              className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        ))}
      </div>

      <AddSkillModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        taxonomy={taxonomy}
        proficiencyLevels={proficiencyLevels}
        existingSkills={items}
        onAdd={handleAdd}
      />
    </div>
  );
}

export default SkillEditor;
