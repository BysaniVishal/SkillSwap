import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getSessions, updateSessionStatus } from "../services/sessions";
import { useWebRTC } from "../hooks/useWebRTC";
import VideoTile from "../components/VideoTile";
import Chat from "../components/Chat";
import Whiteboard from "../components/Whiteboard";
import { formatIST } from "../utils/sessionTime";

function joinErrorMessage(error) {
  if (!error) return null;
  if (error.reason === "too-early") {
    const when = formatIST(new Date(error.scheduledAt));
    return `This session hasn't started yet — it's scheduled for ${when}. You can join up to 5 minutes early.`;
  }
  const messages = {
    forbidden: "You're not a participant in this session.",
    "room-full": "This session's room already has two participants.",
    "session-not-active": "This session is no longer upcoming.",
    "not-found": "Session not found.",
    "media-denied": "Camera/mic access was denied. You can still use chat and the whiteboard.",
  };
  return messages[error.reason] || "Something went wrong joining this room.";
}

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
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [tab, setTab] = useState("chat");
  const [ending, setEnding] = useState(false);

  const {
    localStream,
    remoteStream,
    connectionState,
    isScreenSharing,
    micOn,
    cameraOn,
    joinError,
    sessionEnded,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    notifySessionEnded,
    leaveRoom,
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

  // If the other participant ends the session while we're still here, give
  // them a moment to read the banner, then take them back automatically.
  useEffect(() => {
    if (!sessionEnded) return;
    const timer = setTimeout(() => navigate("/swaps"), 2500);
    return () => clearTimeout(timer);
  }, [sessionEnded, navigate]);

  function handleLeave() {
    // Just leaves this participant's side — the other participant stays in
    // the room and can keep going, or wait. Doesn't mark the session done.
    // Stop the camera/mic synchronously, right now, rather than waiting on
    // the unmount cleanup to eventually run.
    leaveRoom();
    navigate("/swaps");
  }

  async function handleEndSession() {
    setEnding(true);
    try {
      await updateSessionStatus(sessionId, "completed");
      notifySessionEnded();
    } catch {
      // even if the REST call fails (e.g. already handled by the other
      // side), still let this participant leave the room
    } finally {
      leaveRoom();
      navigate("/swaps");
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {session ? session.skill : "Session"} {other && `with ${other.name}`}
          </h1>
          <p className="text-sm text-slate-500">{CONNECTION_LABELS[connectionState]}</p>
        </div>
        <button onClick={handleLeave} className="text-sm text-slate-500 hover:text-slate-900">
          ← Back to swaps
        </button>
      </div>

      {joinError && (
        <div className="mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          {joinErrorMessage(joinError)}
        </div>
      )}

      {sessionEnded && (
        <div className="mb-4 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-md px-3 py-2 flex items-center justify-between">
          <span>This session has ended and was marked completed. Taking you back...</span>
          <Link to="/swaps" className="font-medium underline">
            Back to swaps now
          </Link>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <VideoTile stream={localStream} label={`You${isScreenSharing ? " (sharing screen)" : ""}`} muted />
            <VideoTile stream={remoteStream} label={other?.name || "Other participant"} />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={toggleMic}
              disabled={sessionEnded}
              className={`text-sm rounded-md px-3 py-1.5 border disabled:opacity-40 ${micOn ? "border-slate-300 hover:bg-slate-50" : "bg-red-50 border-red-200 text-red-700"}`}
            >
              {micOn ? "Mute mic" : "Unmute mic"}
            </button>
            <button
              onClick={toggleCamera}
              disabled={sessionEnded}
              className={`text-sm rounded-md px-3 py-1.5 border disabled:opacity-40 ${cameraOn ? "border-slate-300 hover:bg-slate-50" : "bg-red-50 border-red-200 text-red-700"}`}
            >
              {cameraOn ? "Turn off camera" : "Turn on camera"}
            </button>
            <button
              onClick={toggleScreenShare}
              disabled={sessionEnded}
              className={`text-sm rounded-md px-3 py-1.5 border disabled:opacity-40 ${isScreenSharing ? "bg-slate-900 text-white border-slate-900" : "border-slate-300 hover:bg-slate-50"}`}
            >
              {isScreenSharing ? "Stop sharing" : "Share screen"}
            </button>

            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={handleLeave}
                disabled={ending || sessionEnded}
                title="Leave the call — the other participant can stay or continue"
                className="text-sm rounded-md px-3 py-1.5 border border-slate-300 hover:bg-slate-50 disabled:opacity-50"
              >
                Leave Session
              </button>
              <button
                onClick={handleEndSession}
                disabled={ending || sessionEnded}
                title="Ends the session for both of you and marks it completed"
                className="text-sm rounded-md px-3 py-1.5 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {ending ? "Ending..." : "End Session"}
              </button>
            </div>
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
