import { useState, useEffect, useRef } from "react";
import Toolbar from "./ToolBar/Toolbar";
import SoundDropdown from "./SoundDropdown/SoundDropdown";
import PresetManager from "./PresetManager/PresetManager";
import { useSounds } from "../contexts/SoundContext";
import type { Sound } from "../types/sound";
import { isBuiltInSound } from "../types/sound";
import { useShootingStar } from "../hooks/useShootingStar";
import Clock from "./Clock";
import { type ThemeMode } from "../hooks/useTheme";

import { useMute } from "../hooks/useMute";
import { useReset } from "../hooks/useReset";

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
  const audioRef = useRef<Record<string, HTMLAudioElement>>({});
  const { allSounds, currentVolumes, updateVolume, setCurrentVolumes } =
    useSounds();

  // MEMORY LEAK FIX: Track all blob URLs for comprehensive cleanup
  const blobUrlsRef = useRef<Set<string>>(new Set());

  type SoundKey = "ocean" | "rain" | "chimes" | "fire" | "crickets" | "wind";

  // Preset management state
  const [showPresetManager, setShowPresetManager] = useState(false);

  // Get default preset sounds for initial state
  const getDefaultSound = (soundKey: string): Sound => {
    return (
      allSounds.find(
        (sound) => isBuiltInSound(sound) && sound.key === soundKey
      ) || allSounds[0]
    );
  };

  // Use the global volume state from context, but maintain local state for compatibility
  const [volumes, setVolumes] = useState<Record<SoundKey, number>>({
    ocean: currentVolumes.ocean || 0,
    rain: currentVolumes.rain || 0,
    chimes: currentVolumes.chimes || 0,
    fire: currentVolumes.fire || 0,
    crickets: currentVolumes.crickets || 0,
    wind: currentVolumes.wind || 0,
  });

  // Sync local volumes with global context
  useEffect(() => {
    setVolumes({
      ocean: currentVolumes.ocean || 0,
      rain: currentVolumes.rain || 0,
      chimes: currentVolumes.chimes || 0,
      fire: currentVolumes.fire || 0,
      crickets: currentVolumes.crickets || 0,
      wind: currentVolumes.wind || 0,
    });
  }, [currentVolumes]);

  // Available sounds for each slider position - initialize with proper defaults when allSounds is available
  const [selectedSounds, setSelectedSounds] = useState<Record<SoundKey, Sound>>(
    () => {
      // If allSounds is available, use proper defaults immediately
      if (allSounds.length > 0) {
        return {
          ocean: getDefaultSound("ocean"),
          rain: getDefaultSound("rain"),
          chimes: getDefaultSound("chimes"),
          fire: getDefaultSound("fire"),
          crickets: getDefaultSound("crickets"),
          wind: getDefaultSound("wind"),
        };
      }

      // Otherwise, use a placeholder that will be replaced
      const placeholder: Sound = {
        id: "placeholder",
        name: "Loading...",
        fileName: "",
        category: "Nature",
        audioFile: "",
        icon: "",
        isCustom: false,
        key: "placeholder",
      };

      return {
        ocean: placeholder,
        rain: placeholder,
        chimes: placeholder,
        fire: placeholder,
        crickets: placeholder,
        wind: placeholder,
      };
    }
  );

  // Initialize selectedSounds when allSounds becomes available
  useEffect(() => {
    if (allSounds.length > 0) {
      setSelectedSounds((current) => {
        // Check if we're still using placeholder or incorrect sounds
        const isUsingPlaceholder = current.ocean.id === "placeholder";
        const allUsingSameSound = Object.values(current).every(
          (sound) => sound.id === current.ocean.id
        );

        if (isUsingPlaceholder || allUsingSameSound) {
          return {
            ocean: getDefaultSound("ocean"),
            rain: getDefaultSound("rain"),
            chimes: getDefaultSound("chimes"),
            fire: getDefaultSound("fire"),
            crickets: getDefaultSound("crickets"),
            wind: getDefaultSound("wind"),
          };
        }

        // Don't reset if user has already made proper selections
        return current;
      });
    }
  }, [allSounds.length]); // Only depend on length, not the entire array

  const { isMuted, toggleMute } = useMute(audioRef, volumes);

  // Initialize and update audio elements when selectedSounds change
  useEffect(() => {
    Object.entries(selectedSounds).forEach(([key, sound]) => {
      const soundKey = key as SoundKey;
      const existingAudio = audioRef.current[soundKey];
      const currentVolume = volumes[soundKey] || 0;

      // Always update the audio element if the sound has an audioFile
      if (sound.audioFile) {
        // Check if we need to create or replace the audio element
        let needsReplacement = !existingAudio;

        if (existingAudio) {
          // Compare the audio file paths - extract filename for comparison
          const currentFileName = existingAudio.src
            .split("/")
            .pop()
            ?.split("?")[0];
          const newFileName = sound.audioFile.split("/").pop()?.split("?")[0];
          needsReplacement = currentFileName !== newFileName;
        }

        if (needsReplacement) {
          // Clean up existing audio if it exists
          if (existingAudio) {
            existingAudio.pause();
            if (existingAudio.src && existingAudio.src.startsWith("blob:")) {
              URL.revokeObjectURL(existingAudio.src);
            }
          }

          // Create new audio element with the correct source
          const audioElement = new Audio(sound.audioFile);
          audioElement.preload = "auto";
          audioElement.loop = true;
          audioElement.volume = isMuted ? 0 : currentVolume / 100;

          // Set up the audio element
          audioRef.current[soundKey] = audioElement;

          // If there was a volume level, start playing the new sound
          if (currentVolume > 0 && !isMuted) {
            audioElement.addEventListener(
              "canplaythrough",
              () => {
                audioElement.play().catch(console.warn);
              },
              { once: true }
            );
          }

          console.log(
            `Audio ${soundKey} replaced with: ${sound.name} (volume: ${currentVolume}%)`
          );
        }
      }
    });
  }, [selectedSounds, isMuted, volumes]);

  // Handle mute state changes
  useEffect(() => {
    Object.entries(volumes).forEach(([key, volume]) => {
      const soundKey = key as SoundKey;
      if (audioRef.current[soundKey]) {
        const audioElement = audioRef.current[soundKey];
        audioElement.volume = isMuted ? 0 : volume / 100;

        // Start playing if volume > 0 and audio is paused
        if (!isMuted && volume > 0 && audioElement.paused) {
          audioElement.play().catch(console.warn);
        }
        // Pause if muted or volume is 0
        else if ((isMuted || volume === 0) && !audioElement.paused) {
          audioElement.pause();
        }
      }
    });
  }, [isMuted, volumes]);

  const [isMediumScreen, setIsMediumScreen] = useState(false);

  const { shootingStars, crazyStars } = useShootingStar(
    themeMode,
    nightEffectsEnabled
  );

  type SoundConfigurations = {
    key: SoundKey;
    name: string;
    file: string;
    volume: number;
    image: string;
  };

  // Convert selectedSounds to the format expected by existing hooks
  const sounds: SoundConfigurations[] = Object.entries(selectedSounds).map(
    ([key, sound]) => ({
      key: key as SoundKey,
      name: sound.name,
      file: sound.isCustom ? "" : sound.audioFile, // Will handle custom sounds differently
      volume: volumes[key as SoundKey],
      image: sound.icon || "", // Provide fallback for undefined icon
    })
  );

  // Custom volume change handler that syncs with global context
  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const soundKey = event.target.name as SoundKey;
    const volume = parseInt(event.target.value);

    // Update local state
    setVolumes((prevVolumes) => ({
      ...prevVolumes,
      [soundKey]: volume,
    }));

    // Update global context
    updateVolume(soundKey, volume);

    // Update audio - ensure audio element exists and control playback
    if (audioRef.current[soundKey]) {
      const audioElement = audioRef.current[soundKey];
      audioElement.volume = isMuted ? 0 : volume / 100;

      // Start playing if volume > 0 and audio is paused
      if (volume > 0 && audioElement.paused) {
        audioElement.play().catch(console.warn);
      }
      // Pause if volume is 0
      else if (volume === 0 && !audioElement.paused) {
        audioElement.pause();
      }
    }
  };

  // Handle direct slider interaction for audio initialization
  const handleSliderInteraction = (
    event: React.MouseEvent | React.TouchEvent
  ) => {
    // Create audio elements if they don't exist
    Object.entries(selectedSounds).forEach(([key, sound]) => {
      const soundKey = key as SoundKey;
      if (!audioRef.current[soundKey] && sound.audioFile) {
        const audioElement = new Audio(sound.audioFile);
        audioElement.preload = "auto";
        audioElement.loop = true;
        audioElement.volume = 0;
        audioRef.current[soundKey] = audioElement;
      }
    });
  };

  // Use the reset hook to get the handleReset function
  const { handleReset } = useReset(audioRef, setVolumes);

  // Enhanced reset that also clears global context
  const handleResetWithContext = () => {
    handleReset();
    setCurrentVolumes({});
  };

  // Handle preset loading
  const handleApplyPreset = (presetVolumes: Record<string, number>) => {
    // Update local state
    const newVolumes = {
      ocean: presetVolumes.ocean || 0,
      rain: presetVolumes.rain || 0,
      chimes: presetVolumes.chimes || 0,
      fire: presetVolumes.fire || 0,
      crickets: presetVolumes.crickets || 0,
      wind: presetVolumes.wind || 0,
    };

    setVolumes(newVolumes);

    // Update global context
    setCurrentVolumes(presetVolumes);

    // Update audio elements
    Object.entries(newVolumes).forEach(([key, volume]) => {
      if (audioRef.current[key]) {
        const audioElement = audioRef.current[key];
        audioElement.volume = isMuted ? 0 : volume / 100;

        if (volume > 0 && audioElement.paused) {
          audioElement.play().catch(console.warn);
        } else if (volume === 0 && !audioElement.paused) {
          audioElement.pause();
        }
      }
    });
  };

  // Helper function to revoke and untrack blob URL
  const revokeBlobUrl = (url: string) => {
    if (blobUrlsRef.current.has(url)) {
      URL.revokeObjectURL(url);
      blobUrlsRef.current.delete(url);
    }
  };

  // Handle sound changes from dropdown
  function handleSoundChange(sliderKey: SoundKey, newSound: Sound) {
    setSelectedSounds((prev) => ({
      ...prev,
      [sliderKey]: newSound,
    }));

    // Update the global context to track the sound selection
    // This ensures the preset system knows which actual sound is selected
    updateVolume(sliderKey, volumes[sliderKey] || 0);

    // The useEffect will automatically handle audio element replacement
  }

  // Update the global context whenever selectedSounds changes
  useEffect(() => {
    // Create a mapping of slot keys to sound IDs for the preset system
    const soundSelections: Record<string, string> = {};
    Object.entries(selectedSounds).forEach(([key, sound]) => {
      soundSelections[key] = sound.id;
    });

    // TODO: We need to add a function to update sound selections in the context
    // For now, we'll modify the volumes to include sound ID information
    console.log("Selected sounds changed:", soundSelections);
  }, [selectedSounds]);

  // MEMORY LEAK FIX: Comprehensive cleanup effect
  useEffect(() => {
    return () => {
      // Cleanup all tracked blob URLs
      blobUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      blobUrlsRef.current.clear();

      // Cleanup all audio element blob URLs
      if (audioRef.current) {
        Object.values(audioRef.current).forEach((audio) => {
          if (audio.src && audio.src.startsWith("blob:")) {
            URL.revokeObjectURL(audio.src);
          }
        });
      }
    };
  }, []);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMediumScreen(window.innerWidth >= 768);
    };

    checkScreenSize(); // Check initial size
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Calculate total active sounds for preset button
  const activeSoundsCount = Object.values(volumes).filter((v) => v > 0).length;

  // Theme check helpers
  const isDarkTheme = themeMode === "night" || themeMode === "slate";
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
                animationDelay: `${Math.random() * 3}s`,
                opacity: Math.random() * 0.8 + 0.2,
              }}
            />
          ))}
        </>
      )}

      {/* Background stars for all themes except day - only show when nightEffectsEnabled is true */}
      {nightEffectsEnabled &&
        stars.map((star) => (
          <div
            key={star.id}
            className={`absolute w-0.5 h-0.5 rounded-full ${
              themeMode === "day"
                ? "bg-blue-200 opacity-30"
                : "bg-white opacity-60"
            } animate-pulse`}
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}

      {/* Clock component */}
      {clockEnabled && <Clock themeMode={themeMode} />}

      {/* Preset Management Button - moved to top-right corner */}
      <div className="absolute top-6 right-6 z-10">
        <button
          onClick={() => setShowPresetManager(true)}
          className="px-4 py-2 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm shadow-lg flex items-center gap-2 cursor-pointer"
        >
          <span className="hidden sm:inline">Presets</span>
          <span className="sm:hidden">Presets</span>
          {activeSoundsCount > 0 && (
            <span className="px-1.5 py-0.5 text-xs rounded-full bg-white/20 text-white">
              {activeSoundsCount}
            </span>
          )}
        </button>
      </div>

      <div className={`w-fit h-fit mt-0 md:mt-12`}>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
          {Object.entries(selectedSounds).map(([key, sound]) => (
            <div
              className="w-fit flex flex-col items-center justify-center my-2 md:my-0"
              key={key}
            >
              <div className="flex flex-row-reverse md:flex-col items-center justify-center mb-0 md:mb-6 gap-4 md:gap-6">
                <input
                  className="cursor-grab w-40 h-1.5 md:w-28 md:h-1.5 slider"
                  type="range"
                  min="0"
                  max="100"
                  name={key}
                  value={volumes[key as SoundKey]}
                  onChange={handleVolumeChange}
                  onMouseDown={handleSliderInteraction}
                  onTouchStart={handleSliderInteraction}
                  style={{
                    transform: isMediumScreen
                      ? "rotate(270deg)"
                      : "rotate(0deg)",
                    opacity: 0.6 + (volumes[key as SoundKey] / 100) * 0.4,
                    background: isLightTheme
                      ? "linear-gradient(to right, rgba(255,255,255,0.3), rgba(59,130,246,0.6))"
                      : "linear-gradient(to right, rgba(255,255,255,0.2), rgba(147,197,253,0.8))",
                    borderRadius: "12px",
                    outline: "none",
                    WebkitAppearance: "none",
                    transition: "opacity 0.2s ease-out",
                  }}
                />
                <div className="flex items-center">
                  <SoundDropdown
                    currentSound={sound}
                    onSoundChange={(newSound) =>
                      handleSoundChange(key as SoundKey, newSound)
                    }
                    themeMode={themeMode}
                    className="transition-all"
                  />
                </div>
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
