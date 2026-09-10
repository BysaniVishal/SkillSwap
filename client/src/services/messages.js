import api from "./api";

export function getMessages(swapId) {
  return api.get("/messages", { params: { swap: swapId } }).then((res) => res.data.messages);
}
