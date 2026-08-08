"use client";

import React from "react";

interface DriverSelectorProps {
  availableDrivers: string[];
  activeDrivers: string[];
  onToggleDriver: (driver: string) => void;
}

export const DriverSelector: React.FC<DriverSelectorProps> = ({
  availableDrivers = [],
  activeDrivers = [],
  onToggleDriver,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2 bg-[#121215] border border-zinc-800 p-3 rounded-xl">
      <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider mr-2">
        Drivers:
      </span>
      {availableDrivers.map((driver) => {
        const isActive = activeDrivers.includes(driver);
        return (
          <button
            key={driver}
            onClick={() => onToggleDriver(driver)}
            className={`px-3 py-1 text-xs font-mono rounded-lg transition-all border ${
              isActive
                ? "bg-red-600 text-white border-red-500 font-bold shadow-lg shadow-red-500/20"
                : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200"
            }`}
          >
            {driver}
          </button>
        );
      })}
    </div>
  );
};