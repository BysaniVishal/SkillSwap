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
      <div className="flex-1 overflow-y-auto space-y-2 p-3 bg-slate-50/50">
        {messages.length === 0 && (
          <p className="text-sm text-slate-400 italic">No messages yet.</p>
        )}
        {messages.map((m, i) => {
          const isOwn = m.from === "You";
          return (
            <div key={i} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] text-sm rounded-2xl px-3 py-1.5 ${
                  isOwn ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-700"
                }`}
              >
                {!isOwn && <span className="block text-xs font-medium opacity-70">{m.from}</span>}
                <span>{m.text}</span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2 p-3 border-t border-slate-200 bg-white">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border border-slate-300 rounded-full px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
        <button
          type="submit"
          className="bg-slate-900 text-white text-sm rounded-full px-4 py-1.5 hover:bg-slate-700"
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default Chat;
