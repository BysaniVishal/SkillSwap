import { useEffect, useRef } from "react";

function VideoTile({ stream, label, muted = false, connected = false }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream || null;
    }
  }, [stream]);

  return (
    <div
      className={`relative bg-slate-900 rounded-2xl overflow-hidden aspect-video ring-2 transition-all ${
        connected ? "ring-emerald-400/70" : "ring-slate-700/40"
      }`}
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
      <span className="absolute bottom-2 left-2 text-xs text-white bg-black/50 backdrop-blur px-2 py-0.5 rounded-full">
        {label}
      </span>
    </div>
  );
}

export default VideoTile;
