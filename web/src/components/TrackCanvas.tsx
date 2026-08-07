"use client";

import React, { useRef, useEffect } from "react";

interface DriverFrame {
  Driver: string;
  X: number;
  Y: number;
  Speed: number;
  nGear: number;
  Throttle: number;
}

interface TrackCanvasProps {
  telemetryFrame: DriverFrame[];
  circuitName: string;
}

const DRIVER_COLORS: Record<string, string> = {
  VER: "#1e41ff", // Red Bull Blue
  LEC: "#dc0000", // Ferrari Red
  HAM: "#00d2be", // Mercedes Turquoise
  NOR: "#ff8700", // McLaren Papaya
};

export const TrackCanvas: React.FC<TrackCanvasProps> = ({ telemetryFrame, circuitName }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas frame
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!telemetryFrame || telemetryFrame.length === 0) return;

    // Normalize coordinates to canvas scale (assuming FastF1 X, Y bounds)
    const minX = -10000, maxX = 10000;
    const minY = -10000, maxY = 10000;

    telemetryFrame.forEach((driver) => {
      const cx = ((driver.X - minX) / (maxX - minX)) * canvas.width;
      const cy = canvas.height - ((driver.Y - minY) / (maxY - minY)) * canvas.height;

      // Draw driver dot
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, 2 * Math.PI);
      ctx.fillStyle = DRIVER_COLORS[driver.Driver] || "#a1a1aa";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();

      // Render Driver Code label
      ctx.font = "bold 12px monospace";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(driver.Driver, cx + 12, cy + 4);
    });
  }, [telemetryFrame]);

  return (
    <div className="relative bg-zinc-950 border border-zinc-800 rounded-xl p-4 shadow-2xl">
      <div className="flex justify-between items-center mb-4 font-mono text-xs text-zinc-400">
        <span>CIRCUIT: {circuitName.toUpperCase()}</span>
        <span className="text-emerald-400 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          LIVE REPLAY
        </span>
      </div>
      <canvas
        ref={canvasRef}
        width={700}
        height={500}
        className="w-full h-auto bg-[#0d0d11] rounded-lg border border-zinc-900"
      />
    </div>
  );
};