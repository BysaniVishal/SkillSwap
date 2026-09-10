import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { sendChatMessage } from "../services/assistant";

const MAX_HISTORY = 20;

function ChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  if (!user) return null;

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages = [...messages, { role: "user", content: text }].slice(-MAX_HISTORY);
    setMessages(nextMessages);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const { reply } = await sendChatMessage(nextMessages);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }].slice(-MAX_HISTORY));
    } catch (err) {
      setError(err.response?.data?.message || "The assistant is unavailable right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <div className="mb-3 w-80 h-[28rem] bg-white border border-slate-200 rounded-2xl shadow-xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-900 text-white">
            <span className="font-display text-sm font-semibold">SkillSwap Assistant</span>
            <button onClick={() => setOpen(false)} className="text-slate-300 hover:text-white text-sm">
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.length === 0 && (
              <p className="text-sm text-slate-400 italic">
                Ask me things like "I want to learn Python" or "how does matching work?"
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`text-sm px-3 py-2 rounded-xl max-w-[85%] ${
                  m.role === "user"
                    ? "bg-slate-900 text-white ml-auto"
                    : "bg-slate-100 text-slate-800"
                }`}
              >
                {m.content}
              </div>
            ))}
            {loading && <p className="text-xs text-slate-400 italic">Thinking...</p>}
            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-2 py-1.5">
                {error}
              </p>
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSend} className="flex gap-2 p-3 border-t border-slate-200">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 border border-slate-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-slate-900 text-white text-sm rounded-xl px-3 py-1.5 hover:bg-slate-700 disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="bg-slate-900 text-white rounded-full w-14 h-14 shadow-lg hover:bg-slate-700 hover:-translate-y-0.5 transition flex items-center justify-center text-2xl"
        title="SkillSwap Assistant"
      >
        {open ? "×" : "💬"}
      </button>
    </div>
  );
}

export default ChatWidget;
