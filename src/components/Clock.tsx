import { useState, useEffect } from "react";
import { type ThemeMode } from "../hooks/useTheme";

interface ClockProps {
  themeMode: ThemeMode;
  clockEnabled?: boolean;
}

export function Clock({ themeMode, clockEnabled = true }: ClockProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getClockStyles = (mode: ThemeMode) => {
    switch (mode) {
      case "day":
        return {
          textColor: "text-white",
          opacity: 0.65,
        };
      case "night":
        return {
          textColor: "text-white",
          opacity: 0.2,
        };
      case "midnight":
        return {
          textColor: "text-purple-100",
          opacity: 0.35,
        };
      default:
        return {
          textColor: "text-gray-800",
          opacity: 0.15,
        };
    }
  };

  const styles = getClockStyles(themeMode);

  // Don't render if clock is disabled
  if (!clockEnabled) {
    return null;
  }

  return (
    <div
      className={`fixed pointer-events-none select-none z-10 top-4 left-1/2 transform -translate-x-1/2 sm:top-6 md:top-1/2 md:-translate-y-full md:-mt-40 transition-all duration-500 ${styles.textColor}`}
      style={{
        opacity: styles.opacity,
        fontFamily: "'Inter', 'SF Pro Display', 'Segoe UI', sans-serif",
      }}
    >
      <div
        className="text-2xl xs:text-3xl sm:text-4xl md:text-8xl font-black tracking-tight whitespace-nowrap"
        style={{
          fontWeight: 900,
          letterSpacing: "-0.02em",
        }}
      >
        {formatTime(time)}
      </div>
    </div>
  );
}

export default Clock;
