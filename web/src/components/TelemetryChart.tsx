import React from "react";

interface TelemetryPoint {
  Driver?: string;
  Speed?: number;
  [key: string]: unknown;
}

interface TelemetryChartProps {
  telemetryHistory: TelemetryPoint[][];
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

export const TelemetryChart: React.FC<TelemetryChartProps> = ({
  telemetryHistory,
}) => {
  const chartHeight = 120;
  const chartWidth = 600;

  if (!telemetryHistory || telemetryHistory.length === 0) {
    return (
      <div className="bg-[#121215] border border-zinc-800 rounded-xl p-4 font-mono text-xs text-zinc-500 flex items-center justify-center h-36">
        Awaiting speed telemetry stream...
      </div>
    );
  }

  // Extract drivers from history
  const driversSet = new Set<string>();
  telemetryHistory.forEach((frame) => {
    frame.forEach((d) => {
      if (d.Driver) driversSet.add(d.Driver);
    });
  });
  const drivers = Array.from(driversSet);

  const maxSpeed = 360;
  const totalFrames = Math.max(1, telemetryHistory.length - 1);

  // Map speed to SVG Y-coordinate
  const mapY = (speed: number) => {
    const clampedSpeed = Math.min(maxSpeed, Math.max(0, speed));
    return chartHeight - (clampedSpeed / maxSpeed) * chartHeight;
  };

  // Map frame index to SVG X-coordinate
  const mapX = (index: number) => {
    return (index / totalFrames) * chartWidth;
  };

  return (
    <div className="bg-[#121215] border border-zinc-800 rounded-xl p-4 font-mono text-xs">
      <div className="flex justify-between items-center mb-3">
        <span className="text-zinc-400 font-bold uppercase tracking-wider">
          {"// Live Speed Comparison (km/h)"}
        </span>
        <div className="flex gap-3 text-[10px]">
          {drivers.map((drv) => (
            <div key={drv} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{
                  backgroundColor: DRIVER_COLORS[drv] || "#a855f7",
                }}
              />
              <span className="text-zinc-300 font-bold">{drv}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative w-full overflow-hidden bg-black/40 border border-zinc-800/60 rounded-lg p-2">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-28 overflow-visible"
        >
          {/* Grid lines */}
          {[100, 200, 300].map((speed) => (
            <g key={speed}>
              <line
                x1={0}
                y1={mapY(speed)}
                x2={chartWidth}
                y2={mapY(speed)}
                stroke="#27272a"
                strokeDasharray="3 3"
              />
              <text
                x={5}
                y={mapY(speed) - 3}
                fill="#52525b"
                fontSize="8"
                fontFamily="monospace"
              >
                {speed}
              </text>
            </g>
          ))}

          {/* Render speed trace per driver */}
          {drivers.map((drv) => {
            const points = telemetryHistory
              .map((frame, idx) => {
                const driverPoint = frame.find((d) => d.Driver === drv);
                if (!driverPoint || driverPoint.Speed === undefined)
                  return null;
                return `${mapX(idx)},${mapY(driverPoint.Speed)}`;
              })
              .filter(Boolean)
              .join(" ");

            if (!points) return null;

            return (
              <polyline
                key={drv}
                fill="none"
                stroke={DRIVER_COLORS[drv] || "#a855f7"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
};