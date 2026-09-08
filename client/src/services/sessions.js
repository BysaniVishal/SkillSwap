import api from "./api";

export function createSession(data) {
  return api.post("/sessions", data).then((res) => res.data.session);
}

export function getSessions(swapId) {
  const params = swapId ? { swap: swapId } : {};
  return api.get("/sessions", { params }).then((res) => res.data.sessions);
}

export function updateSessionStatus(id, status) {
  return api.put(`/sessions/${id}`, { status }).then((res) => res.data.session);
}
