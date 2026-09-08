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
