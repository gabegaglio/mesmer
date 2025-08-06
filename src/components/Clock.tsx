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
      case "slate":
        return {
          textColor: "text-white",
          opacity: 0.15,
          mobileOpacity: 0.4, // More visible on mobile
        };
      case "day":
        return {
          textColor: "text-white",
          opacity: 0.65,
          mobileOpacity: 0.8, // More visible on mobile
        };
      case "night":
        return {
          textColor: "text-white",
          opacity: 0.2,
          mobileOpacity: 0.5, // More visible on mobile
        };
      case "midnight":
        return {
          textColor: "text-white",
          opacity: 0.35,
          mobileOpacity: 0.6, // More visible on mobile
        };
      default:
        return {
          textColor: "text-white",
          opacity: 0.15,
          mobileOpacity: 0.4, // More visible on mobile
        };
    }
  };

  const styles = getClockStyles(themeMode);

  // Don't render if clock is disabled
  if (!clockEnabled) {
    return null;
  }

  return (
    <>
      <style>
        {`
          .clock-mobile { opacity: ${styles.mobileOpacity}; }
          @media (min-width: 768px) {
            .clock-mobile { opacity: ${styles.opacity}; }
          }
        `}
      </style>
      <div
        className={`fixed pointer-events-none select-none z-10 top-16 left-1/2 transform -translate-x-1/2 sm:top-20 md:top-4 lg:top-1/2 lg:-translate-y-full lg:-mt-48 transition-all duration-500 ${styles.textColor} clock-mobile`}
        style={{
          fontFamily: "'Inter', 'SF Pro Display', 'Segoe UI', sans-serif",
        }}
      >
        {/* Time Display */}
        <div
          className="text-5xl xs:text-6xl sm:text-7xl md:text-8xl font-black tracking-tight whitespace-nowrap drop-shadow-lg text-center"
          style={{
            fontWeight: 900,
            letterSpacing: "-0.02em",
            // Add text shadow for better visibility on mobile
            textShadow: "0 2px 4px rgba(0,0,0,0.3), 0 0 8px rgba(0,0,0,0.2)",
          }}
        >
          {formatTime(time)}
        </div>
      </div>
    </>
  );
}

export default Clock;
