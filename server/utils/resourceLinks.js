// Generates search-URL-based resource links for a skill. These are always
// valid (never a guessed/hardcoded specific article or course URL) since
// they're just search queries built from the skill name at request time.
function getResourceLinks(skill) {
  const tutorialQuery = encodeURIComponent(`${skill} tutorial for beginners`);
  const docsQuery = encodeURIComponent(`${skill} documentation guide`);
  const practiceQuery = encodeURIComponent(`${skill} practice exercises`);
  return [
    {
      label: `${skill} video tutorials`,
      url: `https://www.youtube.com/results?search_query=${tutorialQuery}`,
    },
    {
      label: `${skill} docs & guides`,
      url: `https://www.google.com/search?q=${docsQuery}`,
    },
    {
      label: `${skill} practice exercises`,
      url: `https://www.google.com/search?q=${practiceQuery}`,
    },
  ];
}

module.exports = { getResourceLinks };
