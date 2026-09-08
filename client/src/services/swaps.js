import api from "./api";

export function getMySwaps(status) {
  const params = status ? { status } : {};
  return api.get("/swaps", { params }).then((res) => res.data.swaps);
}

export function updateSwapStatus(id, status) {
  return api.put(`/swaps/${id}`, { status }).then((res) => res.data.swap);
}
