import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getSessions, updateSessionStatus } from "../services/sessions";
import { useWebRTC } from "../hooks/useWebRTC";
import VideoTile from "../components/VideoTile";
import Chat from "../components/Chat";
import Whiteboard from "../components/Whiteboard";
import Alert from "../components/ui/Alert";
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
    "session-expired":
      "This session's scheduled window has passed without anyone joining, so it can no longer be started.",
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

function ControlButton({ active, danger, ...rest }) {
  const classes = danger
    ? "bg-red-600 text-white hover:bg-red-700"
    : active
      ? "bg-slate-700 text-white hover:bg-slate-600"
      : "bg-red-500/20 text-red-200 hover:bg-red-500/30";
  return (
    <button
      {...rest}
      className={`text-sm rounded-full px-3 py-1.5 transition disabled:opacity-40 ${classes}`}
    />
  );
}

function SessionRoom() {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [tab, setTab] = useState("chat");
  const [ending, setEnding] = useState(false);
  const [confirmingEnd, setConfirmingEnd] = useState(false);

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
    session && user && session.swap.userA && session.swap.userB
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
    <div className="max-w-6xl mx-auto px-4 py-6 pb-28 bg-slate-100 min-h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-xl font-bold text-slate-900">
            {session ? session.skill : "Session"} {other && `with ${other.name}`}
          </h1>
          <p className="text-sm text-slate-500">{CONNECTION_LABELS[connectionState]}</p>
        </div>
        <button onClick={handleLeave} className="text-sm text-slate-500 hover:text-slate-900">
          ← Back to swaps
        </button>
      </div>

      {joinError && (
        <Alert variant="warning" className="mb-4">
          {joinErrorMessage(joinError)}
        </Alert>
      )}

      {sessionEnded && (
        <Alert variant="info" className="mb-4 flex items-center justify-between">
          <span>This session has ended and was marked completed. Taking you back...</span>
          <Link to="/swaps" className="font-medium underline">
            Back to swaps now
          </Link>
        </Alert>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="relative bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden aspect-video">
            <VideoTile
              stream={remoteStream}
              label={other?.name || "Other participant"}
              connected={connectionState === "connected"}
            />
            <div className="absolute bottom-4 right-4 w-32 sm:w-48 aspect-video">
              <VideoTile
                stream={localStream}
                label={`You${isScreenSharing ? " (sharing screen)" : ""}`}
                muted
                connected
                micOn={micOn}
                pip
              />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden h-[500px] lg:h-full flex flex-col shadow-sm">
          <div className="flex gap-1 p-2 border-b border-slate-200 bg-slate-50">
            <button
              onClick={() => setTab("chat")}
              className={`flex-1 text-sm font-medium py-1.5 rounded-full transition ${tab === "chat" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"}`}
            >
              Chat
            </button>
            <button
              onClick={() => setTab("whiteboard")}
              className={`flex-1 text-sm font-medium py-1.5 rounded-full transition ${tab === "whiteboard" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"}`}
            >
              Whiteboard
            </button>
          </div>
          <div className="flex-1 min-h-0">
            <div className={`h-full ${tab === "chat" ? "" : "hidden"}`}>
              <Chat />
            </div>
            <div className={`h-full ${tab === "whiteboard" ? "" : "hidden"}`}>
              <Whiteboard />
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-800/90 backdrop-blur border border-slate-700 rounded-full px-4 py-2 flex items-center gap-2 shadow-2xl">
        <ControlButton onClick={toggleMic} disabled={sessionEnded} active={micOn}>
          {micOn ? "Mute mic" : "Unmute mic"}
        </ControlButton>
        <ControlButton onClick={toggleCamera} disabled={sessionEnded} active={cameraOn}>
          {cameraOn ? "Turn off camera" : "Turn on camera"}
        </ControlButton>
        <ControlButton onClick={toggleScreenShare} disabled={sessionEnded} active={!isScreenSharing}>
          {isScreenSharing ? "Stop sharing" : "Share screen"}
        </ControlButton>

        <div className="w-px h-5 bg-slate-600 mx-1" />

        <button
          onClick={handleLeave}
          disabled={ending || sessionEnded}
          title="Leave the call — the other participant can stay or continue"
          className="text-sm rounded-full px-3 py-1.5 border border-slate-600 text-slate-200 hover:bg-slate-700 disabled:opacity-50"
        >
          Leave
        </button>
        {!confirmingEnd ? (
          <button
            onClick={() => setConfirmingEnd(true)}
            disabled={ending || sessionEnded}
            title="Ends the session for both of you and marks it completed"
            className="text-sm rounded-full px-3 py-1.5 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            End Session
          </button>
        ) : (
          <div className="flex items-center gap-2 text-sm bg-red-950/60 border border-red-500/40 rounded-full px-3 py-1.5">
            <span className="text-red-200">End for both?</span>
            <button
              onClick={handleEndSession}
              disabled={ending}
              className="text-white bg-red-600 hover:bg-red-700 rounded-full px-2 py-1 disabled:opacity-50"
            >
              {ending ? "Ending..." : "Confirm"}
            </button>
            <button
              onClick={() => setConfirmingEnd(false)}
              disabled={ending}
              className="text-slate-200 hover:text-white rounded-full px-2 py-1 border border-slate-600 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SessionRoom;
