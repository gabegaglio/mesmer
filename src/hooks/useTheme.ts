import { useState, useEffect, useCallback, useMemo } from "react";
import { useUserSettings } from "./useUserSettings";
import { useAuth } from "../contexts/AuthContext";

export type ThemeMode = "slate" | "day" | "night" | "midnight";

export function useNightMode() {
  const { user } = useAuth();
  const {
    settings,
    loading: settingsLoading,
    updateTheme,
    updateStarsEnabled,
    updateClockEnabled,
    updateWeatherEnabled,
  } = useUserSettings();

  // Local state for when user is not logged in
  const [localThemeMode, setLocalThemeMode] = useState<ThemeMode>("slate");
  const [localNightEffectsEnabled, setLocalNightEffectsEnabled] =
    useState(true);
  const [localClockEnabled, setLocalClockEnabled] = useState(true);
  const [localWeatherEnabled, setLocalWeatherEnabled] = useState(true);

  const [stars, setStars] = useState<
    Array<{ x: number; y: number; id: number }>
  >([]);

  // Use database settings if user is logged in, otherwise use local state
  const themeMode = user && settings ? settings.theme_mode : localThemeMode;
  const nightEffectsEnabled =
    user && settings ? settings.stars_enabled : localNightEffectsEnabled;
  const clockEnabled =
    user && settings ? settings.clock_enabled : localClockEnabled;
  const weatherEnabled =
    user && settings ? settings.weather_enabled : localWeatherEnabled;

  const cycleTheme = useCallback(() => {
    const getNextTheme = (current: ThemeMode): ThemeMode => {
      switch (current) {
        case "slate":
          return "day";
        case "day":
          return "night";
        case "night":
          return "midnight";
        case "midnight":
          return "slate";
        default:
          return "slate";
      }
    };

    const nextTheme = getNextTheme(themeMode);
    console.log("🎨 Cycling theme:", {
      current: themeMode,
      next: nextTheme,
      hasUser: !!user,
      hasSettings: !!settings,
    });

    if (user && settings) {
      // Update in database if user is logged in
      updateTheme(nextTheme);
    } else {
      // Update local state if user is not logged in
      setLocalThemeMode(nextTheme);
    }
  }, [themeMode, user, settings, updateTheme]);

  // Direct theme setter function
  const setTheme = useCallback((theme: ThemeMode) => {
    console.log("🎨 Setting theme directly:", {
      theme,
      current: themeMode,
      hasUser: !!user,
      hasSettings: !!settings,
    });

    if (user && settings) {
      updateTheme(theme);
    } else {
      setLocalThemeMode(theme);
    }
  }, [themeMode, user, settings, updateTheme]);

  const toggleNightEffects = useCallback((enabled: boolean) => {
    if (user && settings) {
      updateStarsEnabled(enabled);
    } else {
      setLocalNightEffectsEnabled(enabled);
    }
  }, [user, settings, updateStarsEnabled]);

  const toggleClock = useCallback((enabled: boolean) => {
    if (user && settings) {
      updateClockEnabled(enabled);
    } else {
      setLocalClockEnabled(enabled);
    }
  }, [user, settings, updateClockEnabled]);

  const toggleWeather = useCallback((enabled: boolean) => {
    if (user && settings) {
      updateWeatherEnabled(enabled);
    } else {
      setLocalWeatherEnabled(enabled);
    }
  }, [user, settings, updateWeatherEnabled]);

  // Backward compatibility
  const isNightMode = themeMode === "night";
  const toggleDayNight = cycleTheme;

  useEffect(() => {
    // Generate random star positions
    const generateStars = () => {
      const starArray = [];
      for (let i = 0; i < 30; i++) {
        starArray.push({
          id: i,
          x: Math.random() * 100, // percentage
          y: Math.random() * 100, // percentage
        });
      }
      setStars(starArray);
    };

    generateStars();
  }, []);

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(() => ({
    themeMode,
    isNightMode,
    nightEffectsEnabled,
    clockEnabled,
    weatherEnabled,
    stars,
    cycleTheme,
    setTheme,
    toggleDayNight,
    toggleNightEffects,
    toggleClock,
    toggleWeather,
    settingsLoading,
  }), [
    themeMode,
    isNightMode,
    nightEffectsEnabled,
    clockEnabled,
    weatherEnabled,
    stars,
    cycleTheme,
    setTheme,
    toggleDayNight,
    toggleNightEffects,
    toggleClock,
    toggleWeather,
    settingsLoading,
  ]);
}
