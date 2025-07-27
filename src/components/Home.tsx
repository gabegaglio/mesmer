import SoundSlider from "./SoundSlider";
import SideTaskBar from "./SideTaskBar";
import { useNightMode } from "../hooks/useTheme";
import { useAuth } from "../contexts/AuthContext";
import { useUserSettings } from "../hooks/useUserSettings";
import { SettingsLoader } from "./SettingsLoader";

const Home = () => {
  const { user } = useAuth();
  const { hasPendingUpdates } = useUserSettings();
  const {
    themeMode,
    nightEffectsEnabled,
    clockEnabled,
    stars,
    cycleTheme,
    setTheme,
    toggleNightEffects,
    toggleClock,
    settingsLoading,
  } = useNightMode();

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
        onCycleTheme={cycleTheme}
        onSetTheme={setTheme}
        onToggleNightEffects={toggleNightEffects}
        onToggleClock={toggleClock}
        hasPendingUpdates={hasPendingUpdates}
      />
      <div className="flex items-center justify-center min-h-screen">
        <SoundSlider
          themeMode={themeMode}
          nightEffectsEnabled={nightEffectsEnabled}
          clockEnabled={clockEnabled}
          stars={stars}
        />
      </div>
    </>
  );
};

export default Home;
