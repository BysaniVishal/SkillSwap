import { useEffect, useState } from "react";
import Modal from "./ui/Modal";
import SkillPicker from "./SkillPicker";
import Button from "./ui/Button";
import Alert from "./ui/Alert";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_FILE_BYTES = 2 * 1024 * 1024; // ~2MB

function firstSelection(taxonomy) {
  const firstCategory = taxonomy[0];
  const firstTopic = firstCategory.topics[0];
  return { category: firstCategory.category, skill: firstTopic.skills[0] };
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Strip the "data:<mime>;base64," prefix — the server stores raw base64.
      const result = reader.result;
      const commaIndex = result.indexOf(",");
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Certificate-based skill verification — labeled distinctly from quiz-passed
// skills (see SkillBadge) rather than treated identically, since a certificate
// upload isn't independently checked the way a quiz answer is.
function UploadCertificateModal({ open, onClose, taxonomy, proficiencyLevels, onUpload, loading }) {
  const [selection, setSelection] = useState(() => firstSelection(taxonomy));
  const [proficiency, setProficiency] = useState(proficiencyLevels[0]);
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setSelection(firstSelection(taxonomy));
      setProficiency(proficiencyLevels[0]);
      setFile(null);
      setError("");
    }
  }, [open, taxonomy, proficiencyLevels]);

  function handleFileChange(e) {
    const f = e.target.files?.[0];
    setError("");
    if (!f) {
      setFile(null);
      return;
    }
    if (!ALLOWED_TYPES.includes(f.type)) {
      setError("File must be a JPEG, PNG, or PDF.");
      setFile(null);
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
      setError("File must be under 2MB.");
      setFile(null);
      return;
    }
    setFile(f);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!file) {
      setError("Please choose a certificate file.");
      return;
    }
    try {
      const fileData = await fileToBase64(file);
      await onUpload({ skill: selection.skill, proficiency, fileData, mimeType: file.type });
    } catch {
      setError("Failed to read file. Please try again.");
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Upload a Certificate">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        <Alert variant="warning">
          Certificate-verified skills are shown with a different badge than quiz-verified skills —
          they're not independently checked the way a quiz answer is.
        </Alert>

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
            Certificate file (JPEG, PNG, or PDF, up to 2MB)
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            onChange={handleFileChange}
            className="w-full text-sm text-slate-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Uploading..." : "Upload Certificate"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default UploadCertificateModal;
