import api from "./api";

export function createSwapRequest(data) {
  return api.post("/swap-requests", data).then((res) => res.data);
}

export function getMyRequests() {
  return api.get("/swap-requests").then((res) => res.data);
}

export function updateRequestStatus(id, status) {
  return api.put(`/swap-requests/${id}`, { status }).then((res) => res.data);
}
