import api from "./api";

export function getResources() {
  return api.get("/resources").then((res) => res.data.taxonomy);
}
