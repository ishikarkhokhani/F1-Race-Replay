"use client";

import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface DriverFrame {
  Driver: string;
  Speed: number;
  Distance?: number;
}

interface TelemetryChartProps {
  telemetryHistory: any[][];
}

const DRIVER_COLORS: Record<string, string> = {
  VER: "#1e41ff",
  LEC: "#dc0000",
  HAM: "#00d2be",
  NOR: "#ff8700",
};

export const TelemetryChart: React.FC<TelemetryChartProps> = ({
  telemetryHistory,
}) => {
  const chartData = telemetryHistory.map((frame, index) => {
    const entry: Record<string, any> = { frameIndex: index };
    frame.forEach((driver: DriverFrame) => {
      entry[driver.Driver] = Math.round(driver.Speed || 0);
    });
    return entry;
  });

  const drivers = Array.from(
    new Set(
      telemetryHistory.flatMap((frame) =>
        frame.map((d: DriverFrame) => d.Driver)
      )
    )
  );

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 shadow-2xl font-mono text-xs">
      <div className="flex justify-between items-center mb-4 text-zinc-400">
        <span>SPEED COMPARISON (KM/H)</span>
        <div className="flex gap-4">
          {drivers.map((driver) => (
            <div key={driver} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor: DRIVER_COLORS[driver] || "#a1a1aa",
                }}
              />
              <span className="text-zinc-200">{driver}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="frameIndex" stroke="#71717a" tick={false} />
            <YAxis stroke="#71717a" domain={[0, 360]} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0d0d11",
                borderColor: "#27272a",
                borderRadius: "8px",
                color: "#f4f4f5",
              }}
            />
            {drivers.map((driver) => (
              <Line
                key={driver}
                type="monotone"
                dataKey={driver}
                stroke={DRIVER_COLORS[driver] || "#a1a1aa"}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};