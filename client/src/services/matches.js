import api from "./api";

export function getMatches(params) {
  return api.get("/matches", { params }).then((res) => res.data.matches);
}
