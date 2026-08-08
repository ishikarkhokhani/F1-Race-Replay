export const DRIVER_COLORS: Record<string, string> = {
    VER: "#3671C6", // Red Bull
    PER: "#3671C6",
    LEC: "#E8002D", // Ferrari
    SAI: "#E8002D",
    HAM: "#6CD3BF", // Mercedes
    RUS: "#6CD3BF",
    NOR: "#FF8000", // McLaren
    PIA: "#FF8000",
    ALO: "#229971", // Aston Martin
    STR: "#229971",
    GAS: "#0093CC", // Alpine
    OCO: "#0093CC",
    TSU: "#6692FF", // Racing Bulls / AlphaTauri
    RIC: "#6692FF",
    LAW: "#6692FF",
    ALB: "#37BEDD", // Williams
    SAR: "#37BEDD",
    COL: "#37BEDD",
    MAG: "#B6BABD", // Haas
    HUL: "#B6BABD",
    BOT: "#52E252", // Kick Sauber / Alfa Romeo
    ZHO: "#52E252",
  };
  
  export const getDriverColor = (driverCode: string): string => {
    return DRIVER_COLORS[driverCode] || "#EF4444"; // Default red fallback
  };