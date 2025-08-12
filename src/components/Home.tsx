import SoundSlider from "./SoundSlider";
import SideTaskBar from "./SideTaskBar";
import { useNightMode } from "../hooks/useTheme";
import { useAuth } from "../contexts/AuthContext";
import { useUserSettings } from "../hooks/useUserSettings";
import { SettingsLoader } from "./SettingsLoader";
import { useState, useCallback, useMemo } from "react";
import { useWeatherCache } from "../hooks/useWeatherCache";

const Home = () => {
  const { user } = useAuth();
  const { hasPendingUpdates } = useUserSettings();
  const {
    themeMode,
    nightEffectsEnabled,
    clockEnabled,
    weatherEnabled,
    stars,
    cycleTheme,
    setTheme,
    toggleNightEffects,
    toggleClock,
    toggleWeather,
    settingsLoading,
  } = useNightMode();

  const [weatherAvailable, setWeatherAvailable] = useState(false);
  const [weatherStatus, setWeatherStatus] = useState<'loading' | 'error' | 'unavailable' | 'available'>('unavailable');

  // Get weather status from the hook
  const { loading, error } = useWeatherCache();

  // Update weather status based on hook state
  useMemo(() => {
    if (loading) {
      setWeatherStatus('loading');
    } else if (error) {
      setWeatherStatus('error');
    } else if (weatherAvailable) {
      setWeatherStatus('available');
    } else {
      setWeatherStatus('unavailable');
    }
  }, [loading, error, weatherAvailable]);

  // Memoize the weather availability callback to prevent unnecessary re-renders
  const handleWeatherAvailable = useCallback((available: boolean) => {
    setWeatherAvailable(available);
  }, []);

  // Memoize the SideTaskBar props to prevent unnecessary re-renders
  const sideTaskBarProps = useMemo(() => ({
    themeMode,
    nightEffectsEnabled,
    clockEnabled,
    weatherEnabled,
    weatherAvailable,
    weatherStatus,
    onCycleTheme: cycleTheme,
    onSetTheme: setTheme,
    onToggleNightEffects: toggleNightEffects,
    onToggleClock: toggleClock,
    onToggleWeather: toggleWeather,
    hasPendingUpdates,
  }), [
    themeMode,
    nightEffectsEnabled,
    clockEnabled,
    weatherEnabled,
    weatherAvailable,
    weatherStatus,
    cycleTheme,
    setTheme,
    toggleNightEffects,
    toggleClock,
    toggleWeather,
    hasPendingUpdates,
  ]);

  // Show loading screen for authenticated users while settings load
  if (user && settingsLoading) {
    return <SettingsLoader />;
  }

  return (
    <>
      <SideTaskBar {...sideTaskBarProps} />
      <div className="flex items-center justify-center min-h-screen">
        <SoundSlider
          themeMode={themeMode}
          nightEffectsEnabled={nightEffectsEnabled}
          clockEnabled={clockEnabled}
          weatherEnabled={weatherEnabled}
          weatherAvailable={weatherAvailable}
          onWeatherAvailable={handleWeatherAvailable}
          stars={stars}
        />
      </div>
    </>
  );
};

export default Home;
