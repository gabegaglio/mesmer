import { useState, useEffect } from "react";
import Toolbar from "./ToolBar/Toolbar";
import SoundDropdown from "./SoundDropdown/SoundDropdown";
import PresetManager from "./PresetManager/PresetManager";
import { useSounds } from "../contexts/SoundContext";
import { useShootingStar } from "../hooks/useShootingStar";
import { useSlotAudio } from "../hooks/useSlotAudio";
import { useHowlerAudio } from "../hooks/useHowlerAudio";
import { useAudioControls } from "../hooks/useAudioControls";
import Clock from "./Clock";
import { type ThemeMode } from "../hooks/useTheme";
import type { SlotKey } from "../hooks/useHowlerAudio";

interface SoundSliderProps {
  themeMode: ThemeMode;
  nightEffectsEnabled: boolean;
  clockEnabled: boolean;
  stars: Array<{ x: number; y: number; id: number }>;
}

export default function SoundSlider({
  themeMode,
  nightEffectsEnabled,
  clockEnabled,
  stars,
}: SoundSliderProps) {
  const { allSounds, setCurrentVolumes } = useSounds();

  // Audio state management
  const {
    volumes,
    selectedSounds,
    setVolumes,
    setSelectedSounds,
    handleVolumeChange,
    handleSoundChange,
    getDefaultSound,
  } = useSlotAudio();

  // Audio controls (mute, reset, presets)
  const {
    isMuted,
    showPresetManager,
    setShowPresetManager,
    toggleMute,
    handleResetWithContext,
    handleApplyPreset,
  } = useAudioControls({
    volumes,
    setVolumes,
    selectedSounds,
    setSelectedSounds,
    setCurrentVolumes,
    stopAllHowls: () => stopAll(),
    getDefaultSound,
    allSounds,
  });

  // Howler.js audio management
  const { updateVolume, stopAll } = useHowlerAudio({
    selectedSounds,
    volumes,
    isMuted,
  });

  // UI state
  const [isMediumScreen, setIsMediumScreen] = useState(false);

  // Night effects
  const { shootingStars, crazyStars } = useShootingStar(
    themeMode,
    nightEffectsEnabled
  );

  // Screen size detection
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMediumScreen(window.innerWidth >= 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Calculate total active sounds for preset button
  const activeSoundsCount = Object.values(volumes).filter((v) => v > 0).length;

  // Theme check helpers
  const isLightTheme = themeMode === "day";

  return (
    <div
      className={`w-screen h-screen flex justify-center items-center relative overflow-hidden transition-all duration-700 ${
        themeMode === "day"
          ? "bg-gradient-to-br from-[#56ccf2] to-[#2f80ed]"
          : themeMode === "night"
          ? "bg-gradient-to-br from-[#000000] to-[#434343]"
          : themeMode === "midnight"
          ? "bg-gradient-to-br from-[#8e2de2] to-[#4a00e0]"
          : "bg-gradient-to-br from-[#8e9eab] to-[#eef2f3]"
      }`}
    >
      {/* Night effects */}
      {nightEffectsEnabled && themeMode === "night" && (
        <>
          {/* Shooting stars */}
          {shootingStars.map((star) => (
            <div
              key={star.id}
              className="absolute w-1 h-1 bg-white rounded-full shooting-star opacity-70"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                animation: "shooting 3s linear infinite",
              }}
            />
          ))}

          {/* Crazy stars effect */}
          {crazyStars.map((star) => (
            <div
              key={star.id}
              className="absolute w-0.5 h-0.5 bg-white rounded-full animate-pulse"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                opacity: 0.7,
              }}
            />
          ))}
        </>
      )}

      {/* Static background stars */}
      {nightEffectsEnabled &&
        (themeMode === "night" || themeMode === "midnight") && (
          <>
            {stars.map((star) => (
              <div
                key={star.id}
                className="absolute w-0.5 h-0.5 bg-white rounded-full animate-pulse"
                style={{
                  left: `${star.x}%`,
                  top: `${star.y}%`,
                  opacity: 0.8,
                }}
              />
            ))}
          </>
        )}

      {/* Clock */}
      {clockEnabled && <Clock themeMode={themeMode} />}

      <div className={`w-fit h-fit mt-0 md:mt-12`}>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
          {Object.entries(selectedSounds).map(([key, sound]) => (
            <div
              className="w-fit flex flex-col items-center justify-center my-2 md:my-0"
              key={key}
            >
              <div className="flex flex-row md:flex-col items-center justify-center gap-4 md:gap-16">
                {/* SVG first on mobile (left side), slider first on desktop (top) */}
                <div className="flex items-center md:order-2">
                  <SoundDropdown
                    currentSound={sound}
                    onSoundChange={(newSound) =>
                      handleSoundChange(key as SlotKey, newSound)
                    }
                    themeMode={themeMode}
                    className="transition-all"
                  />
                </div>
                <input
                  className="cursor-grab w-40 h-1.5 md:w-28 md:h-1.5 slider md:order-1"
                  type="range"
                  min="0"
                  max="100"
                  name={key}
                  value={volumes[key as SlotKey]}
                  onChange={handleVolumeChange}
                  style={{
                    transform: isMediumScreen
                      ? "rotate(270deg)"
                      : "rotate(0deg)",
                    opacity: 0.6 + (volumes[key as SlotKey] / 100) * 0.4,
                    background: isLightTheme
                      ? "linear-gradient(to right, rgba(255,255,255,0.3), rgba(59,130,246,0.6))"
                      : "linear-gradient(to right, rgba(255,255,255,0.2), rgba(147,197,253,0.8))",
                    borderRadius: "12px",
                    outline: "none",
                    WebkitAppearance: "none",
                    transition: "opacity 0.2s ease-out",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <Toolbar
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onReset={handleResetWithContext}
        onShowPresets={() => setShowPresetManager(true)}
        themeMode={themeMode}
      />

      {/* Preset Manager Modal */}
      {showPresetManager && (
        <PresetManager
          onClose={() => setShowPresetManager(false)}
          currentVolumes={volumes}
          currentSounds={selectedSounds}
          onApplyPreset={handleApplyPreset}
        />
      )}
    </div>
  );
}
