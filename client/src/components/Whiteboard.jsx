import { useEffect, useRef } from "react";
import { getSocket } from "../services/socket";

const COLOR = "#0f172a";

function Whiteboard() {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef(null);

  function drawSegment(ctx, x0, y0, x1, y1, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const socket = getSocket();

    function onDraw({ x0, y0, x1, y1, color }) {
      drawSegment(ctx, x0 * canvas.width, y0 * canvas.height, x1 * canvas.width, y1 * canvas.height, color);
    }
    function onClear() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    socket.on("draw", onDraw);
    socket.on("clear-board", onClear);
    return () => {
      socket.off("draw", onDraw);
      socket.off("clear-board", onClear);
    };
  }, []);

  function getPoint(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  }

  function handlePointerDown(e) {
    drawingRef.current = true;
    lastPointRef.current = getPoint(e);
  }

  function handlePointerMove(e) {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const point = getPoint(e);
    const last = lastPointRef.current;

    drawSegment(ctx, last.x * canvas.width, last.y * canvas.height, point.x * canvas.width, point.y * canvas.height, COLOR);
    getSocket().emit("draw", { x0: last.x, y0: last.y, x1: point.x, y1: point.y, color: COLOR });

    lastPointRef.current = point;
  }

  function handlePointerUp() {
    drawingRef.current = false;
  }

  function handleClear() {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    getSocket().emit("clear-board");
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-2 border-b border-slate-200 bg-slate-50">
        <span className="text-xs text-slate-400 pl-1">Whiteboard</span>
        <button
          onClick={handleClear}
          className="text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-300 rounded-full px-3 py-1 transition"
        >
          Clear board
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="flex-1 w-full bg-white touch-none cursor-crosshair"
      />
    </div>
  );
}

export default Whiteboard;
