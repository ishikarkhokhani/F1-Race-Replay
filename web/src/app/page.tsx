"use client";

import React, { useState, useEffect, useRef } from "react";
import { TrackCanvas } from "@/components/TrackCanvas";
import { TelemetryChart } from "@/components/TelemetryChart";

const AVAILABLE_CIRCUITS = [
  { id: "Monza", name: "Monza (Italy)" },
  { id: "Silverstone", name: "Silverstone (UK)" },
  { id: "Spa", name: "Spa-Francorchamps (Belgium)" },
  { id: "Monaco", name: "Monaco" },
  { id: "Red Bull Ring", name: "Red Bull Ring (Austria)" },
];

export default function Home() {
  const [circuitLayout, setCircuitLayout] = useState<any[]>([]);
  const [circuitName, setCircuitName] = useState<string>("Monza GP");
  const [selectedGP, setSelectedGP] = useState<string>("Monza");
  const [telemetryBuffer, setTelemetryBuffer] = useState<any[][]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const isPlayingRef = useRef(isPlaying);
  const speedRef = useRef(speedMultiplier);
  const bufferLengthRef = useRef(0);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    speedRef.current = speedMultiplier;
  }, [speedMultiplier]);

  useEffect(() => {
    bufferLengthRef.current = telemetryBuffer.length;
  }, [telemetryBuffer.length]);

  // Handle WebSocket Connection
  useEffect(() => {
    if (typeof window === "undefined") return;

    const socketUrl = "ws://127.0.0.1:8765";
    const ws = new WebSocket(socketUrl);
    socketRef.current = ws;

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    ws.onerror = () => setIsConnected(false);

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "layout") {
          setCircuitLayout(message.circuit);
          if (message.circuitName) {
            setCircuitName(message.circuitName);
          }
        } else if (message.type === "telemetry") {
          setTelemetryBuffer((prev) => [...prev, message.data]);
        }
      } catch (e) {
        console.error("Invalid WS payload", e);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  // Frame Playback Loop
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPlayingRef.current) return;

      setCurrentFrameIndex((prevIndex) => {
        const maxLen = bufferLengthRef.current;
        if (maxLen === 0) return 0;
        const nextIndex = prevIndex + speedRef.current;
        return nextIndex < maxLen ? nextIndex : maxLen - 1;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const currentFrame = telemetryBuffer[currentFrameIndex] || [];

  // Helper to format session time into HH:MM:SS format
  const formatSessionTime = (rawTime: string | number) => {
    if (!rawTime) return "00:00.0";
    const strTime = String(rawTime);
    return strTime.includes("days")
      ? strTime.split("days")[1].trim().slice(0, 10)
      : strTime.slice(0, 10);
  };

  // Switch circuit handler via WebSocket
  const handleCircuitSelect = (gp: string) => {
    setSelectedGP(gp);
    setTelemetryBuffer([]);
    setCurrentFrameIndex(0);

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "select_session",
          year: 2023,
          gp: gp,
        })
      );
    }
  };

  // Sort drivers by cumulative Distance or spatial coordinates
  const sortedDrivers = [...currentFrame].sort((a, b) => {
    if (a.Distance !== undefined && b.Distance !== undefined) {
      return b.Distance - a.Distance;
    }
    return 0;
  });

  const leader = sortedDrivers[0];

  // Calculate realistic time gap deltas
  const getDriverDelta = (driver: any, idx: number) => {
    if (idx === 0 || !leader) return "LEADER";

    if (
      driver.Distance !== undefined &&
      leader.Distance !== undefined &&
      leader.Distance !== driver.Distance
    ) {
      const deltaMeters = Math.max(0, leader.Distance - driver.Distance);
      const speedMs = (driver.Speed || 250) / 3.6;
      const gapSeconds = speedMs > 0 ? deltaMeters / speedMs : 0;
      return `+${gapSeconds.toFixed(3)}s`;
    }

    const dx = (leader.X || 0) - (driver.X || 0);
    const dy = (leader.Y || 0) - (driver.Y || 0);
    const spatialDistance = Math.sqrt(dx * dx + dy * dy);

    const distanceInMeters = spatialDistance / 10;
    const speedMs = (driver.Speed || 250) / 3.6;
    const gapSeconds = speedMs > 0 ? distanceInMeters / speedMs : 0;

    return gapSeconds > 0.001 ? `+${gapSeconds.toFixed(3)}s` : "+0.000s";
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-zinc-100 p-8 font-sans max-w-6xl mx-auto">
      {/* Header */}
      <header className="flex justify-between items-center border-b border-zinc-800 pb-4 mb-8 font-mono">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            F1 Telemetry Streaming Dashboard
          </h1>
          <p className="text-xs text-zinc-400">
            Real-time WebSocket Replay • FastF1 Engine
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs">
          {/* Circuit Selector Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-zinc-400">CIRCUIT:</label>
            <select
              value={selectedGP}
              onChange={(e) => handleCircuitSelect(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-purple-500 font-mono text-xs cursor-pointer"
            >
              {AVAILABLE_CIRCUITS.map((circuit) => (
                <option key={circuit.id} value={circuit.id}>
                  {circuit.name}
                </option>
              ))}
            </select>
          </div>

          <span className="text-zinc-400 font-mono">
            SESSION TIME:{" "}
            <span className="text-zinc-200">
              {formatSessionTime(currentFrame[0]?.SessionTime)}
            </span>
          </span>

          <span
            className={`px-3 py-1 rounded-full border font-mono ${
              isConnected
                ? "bg-emerald-950/40 border-emerald-800 text-emerald-400"
                : "bg-rose-950/40 border-rose-800 text-rose-400"
            }`}
          >
            {isConnected ? "WS CONNECTED" : "WS DISCONNECTED"}
          </span>
        </div>
      </header>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Track Canvas, Timeline Scrubber, & Speed Chart (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <TrackCanvas
            circuitLayout={circuitLayout}
            telemetryFrame={currentFrame}
            circuitName={circuitName}
          />

          {/* Interactive Timeline Scrubber & Controls */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3 font-mono text-xs">
            {/* Scrubber Range Slider */}
            <div className="flex items-center gap-3">
              <span className="text-zinc-500 text-[10px]">0</span>
              <input
                type="range"
                min={0}
                max={Math.max(0, telemetryBuffer.length - 1)}
                value={currentFrameIndex}
                onChange={(e) => {
                  setIsPlaying(false);
                  setCurrentFrameIndex(Number(e.target.value));
                }}
                className="w-full accent-purple-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
              />
              <span className="text-zinc-500 text-[10px]">
                {telemetryBuffer.length}
              </span>
            </div>

            {/* Playback Button Bar */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-semibold transition-colors flex items-center gap-2 border border-zinc-700"
                >
                  {isPlaying ? (
                    <>
                      <span className="text-amber-400">❚❚</span> PAUSE
                    </>
                  ) : (
                    <>
                      <span className="text-emerald-400">▶</span> PLAY
                    </>
                  )}
                </button>

                <span className="text-zinc-500">
                  Frame: {currentFrameIndex} / {telemetryBuffer.length}
                </span>
              </div>

              {/* Playback Speed Multipliers */}
              <div className="flex items-center gap-2">
                <span className="text-zinc-400 mr-1">SPEED:</span>
                {[1, 2, 4].map((mult) => (
                  <button
                    key={mult}
                    onClick={() => setSpeedMultiplier(mult)}
                    className={`px-2.5 py-1 rounded border transition-colors ${
                      speedMultiplier === mult
                        ? "bg-purple-950 border-purple-600 text-purple-300 font-bold"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                    }`}
                  >
                    {mult}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Speed Chart */}
          <TelemetryChart
            telemetryHistory={telemetryBuffer.slice(0, currentFrameIndex + 1)}
          />
        </div>

        {/* Timing HUD & Telemetry Feed (1 col) */}
        <div className="space-y-4 font-mono text-xs">
          {/* Live Gap Deltas */}
          <div className="bg-[#121215] border border-zinc-800 rounded-xl p-5">
            <h2 className="text-zinc-400 uppercase tracking-wider mb-3">
              // Live Gap Deltas
            </h2>
            <div className="space-y-2">
              {sortedDrivers.map((driver, idx) => {
                const isLeader = idx === 0;
                const deltaText = getDriverDelta(driver, idx);

                return (
                  <div
                    key={driver.Driver}
                    className="flex justify-between items-center bg-zinc-900/40 border border-zinc-800/80 px-3 py-2 rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500 w-3">{idx + 1}</span>
                      <span className="font-bold text-white">
                        {driver.Driver}
                      </span>
                    </div>
                    <span
                      className={
                        isLeader ? "text-emerald-400 font-bold" : "text-amber-400"
                      }
                    >
                      {deltaText}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Telemetry Feed HUD */}
          <div className="bg-[#121215] border border-zinc-800 rounded-xl p-5">
            <h2 className="text-zinc-400 uppercase tracking-wider mb-3">
              // Telemetry Feed
            </h2>
            <div className="space-y-3">
              {currentFrame.map((driver: any) => (
                <div
                  key={driver.Driver}
                  className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-lg"
                >
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span className="text-white">{driver.Driver}</span>
                    <span className="text-purple-400">
                      {driver.Speed ? Math.round(driver.Speed) : 0} km/h
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400">
                    <div>
                      Gear:{" "}
                      <span className="text-zinc-200">{driver.nGear || 1}</span>
                    </div>
                    <div>
                      Throttle:{" "}
                      <span className="text-zinc-200">
                        {driver.Throttle ? Math.round(driver.Throttle) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}