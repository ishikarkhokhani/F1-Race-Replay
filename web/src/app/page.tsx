"use client";

import React, { useState, useEffect } from "react";
import { TrackCanvas } from "@/components/TrackCanvas";

export default function Home() {
  const [circuitLayout, setCircuitLayout] = useState<any[]>([]);
  const [telemetry, setTelemetry] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Prevent SSR/hydration execution
    if (typeof window === "undefined") return;
  
    const socketUrl = "ws://127.0.0.1:8765";
    console.log(`[WS] Attempting connection to ${socketUrl}...`);
    
    const ws = new WebSocket(socketUrl);
  
    ws.onopen = () => {
      console.log("[WS] Connected to telemetry server!");
      setIsConnected(true);
    };
  
    ws.onclose = (event) => {
      console.log(`[WS] Disconnected (Code: ${event.code}, Reason: ${event.reason || "None"})`);
      setIsConnected(false);
    };
  
    ws.onerror = (event) => {
      console.error("[WS] Connection failed to ws://127.0.0.1:8765. Verify Python server is running.");
    };
  
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "layout") {
          setCircuitLayout(message.circuit);
        } else if (message.type === "telemetry") {
          setTelemetry(message.data);
        }
      } catch (e) {
        console.error("Invalid WS payload", e);
      }
    };
  
    return () => {
      ws.close();
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-zinc-100 p-8 font-sans max-w-6xl mx-auto">
      {/* Header */}
      <header className="flex justify-between items-center border-b border-zinc-800 pb-4 mb-8 font-mono">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">F1 Telemetry Streaming Dashboard</h1>
          <p className="text-xs text-zinc-400">Real-time WebSocket Replay • FastF1 Engine</p>
        </div>
        <div className="text-xs">
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
        {/* Track Canvas (2 cols) */}
        <div className="lg:col-span-2">
          <TrackCanvas
            circuitLayout={circuitLayout}
            telemetryFrame={telemetry}
            circuitName="Monza GP"
          />
        </div>

        {/* Telemetry HUD (1 col) */}
        <div className="bg-[#121215] border border-zinc-800 rounded-xl p-6 font-mono text-xs">
          <h2 className="text-zinc-400 uppercase tracking-wider mb-4">// Telemetry Feed</h2>
          
          <div className="space-y-4">
            {telemetry.map((driver: any) => (
              <div key={driver.Driver} className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-lg">
                <div className="flex justify-between text-sm font-bold mb-2">
                  <span className="text-white">{driver.Driver}</span>
                  <span className="text-purple-400">
                    {driver.Speed ? Math.round(driver.Speed) : 0} km/h
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400">
                  <div>Gear: <span className="text-zinc-200">{driver.nGear || 1}</span></div>
                  <div>Throttle: <span className="text-zinc-200">{driver.Throttle ? Math.round(driver.Throttle) : 0}%</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}