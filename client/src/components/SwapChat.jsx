import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getMessages } from "../services/messages";
import { connectSocket } from "../services/socket";
import Alert from "./ui/Alert";

const ERROR_MESSAGES = {
  forbidden: "You're not a participant in this swap.",
  "not-found": "This swap no longer exists.",
  "swap-not-active": "This swap isn't active anymore, so new messages can't be sent.",
  "send-failed": "Your message couldn't be sent. Please try again.",
};

function SwapChat({ swap }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  const isActive = swap.status === "active";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getMessages(swap._id)
      .then((history) => {
        if (!cancelled) setMessages(history);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load chat history.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [swap._id]);

  useEffect(() => {
    const socket = connectSocket();

    function onSwapMessage(msg) {
      if (msg.swap !== swap._id) return;
      setMessages((prev) => [...prev, msg]);
    }
    function onError({ reason }) {
      setError(ERROR_MESSAGES[reason] || "Something went wrong with the chat connection.");
    }

    socket.emit("join-swap-chat", { swapId: swap._id });
    socket.on("swap-message", onSwapMessage);
    socket.on("swap-chat-error", onError);

    return () => {
      socket.emit("leave-swap-chat");
      socket.off("swap-message", onSwapMessage);
      socket.off("swap-chat-error", onError);
    };
  }, [swap._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim() || !isActive) return;

    const socket = connectSocket();
    const optimistic = {
      _id: `local-${Date.now()}`,
      swap: swap._id,
      sender: { _id: user._id, name: user.name },
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };
    socket.emit("send-swap-message", { swapId: swap._id, text: text.trim() });
    setMessages((prev) => [...prev, optimistic]);
    setText("");
  }

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      {error && (
        <Alert variant="warning" className="rounded-none border-x-0 border-t-0">
          {error}
        </Alert>
      )}

      <div className="flex-1 overflow-y-auto space-y-2 p-3">
        {loading && <p className="text-sm text-slate-400 italic">Loading messages...</p>}
        {!loading && messages.length === 0 && (
          <p className="text-sm text-slate-400 italic">No messages yet. Say hello!</p>
        )}
        {messages.map((m) => (
          <div key={m._id} className="text-sm bg-slate-50 rounded-xl px-3 py-1.5">
            <span className="font-medium text-slate-700">
              {m.sender._id === user._id ? "You" : m.sender.name}:{" "}
            </span>
            <span className="text-slate-600">{m.text}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 p-3 border-t border-slate-200">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={isActive ? "Type a message..." : "This swap is no longer active"}
          disabled={!isActive}
          className="flex-1 border border-slate-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-50 disabled:text-slate-400"
        />
        <button
          type="submit"
          disabled={!isActive}
          className="bg-slate-900 text-white text-sm rounded-xl px-3 py-1.5 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-900"
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default SwapChat;
