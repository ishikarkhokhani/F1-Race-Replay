"use client";

import React, { useRef, useEffect } from "react";

interface Point {
  X: number;
  Y: number;
}

interface DriverFrame {
  Driver: string;
  X: number;
  Y: number;
  Speed: number;
  nGear: number;
  Throttle: number;
}

interface TrackCanvasProps {
  circuitLayout: Point[];
  telemetryFrame: DriverFrame[];
  circuitName: string;
}

const DRIVER_COLORS: Record<string, string> = {
  VER: "#1e41ff", // Red Bull Blue
  LEC: "#dc0000", // Ferrari Red
  HAM: "#00d2be", // Mercedes Turquoise
  NOR: "#ff8700", // McLaren Papaya
};

export const TrackCanvas: React.FC<TrackCanvasProps> = ({
  circuitLayout,
  telemetryFrame,
  circuitName,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear background
    ctx.fillStyle = "#0d0d11";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!circuitLayout || circuitLayout.length === 0) return;

    // 1. Calculate global track scale from static circuit bounds
    const xs = circuitLayout.map((p) => p.X);
    const ys = circuitLayout.map((p) => p.Y);
    const minX = Math.min(...xs) - 1500;
    const maxX = Math.max(...xs) + 1500;
    const minY = Math.min(...ys) - 1500;
    const maxY = Math.max(...ys) + 1500;

    const scaleX = (x: number) =>
      ((x - minX) / (maxX - minX)) * (canvas.width - 80) + 40;
    const scaleY = (y: number) =>
      canvas.height -
      (((y - minY) / (maxY - minY)) * (canvas.height - 80) + 40);

    // 2. Draw Circuit Track Outline
    ctx.beginPath();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#27272a"; // Zinc-800 line
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    circuitLayout.forEach((point, i) => {
      const cx = scaleX(point.X);
      const cy = scaleY(point.Y);
      if (i === 0) {
        ctx.moveTo(cx, cy);
      } else {
        ctx.lineTo(cx, cy);
      }
    });
    ctx.closePath();
    ctx.stroke();

    // 3. Draw Driver Positions
    if (telemetryFrame && telemetryFrame.length > 0) {
      telemetryFrame.forEach((driver) => {
        const cx = scaleX(driver.X);
        const cy = scaleY(driver.Y);

        // Driver dot
        ctx.beginPath();
        ctx.arc(cx, cy, 7, 0, 2 * Math.PI);
        ctx.fillStyle = DRIVER_COLORS[driver.Driver] || "#a1a1aa";
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#ffffff";
        ctx.stroke();

        // Driver label
        ctx.font = "bold 11px monospace";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(driver.Driver, cx + 10, cy + 4);
      });
    }
  }, [circuitLayout, telemetryFrame]);

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