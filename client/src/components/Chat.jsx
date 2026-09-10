import { useEffect, useRef, useState } from "react";
import { getSocket } from "../services/socket";

function Chat() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    const socket = getSocket();
    function onMessage(msg) {
      setMessages((prev) => [...prev, msg]);
    }
    socket.on("chat-message", onMessage);
    return () => socket.off("chat-message", onMessage);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    const socket = getSocket();
    const msg = { text, from: "You", at: new Date().toISOString() };
    socket.emit("chat-message", { text });
    setMessages((prev) => [...prev, msg]);
    setText("");
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-2 p-3">
        {messages.length === 0 && (
          <p className="text-sm text-slate-400 italic">No messages yet.</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className="text-sm bg-slate-50 rounded-xl px-3 py-1.5">
            <span className="font-medium text-slate-700">{m.from}: </span>
            <span className="text-slate-600">{m.text}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2 p-3 border-t border-slate-200">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border border-slate-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
        <button
          type="submit"
          className="bg-slate-900 text-white text-sm rounded-xl px-3 py-1.5 hover:bg-slate-700"
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default Chat;
