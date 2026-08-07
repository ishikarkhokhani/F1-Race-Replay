"use client";

import React, { useRef, useEffect, useMemo } from "react";

interface TrackCanvasProps {
  circuitLayout: { X: number; Y: number }[];
  telemetryFrame: any[];
  circuitName?: string;
}

const DRIVER_COLORS: Record<string, string> = {
  VER: "#3671C6",
  PER: "#3671C6",
  LEC: "#F91536",
  SAI: "#F91536",
  HAM: "#6CD3BF",
  RUS: "#6CD3BF",
  NOR: "#FF8000",
  PIA: "#FF8000",
  ALO: "#229971",
  STR: "#229971",
};

export const TrackCanvas: React.FC<TrackCanvasProps> = ({
  circuitLayout = [],
  telemetryFrame = [],
  circuitName = "Monza GP",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const bounds = useMemo(() => {
    if (!circuitLayout.length) return null;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    circuitLayout.forEach((pt) => {
      const x = Number(pt.X);
      const y = Number(pt.Y);
      if (!isNaN(x) && !isNaN(y)) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    });

    if (minX === Infinity || maxX === -Infinity) return null;

    return { minX, maxX, minY, maxY };
  }, [circuitLayout]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx || !bounds) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const padding = 60;
    const availWidth = canvas.width - padding * 2;
    const availHeight = canvas.height - padding * 2;

    const mapWidth = bounds.maxX - bounds.minX || 1;
    const mapHeight = bounds.maxY - bounds.minY || 1;

    const scale = Math.min(availWidth / mapWidth, availHeight / mapHeight);

    const offsetX = padding + (availWidth - mapWidth * scale) / 2;
    const offsetY = padding + (availHeight - mapHeight * scale) / 2;

    const toCanvasX = (x: number) => offsetX + (x - bounds.minX) * scale;
    const toCanvasY = (y: number) => canvas.height - (offsetY + (y - bounds.minY) * scale);

    if (circuitLayout.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = "#3f3f46";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      let started = false;
      circuitLayout.forEach((pt) => {
        const x = Number(pt.X);
        const y = Number(pt.Y);
        if (!isNaN(x) && !isNaN(y)) {
          const cx = toCanvasX(x);
          const cy = toCanvasY(y);
          if (!started) {
            ctx.moveTo(cx, cy);
            started = true;
          } else {
            ctx.lineTo(cx, cy);
          }
        }
      });
      ctx.closePath();
      ctx.stroke();
    }

    telemetryFrame.forEach((driver) => {
      const x = Number(driver.X);
      const y = Number(driver.Y);

      if (!isNaN(x) && !isNaN(y)) {
        const cx = toCanvasX(x);
        const cy = toCanvasY(y);

        const color = DRIVER_COLORS[driver.Driver] || "#a855f7";

        ctx.beginPath();
        ctx.arc(cx, cy, 8, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = "bold 10px monospace";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.fillText(driver.Driver || "", cx, cy - 12);
      }
    });
  }, [circuitLayout, telemetryFrame, bounds]);

  return (
    <div className="relative bg-[#121215] border border-zinc-800 rounded-xl p-4 overflow-hidden">
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
          CIRCUIT: {circuitName}
        </span>
      </div>
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span className="text-[10px] font-mono text-zinc-400">LIVE REPLAY</span>
      </div>

      <canvas
        ref={canvasRef}
        width={700}
        height={420}
        className="w-full h-[420px] object-contain"
      />
    </div>
  );
};