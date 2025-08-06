import SoundSlider from "./SoundSlider";
import SideTaskBar from "./SideTaskBar";
import { useNightMode } from "../hooks/useTheme";
import { useAuth } from "../contexts/AuthContext";
import { useUserSettings } from "../hooks/useUserSettings";
import { SettingsLoader } from "./SettingsLoader";
import { useState } from "react";

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

  // Show loading screen for authenticated users while settings load
  if (user && settingsLoading) {
    return <SettingsLoader />;
  }

  return (
    <>
      <SideTaskBar
        themeMode={themeMode}
        nightEffectsEnabled={nightEffectsEnabled}
        clockEnabled={clockEnabled}
        weatherEnabled={weatherEnabled}
        weatherAvailable={weatherAvailable}
        onCycleTheme={cycleTheme}
        onSetTheme={setTheme}
        onToggleNightEffects={toggleNightEffects}
        onToggleClock={toggleClock}
        onToggleWeather={toggleWeather}
        hasPendingUpdates={hasPendingUpdates}
      />
      <div className="flex items-center justify-center min-h-screen">
        <SoundSlider
          themeMode={themeMode}
          nightEffectsEnabled={nightEffectsEnabled}
          clockEnabled={clockEnabled}
          weatherEnabled={weatherEnabled}
          weatherAvailable={weatherAvailable}
          onWeatherAvailable={setWeatherAvailable}
          stars={stars}
        />
      </div>
    </>
  );
};

export default Home;
