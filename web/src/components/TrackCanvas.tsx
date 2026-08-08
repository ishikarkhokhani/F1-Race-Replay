"use client";

import React, { useRef, useEffect, useState } from "react";
import { getDriverColor } from "@/utils/colors";

interface TrackCanvasProps {
  circuitLayout: any[];
  telemetryFrame: any[];
  circuitName: string;
}

export const TrackCanvas: React.FC<TrackCanvasProps> = ({
  circuitLayout = [],
  telemetryFrame = [],
  circuitName = "Circuit Map",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Zoom & Pan state
  const [zoom, setZoom] = useState<number>(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Handle Mouse Wheel Zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    setZoom((prevZoom) => Math.min(Math.max(prevZoom * zoomFactor, 1), 8));
  };

  // Handle Drag / Pan Start
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  // Handle Dragging
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  // Handle Drag End
  const handleMouseUp = () => setIsDragging(false);

  // Reset Zoom & Position
  const handleReset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle high-DPI crisp rendering
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    const width = rect.width;
    const height = rect.height;

    ctx.clearRect(0, 0, width, height);

    if (!circuitLayout || circuitLayout.length === 0) {
      ctx.fillStyle = "#71717a";
      ctx.font = "12px monospace";
      ctx.textAlign = "center";
      ctx.fillText("Waiting for track geometry...", width / 2, height / 2);
      return;
    }

    // 1. Compute Track Bounding Box
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    circuitLayout.forEach((pt) => {
      if (pt.X < minX) minX = pt.X;
      if (pt.X > maxX) maxX = pt.X;
      if (pt.Y < minY) minY = pt.Y;
      if (pt.Y > maxY) maxY = pt.Y;
    });

    const padding = 50;
    const trackWidth = maxX - minX || 1;
    const trackHeight = maxY - minY || 1;

    const scaleX = (width - padding * 2) / trackWidth;
    const scaleY = (height - padding * 2) / trackHeight;
    const baseScale = Math.min(scaleX, scaleY);

    // Calculate exact centering offsets
    const drawnWidth = trackWidth * baseScale;
    const drawnHeight = trackHeight * baseScale;
    const offsetX = (width - drawnWidth) / 2;
    const offsetY = (height - drawnHeight) / 2;

    const mapX = (x: number) => offsetX + (x - minX) * baseScale;
    const mapY = (y: number) => height - (offsetY + (y - minY) * baseScale);

    // Save initial context state
    ctx.save();

    // 2. Apply Dynamic Zoom & Pan Transformations around canvas center
    const centerX = width / 2;
    const centerY = height / 2;
    ctx.translate(centerX + offset.x, centerY + offset.y);
    ctx.scale(zoom, zoom);
    ctx.translate(-centerX, -centerY);

    // 3. Draw Outer Track Line
    ctx.beginPath();
    ctx.strokeStyle = "#27272a";
    ctx.lineWidth = 8 / zoom;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    circuitLayout.forEach((pt, idx) => {
      const cx = mapX(pt.X);
      const cy = mapY(pt.Y);
      if (idx === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    });
    ctx.closePath();
    ctx.stroke();

    // Draw Inner Racing Line
    ctx.beginPath();
    ctx.strokeStyle = "#52525b";
    ctx.lineWidth = 2 / zoom;
    circuitLayout.forEach((pt, idx) => {
      const cx = mapX(pt.X);
      const cy = mapY(pt.Y);
      if (idx === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    });
    ctx.closePath();
    ctx.stroke();

    // 4. Draw Driver Dots & Labels
    telemetryFrame.forEach((driver) => {
      if (driver.X === undefined || driver.Y === undefined) return;

      const dx = mapX(driver.X);
      const dy = mapY(driver.Y);
      const driverCode = driver.Driver || "";
      const teamColor = getDriverColor(driverCode);

      // Outer glow / halo ring
      ctx.beginPath();
      ctx.arc(dx, dy, 10 / Math.sqrt(zoom), 0, Math.PI * 2);
      ctx.fillStyle = `${teamColor}33`; // 20% opacity halo
      ctx.fill();

      // Main Driver Dot with Team Color
      ctx.beginPath();
      ctx.arc(dx, dy, 7 / Math.sqrt(zoom), 0, Math.PI * 2);
      ctx.fillStyle = teamColor;
      ctx.fill();
      ctx.lineWidth = 2 / Math.sqrt(zoom);
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();

      // Driver Code Label
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${Math.max(9, Math.round(11 / Math.sqrt(zoom)))}px monospace`;
      ctx.textAlign = "center";
      ctx.fillText(driverCode, dx, dy - 11 / Math.sqrt(zoom));
    });

    ctx.restore();
  }, [circuitLayout, telemetryFrame, zoom, offset]);

  return (
    <div className="relative bg-[#121215] border border-zinc-800 rounded-xl p-4">
      {/* Canvas Header Controls */}
      <div className="absolute top-4 left-4 z-10 flex items-center justify-between w-[calc(100%-2rem)]">
        <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
          CIRCUIT: <span className="text-white font-bold">{circuitName}</span>
        </span>

        <div className="flex items-center gap-2">
          {zoom > 1 && (
            <button
              onClick={handleReset}
              className="px-2.5 py-1 text-[10px] font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md border border-zinc-700 transition-all cursor-pointer"
            >
              RESET ZOOM ({zoom.toFixed(1)}x)
            </button>
          )}
          <span className="text-[10px] font-mono text-zinc-500">
            [ Scroll to Zoom • Drag to Pan ]
          </span>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`w-full h-[420px] rounded-lg ${
          zoom > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-crosshair"
        }`}
      />
    </div>
  );
};