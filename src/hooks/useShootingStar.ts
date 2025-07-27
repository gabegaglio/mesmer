import { useState, useEffect, useRef } from "react";
import { type ThemeMode } from "./useTheme";

interface ShootingStar {
  id: number;
  startTime: number;
  x: number;
  y: number;
  direction: "topDown" | "leftRight" | "rightLeft" | "bottomUp";
}

interface CrazyStar {
  id: number;
  startTime: number;
  x: number;
  y: number;
  animationType: "crazyStar1" | "crazyStar2" | "crazyStar3";
  duration: number;
}

export function useShootingStar(
  themeMode: ThemeMode,
  nightEffectsEnabled: boolean
) {
  const [shootingStars, setShootingStars] = useState<ShootingStar[]>([]);
  const [crazyStars, setCrazyStars] = useState<CrazyStar[]>([]);

  // MEMORY LEAK FIX: Track all timeouts for cleanup
  const timeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set());
  const intervalsRef = useRef<Set<NodeJS.Timeout>>(new Set());

  // Helper function to track timeouts
  const createTrackedTimeout = (
    callback: () => void,
    delay: number
  ): NodeJS.Timeout => {
    const timeoutId = setTimeout(() => {
      callback();
      timeoutsRef.current.delete(timeoutId);
    }, delay);
    timeoutsRef.current.add(timeoutId);
    return timeoutId;
  };

  // Helper function to track intervals
  const createTrackedInterval = (
    callback: () => void,
    delay: number
  ): NodeJS.Timeout => {
    const intervalId = setInterval(callback, delay);
    intervalsRef.current.add(intervalId);
    return intervalId;
  };

  useEffect(() => {
    const isNightTheme = themeMode === "night" || themeMode === "midnight";

    // Only show stars if it's night theme AND night effects are enabled
    if (!isNightTheme || !nightEffectsEnabled) {
      // MEMORY LEAK FIX: Clear all timeouts and intervals when disabling
      timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      intervalsRef.current.forEach((interval) => clearInterval(interval));
      timeoutsRef.current.clear();
      intervalsRef.current.clear();

      setShootingStars([]);
      setCrazyStars([]);
      return;
    }

    const createShootingStar = () => {
      const id = Date.now() + Math.random();

      const side = Math.floor(Math.random() * 4);
      let x, y;
      let direction: "topDown" | "leftRight" | "rightLeft" | "bottomUp";

      switch (side) {
        case 0:
          x = Math.random() * 100;
          y = -10;
          direction = "topDown";
          break;
        case 1:
          x = 110;
          y = Math.random() * 100;
          direction = "rightLeft";
          break;
        case 2:
          x = Math.random() * 100;
          y = 110;
          direction = "bottomUp";
          break;
        case 3:
          x = -10;
          y = Math.random() * 100;
          direction = "leftRight";
          break;
        default:
          x = 0;
          y = 0;
          direction = "topDown";
      }

      setShootingStars((prev) => [
        ...prev,
        {
          id,
          startTime: Date.now(),
          x,
          y,
          direction,
        },
      ]);

      // MEMORY LEAK FIX: Use tracked timeout
      createTrackedTimeout(() => {
        setShootingStars((prev) => prev.filter((star) => star.id !== id));
      }, 3000);
    };

    const createCrazyStar = () => {
      const id = Date.now() + Math.random() + 1000; // Different ID range

      // Random position within visible screen area
      const x = 10 + Math.random() * 80; // 10% to 90% to avoid edges
      const y = 10 + Math.random() * 80;

      // Random animation type and duration
      const animations: Array<"crazyStar1" | "crazyStar2" | "crazyStar3"> = [
        "crazyStar1",
        "crazyStar2",
        "crazyStar3",
      ];
      const animationType =
        animations[Math.floor(Math.random() * animations.length)];
      const duration = 4 + Math.random() * 6; // 4-10 seconds

      setCrazyStars((prev) => [
        ...prev,
        {
          id,
          startTime: Date.now(),
          x,
          y,
          animationType,
          duration,
        },
      ]);

      // MEMORY LEAK FIX: Use tracked timeout
      createTrackedTimeout(() => {
        setCrazyStars((prev) => prev.filter((star) => star.id !== id));
      }, duration * 1000);
    };

    // Create shooting stars at random intervals (8-15 seconds)
    const shootingStarInterval = createTrackedInterval(() => {
      if (Math.random() > 0.3) {
        createShootingStar();
      }
    }, 8000 + Math.random() * 7000);

    // Create crazy stars at different intervals (5-12 seconds)
    const crazyStarInterval = createTrackedInterval(() => {
      if (Math.random() > 0.4) {
        // 60% chance
        createCrazyStar();
      }
    }, 5000 + Math.random() * 7000);

    return () => {
      // MEMORY LEAK FIX: Comprehensive cleanup
      clearInterval(shootingStarInterval);
      clearInterval(crazyStarInterval);
      intervalsRef.current.delete(shootingStarInterval);
      intervalsRef.current.delete(crazyStarInterval);

      // Clear all remaining timeouts and intervals
      timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      intervalsRef.current.forEach((interval) => clearInterval(interval));
      timeoutsRef.current.clear();
      intervalsRef.current.clear();
    };
  }, [themeMode, nightEffectsEnabled]);

  return {
    shootingStars,
    crazyStars,
  };
}
