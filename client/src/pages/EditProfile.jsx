import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { updateProfile, getSkillsMeta } from "../services/users";
import SkillEditor from "../components/SkillEditor";
import TeachSkillManager from "../components/TeachSkillManager";
import AvailabilityEditor from "../components/AvailabilityEditor";

function EditProfile() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [meta, setMeta] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getSkillsMeta().then(setMeta);
  }, []);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name,
        bio: user.bio || "",
        skillsToLearn: user.skillsToLearn || [],
        availability: user.availability || [],
        learningPreference: user.learningPreference || "both",
      });
    }
  }, [user]);

  if (!form || !meta) {
    return <div className="max-w-3xl mx-auto px-4 py-8 text-slate-500">Loading...</div>;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setSaving(true);
    try {
      const updated = await updateProfile(form);
      setUser(updated);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Edit Profile</h1>
        <button
          onClick={() => navigate(`/profile/${user._id}`)}
          className="text-sm text-slate-600 hover:text-slate-900"
        >
          View my public profile →
        </button>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
          Profile saved.
        </div>
      )}

      <div className="space-y-8">
        {/* TeachSkillManager renders its own <form> for the quiz, so it
            lives outside the "Save profile" form below to avoid nested
            <form> elements (invalid HTML). Each teach-skill add/remove is
            already its own immediate round trip, not a batch-saved field. */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <TeachSkillManager taxonomy={meta.taxonomy} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                maxLength={500}
                rows={3}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Learning preference
              </label>
              <select
                value={form.learningPreference}
                onChange={(e) => setForm({ ...form, learningPreference: e.target.value })}
                className="border border-slate-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <SkillEditor
              title="Skills I want to learn"
              items={form.skillsToLearn}
              onChange={(items) => setForm({ ...form, skillsToLearn: items })}
              taxonomy={meta.taxonomy}
              proficiencyLevels={meta.proficiencyLevels}
            />
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <AvailabilityEditor
              items={form.availability}
              onChange={(items) => setForm({ ...form, availability: items })}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-slate-900 text-white rounded-md px-5 py-2 text-sm font-medium hover:bg-slate-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save profile"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditProfile;
