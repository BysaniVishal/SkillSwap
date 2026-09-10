import api from "./api";

export function getUser(id) {
  return api.get(`/users/${id}`).then((res) => res.data.user);
}

export function updateProfile(data) {
  return api.put("/users/profile", data).then((res) => res.data.user);
}

export function getSkillsMeta() {
  return api.get("/skills").then((res) => res.data);
}

export function getQuizQuestions(skill) {
  return api.get(`/skill-quiz/${encodeURIComponent(skill)}`).then((res) => res.data);
}

export function submitQuiz({ skill, category, answers }) {
  return api.post("/skill-quiz/submit", { skill, category, answers }).then((res) => res.data);
}

export function removeTeachSkill(skill) {
  return api
    .delete(`/users/skills/teach/${encodeURIComponent(skill)}`)
    .then((res) => res.data.skillsToTeach);
}
