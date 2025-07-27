import { useState, useEffect, useCallback } from "react";

export interface PerformanceSettings {
  reducedStars: boolean;
  disableTrails: boolean;
  reduceBlur: boolean;
  disableComplexAnimations: boolean;
  autoOptimize: boolean;
}

export function usePerformanceMode() {
  const [settings, setSettings] = useState<PerformanceSettings>({
    reducedStars: false,
    disableTrails: false,
    reduceBlur: false,
    disableComplexAnimations: false,
    autoOptimize: true,
  });

  const [currentFPS, setCurrentFPS] = useState<number>(60);
  const [performanceLevel, setPerformanceLevel] = useState<
    "high" | "medium" | "low"
  >("high");

  // Monitor FPS and auto-adjust settings
  useEffect(() => {
    if (!settings.autoOptimize) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measureFPS = () => {
      frameCount++;
      const now = performance.now();

      if (now - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (now - lastTime));
        setCurrentFPS(fps);

        // Auto-adjust based on FPS
        if (fps < 30 && performanceLevel !== "low") {
          setPerformanceLevel("low");
          setSettings((prev) => ({
            ...prev,
            reducedStars: true,
            disableTrails: true,
            reduceBlur: true,
            disableComplexAnimations: true,
          }));
        } else if (fps >= 30 && fps < 50 && performanceLevel !== "medium") {
          setPerformanceLevel("medium");
          setSettings((prev) => ({
            ...prev,
            reducedStars: true,
            disableTrails: true,
            reduceBlur: false,
            disableComplexAnimations: false,
          }));
        } else if (fps >= 55 && performanceLevel !== "high") {
          setPerformanceLevel("high");
          setSettings((prev) => ({
            ...prev,
            reducedStars: false,
            disableTrails: false,
            reduceBlur: false,
            disableComplexAnimations: false,
          }));
        }

        frameCount = 0;
        lastTime = now;
      }

      animationId = requestAnimationFrame(measureFPS);
    };

    animationId = requestAnimationFrame(measureFPS);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [settings.autoOptimize, performanceLevel]);

  const toggleSetting = useCallback((key: keyof PerformanceSettings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  const resetToHighPerformance = useCallback(() => {
    setSettings({
      reducedStars: false,
      disableTrails: false,
      reduceBlur: false,
      disableComplexAnimations: false,
      autoOptimize: true,
    });
    setPerformanceLevel("high");
  }, []);

  const setLowPerformanceMode = useCallback(() => {
    setSettings({
      reducedStars: true,
      disableTrails: true,
      reduceBlur: true,
      disableComplexAnimations: true,
      autoOptimize: false,
    });
    setPerformanceLevel("low");
  }, []);

  // Calculate optimized star count based on settings
  const getOptimizedStarCount = useCallback(
    (originalCount: number): number => {
      if (settings.reducedStars) {
        return Math.max(10, Math.floor(originalCount * 0.4));
      }
      return originalCount;
    },
    [settings.reducedStars]
  );

  // Get CSS classes for performance optimization
  const getPerformanceClasses = useCallback((): string => {
    const classes: string[] = [];

    if (settings.reduceBlur) {
      classes.push("reduce-blur");
    }

    if (settings.disableComplexAnimations) {
      classes.push("reduce-motion");
    }

    return classes.join(" ");
  }, [settings]);

  return {
    settings,
    currentFPS,
    performanceLevel,
    toggleSetting,
    resetToHighPerformance,
    setLowPerformanceMode,
    getOptimizedStarCount,
    getPerformanceClasses,
  };
}
