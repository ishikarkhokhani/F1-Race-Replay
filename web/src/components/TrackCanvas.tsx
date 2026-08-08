import React, { useRef, useEffect, useState } from "react";

interface CircuitPoint {
  X: number;
  Y: number;
  [key: string]: unknown;
}

interface TelemetryPoint {
  Driver?: string;
  X?: number;
  Y?: number;
  Speed?: number;
  Throttle?: number;
  nGear?: number;
  Distance?: number;
  SessionTime?: string;
  [key: string]: unknown;
}

interface TrackCanvasProps {
  circuitLayout: CircuitPoint[];
  telemetryFrame: TelemetryPoint[];
  circuitName: string;
}

const DRIVER_COLORS: Record<string, string> = {
  VER: "#3671C6",
  PER: "#3671C6",
  LEC: "#E8002D",
  SAI: "#E8002D",
  HAM: "#27F4D2",
  RUS: "#27F4D2",
  NOR: "#FF8000",
  PIA: "#FF8000",
  ALO: "#229971",
  STR: "#229971",
};

export const TrackCanvas: React.FC<TrackCanvasProps> = ({
  circuitLayout,
  telemetryFrame,
  circuitName,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Pan and Zoom States
  const [scale, setScale] = useState<number>(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Handle Zooming via Mouse Wheel
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    let newScale = e.deltaY < 0 ? scale * zoomFactor : scale / zoomFactor;
    newScale = Math.min(Math.max(0.5, newScale), 5); // Bound scale between 0.5x and 5x
    setScale(newScale);
  };

  // Handle Dragging / Panning
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const resetView = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Reset Canvas Canvas Bounds
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    if (!circuitLayout || circuitLayout.length === 0) {
      ctx.fillStyle = "#71717a";
      ctx.font = "14px monospace";
      ctx.textAlign = "center";
      ctx.fillText("Awaiting Circuit Map Telemetry...", width / 2, height / 2);
      return;
    }

    // 1. Calculate Bounds for Circuit Alignment
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;

    circuitLayout.forEach((pt) => {
      if (pt.X < minX) minX = pt.X;
      if (pt.X > maxX) maxX = pt.X;
      if (pt.Y < minY) minY = pt.Y;
      if (pt.Y > maxY) maxY = pt.Y;
    });

    const trackWidth = maxX - minX || 1;
    const trackHeight = maxY - minY || 1;
    const padding = 60;

    const scaleX = (width - padding * 2) / trackWidth;
    const scaleY = (height - padding * 2) / trackHeight;
    const baseScale = Math.min(scaleX, scaleY);

    const mapX = (x: number) => padding + (x - minX) * baseScale;
    const mapY = (y: number) => height - (padding + (y - minY) * baseScale);

    ctx.save();

    // 2. Apply Pan & Zoom Transform
    ctx.translate(width / 2 + offset.x, height / 2 + offset.y);
    ctx.scale(scale, scale);
    ctx.translate(-width / 2, -height / 2);

    // 3. Render Track Outline
    ctx.beginPath();
    ctx.lineWidth = 4 / scale; // Keep line thickness constant on zoom
    ctx.strokeStyle = "#3f3f46";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    circuitLayout.forEach((pt, index) => {
      const cx = mapX(pt.X);
      const cy = mapY(pt.Y);
      if (index === 0) {
        ctx.moveTo(cx, cy);
      } else {
        ctx.lineTo(cx, cy);
      }
    });

    ctx.closePath();
    ctx.stroke();

    // 4. Render Driver Car Positions
    if (telemetryFrame && telemetryFrame.length > 0) {
      telemetryFrame.forEach((driver) => {
        if (driver.X === undefined || driver.Y === undefined) return;

        const cx = mapX(driver.X);
        const cy = mapY(driver.Y);
        const color = DRIVER_COLORS[driver.Driver || ""] || "#a855f7";

        // Draw Outer Marker Glow
        ctx.beginPath();
        ctx.arc(cx, cy, 8 / scale, 0, 2 * Math.PI);
        ctx.fillStyle = `${color}44`;
        ctx.fill();

        // Draw Car Dot
        ctx.beginPath();
        ctx.arc(cx, cy, 4 / scale, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();

        // Render Driver Code Label
        ctx.font = `bold ${Math.max(10, 12 / scale)}px monospace`;
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.fillText(driver.Driver || "", cx, cy - 10 / scale);
      });
    }

    ctx.restore();
  }, [circuitLayout, telemetryFrame, scale, offset]);

  return (
    <div className="relative bg-[#121215] border border-zinc-800 rounded-xl p-4 overflow-hidden">
      <div className="flex justify-between items-center mb-2 font-mono text-xs">
        <span className="text-zinc-400 font-bold uppercase">{circuitName}</span>
        <div className="flex gap-2">
          <button
            onClick={resetView}
            className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded border border-zinc-700 transition-colors text-[10px]"
          >
            RESET VIEW
          </button>
          <span className="text-zinc-500 text-[10px] self-center">
            {Math.round(scale * 100)}%
          </span>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={700}
        height={450}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full h-auto cursor-grab active:cursor-grabbing rounded-lg bg-black/40"
      />
    </div>
  );
};