import { useEffect, useRef } from "react";

// micOn is unrelated to the `muted` prop below — `muted` is the native
// <video muted> attribute (prevents hearing your own mic echo locally),
// while micOn reflects the actual mic on/off state shown to the room.
function VideoTile({ stream, label, muted = false, connected = false, micOn, pip = false }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream || null;
    }
  }, [stream]);

  return (
    <div
      className={`relative w-full h-full bg-slate-900 overflow-hidden ring-2 transition-all ${
        connected ? "ring-emerald-400/70" : "ring-slate-700/40"
      } ${pip ? "rounded-xl shadow-2xl" : "rounded-2xl"}`}
    >
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
          Waiting...
        </div>
      )}
      <span className="absolute bottom-2 left-2 flex items-center gap-1 text-xs text-white bg-black/50 backdrop-blur px-2 py-0.5 rounded-full">
        {micOn === false && <span title="Mic is off">🔇</span>}
        {label}
      </span>
    </div>
  );
}

export default VideoTile;
