import { useState, useEffect } from "react";

// Cascading Category -> Topic -> Skill selector. Topic exists only to help
// the user narrow down to the right skill — it's not part of what gets
// saved (skillsToTeach/skillsToLearn only ever store {skill, category}),
// so it lives as local UI state here, re-derived whenever `skill` changes
// out from under this component (e.g. switching rows in a list).
function SkillPicker({ taxonomy, category, skill, onChange }) {
  function findTopicFor(cat, sk) {
    const catEntry = taxonomy.find((c) => c.category === cat) || taxonomy[0];
    const topicEntry =
      catEntry.topics.find((t) => t.skills.includes(sk)) || catEntry.topics[0];
    return topicEntry.topic;
  }

  const [topic, setTopic] = useState(() => findTopicFor(category, skill));

  useEffect(() => {
    setTopic(findTopicFor(category, skill));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, skill]);

  const catEntry = taxonomy.find((c) => c.category === category) || taxonomy[0];
  const topicEntry = catEntry.topics.find((t) => t.topic === topic) || catEntry.topics[0];

  function handleCategoryChange(newCategory) {
    const newCat = taxonomy.find((c) => c.category === newCategory);
    const newTopic = newCat.topics[0];
    const newSkill = newTopic.skills[0];
    setTopic(newTopic.topic);
    onChange({ category: newCategory, skill: newSkill });
  }

  function handleTopicChange(newTopic) {
    const newTopicEntry = catEntry.topics.find((t) => t.topic === newTopic);
    const newSkill = newTopicEntry.skills[0];
    setTopic(newTopic);
    onChange({ category, skill: newSkill });
  }

  function handleSkillChange(newSkill) {
    onChange({ category, skill: newSkill });
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      <select
        value={category}
        onChange={(e) => handleCategoryChange(e.target.value)}
        className="border border-slate-300 rounded-md px-2 py-1.5 text-sm"
      >
        {taxonomy.map((c) => (
          <option key={c.category} value={c.category}>
            {c.category}
          </option>
        ))}
      </select>
      <select
        value={topic}
        onChange={(e) => handleTopicChange(e.target.value)}
        className="border border-slate-300 rounded-md px-2 py-1.5 text-sm"
      >
        {catEntry.topics.map((t) => (
          <option key={t.topic} value={t.topic}>
            {t.topic}
          </option>
        ))}
      </select>
      <select
        value={skill}
        onChange={(e) => handleSkillChange(e.target.value)}
        className="border border-slate-300 rounded-md px-2 py-1.5 text-sm"
      >
        {topicEntry.skills.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  );
}

export default SkillPicker;
