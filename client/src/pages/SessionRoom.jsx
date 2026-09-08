import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getSessions } from "../services/sessions";
import { useWebRTC } from "../hooks/useWebRTC";
import VideoTile from "../components/VideoTile";
import Chat from "../components/Chat";
import Whiteboard from "../components/Whiteboard";

const JOIN_ERROR_MESSAGES = {
  forbidden: "You're not a participant in this session.",
  "room-full": "This session's room already has two participants.",
  "session-not-active": "This session is no longer upcoming.",
  "not-found": "Session not found.",
  "media-denied": "Camera/mic access was denied. You can still use chat and the whiteboard.",
};

const CONNECTION_LABELS = {
  new: "Waiting for the other participant to join...",
  connecting: "Connecting...",
  connected: "Connected",
  disconnected: "Connection lost",
  failed:
    "Couldn't establish a direct connection — this can happen on some networks. A TURN relay server would fix this but isn't included in this project.",
};

function SessionRoom() {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const [session, setSession] = useState(null);
  const [tab, setTab] = useState("chat");

  const {
    localStream,
    remoteStream,
    connectionState,
    isScreenSharing,
    micOn,
    cameraOn,
    joinError,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
  } = useWebRTC(sessionId);

  useEffect(() => {
    getSessions().then((all) => {
      const found = all.find((s) => s._id === sessionId);
      setSession(found || null);
    });
  }, [sessionId]);

  const other =
    session && user
      ? session.swap.userA._id === user._id
        ? session.swap.userB
        : session.swap.userA
      : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {session ? session.skill : "Session"} {other && `with ${other.name}`}
          </h1>
          <p className="text-sm text-slate-500">{CONNECTION_LABELS[connectionState]}</p>
        </div>
        <Link to="/swaps" className="text-sm text-slate-500 hover:text-slate-900">
          ← Back to swaps
        </Link>
      </div>

      {joinError && (
        <div className="mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          {JOIN_ERROR_MESSAGES[joinError] || "Something went wrong joining this room."}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <VideoTile stream={localStream} label={`You${isScreenSharing ? " (sharing screen)" : ""}`} muted />
            <VideoTile stream={remoteStream} label={other?.name || "Other participant"} />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleMic}
              className={`text-sm rounded-md px-3 py-1.5 border ${micOn ? "border-slate-300 hover:bg-slate-50" : "bg-red-50 border-red-200 text-red-700"}`}
            >
              {micOn ? "Mute mic" : "Unmute mic"}
            </button>
            <button
              onClick={toggleCamera}
              className={`text-sm rounded-md px-3 py-1.5 border ${cameraOn ? "border-slate-300 hover:bg-slate-50" : "bg-red-50 border-red-200 text-red-700"}`}
            >
              {cameraOn ? "Turn off camera" : "Turn on camera"}
            </button>
            <button
              onClick={toggleScreenShare}
              className={`text-sm rounded-md px-3 py-1.5 border ${isScreenSharing ? "bg-slate-900 text-white border-slate-900" : "border-slate-300 hover:bg-slate-50"}`}
            >
              {isScreenSharing ? "Stop sharing" : "Share screen"}
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden h-[500px] flex flex-col">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setTab("chat")}
              className={`flex-1 text-sm font-medium py-2 ${tab === "chat" ? "text-slate-900 border-b-2 border-slate-900" : "text-slate-500"}`}
            >
              Chat
            </button>
            <button
              onClick={() => setTab("whiteboard")}
              className={`flex-1 text-sm font-medium py-2 ${tab === "whiteboard" ? "text-slate-900 border-b-2 border-slate-900" : "text-slate-500"}`}
            >
              Whiteboard
            </button>
          </div>
          <div className="flex-1 min-h-0">
            {tab === "chat" ? <Chat /> : <Whiteboard />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SessionRoom;
