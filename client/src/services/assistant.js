import api from "./api";

export function sendChatMessage(messages) {
  return api.post("/assistant/chat", { messages }).then((res) => res.data);
}
