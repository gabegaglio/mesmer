import { useState, useEffect } from "react";
import type { Sound } from "../types/sound";
import { isBuiltInSound } from "../types/sound";
import { useSounds } from "../contexts/SoundContext";
import type { SlotKey } from "./useHowlerAudio";
import { SLOT_KEYS } from "./useHowlerAudio";

const DEFAULT_SOUND_KEYS = [
  "ocean",
  "rain",
  "chimes",
  "fire",
  "crickets",
  "wind",
];

export function useSlotAudio() {
  const { allSounds, currentVolumes, setCurrentVolumes } = useSounds();

  // Get default preset sounds for initial state
  const getDefaultSound = (soundKey: string): Sound => {
    return (
      allSounds.find(
        (sound) => isBuiltInSound(sound) && sound.key === soundKey
      ) || allSounds[0]
    );
  };

  // Local state for UI responsiveness with persistence
  const [volumes, setVolumes] = useState<Record<SlotKey, number>>(() => {
    // Try to restore from localStorage first
    try {
      const saved = localStorage.getItem("mesmer-volumes");
      if (saved) {
        const parsedVolumes = JSON.parse(saved);
        return {
          slot1:
            parsedVolumes.slot1 ||
            currentVolumes.slot1 ||
            currentVolumes.ocean ||
            0,
          slot2:
            parsedVolumes.slot2 ||
            currentVolumes.slot2 ||
            currentVolumes.rain ||
            0,
          slot3:
            parsedVolumes.slot3 ||
            currentVolumes.slot3 ||
            currentVolumes.chimes ||
            0,
          slot4:
            parsedVolumes.slot4 ||
            currentVolumes.slot4 ||
            currentVolumes.fire ||
            0,
          slot5:
            parsedVolumes.slot5 ||
            currentVolumes.slot5 ||
            currentVolumes.crickets ||
            0,
          slot6:
            parsedVolumes.slot6 ||
            currentVolumes.slot6 ||
            currentVolumes.wind ||
            0,
        };
      }
    } catch (error) {
      console.warn("Failed to restore volumes from localStorage:", error);
    }

    // Fallback to default values
    return {
      slot1: currentVolumes.slot1 || currentVolumes.ocean || 0,
      slot2: currentVolumes.slot2 || currentVolumes.rain || 0,
      slot3: currentVolumes.slot3 || currentVolumes.chimes || 0,
      slot4: currentVolumes.slot4 || currentVolumes.fire || 0,
      slot5: currentVolumes.slot5 || currentVolumes.crickets || 0,
      slot6: currentVolumes.slot6 || currentVolumes.wind || 0,
    };
  });

  // Available sounds for each slider position with persistence
  const [selectedSounds, setSelectedSounds] = useState<Record<SlotKey, Sound>>(
    () => {
      // Try to restore sound selections from localStorage
      try {
        const savedSelections = localStorage.getItem("mesmer-sound-selections");
        if (savedSelections && allSounds.length > 0) {
          const parsedSelections = JSON.parse(savedSelections);
          const restoredSounds: Record<SlotKey, Sound> = {} as Record<
            SlotKey,
            Sound
          >;

          SLOT_KEYS.forEach((slotKey, index) => {
            const savedSoundId = parsedSelections[slotKey];
            if (savedSoundId) {
              // Try to find the saved sound
              const savedSound = allSounds.find((s) => s.id === savedSoundId);
              if (savedSound) {
                restoredSounds[slotKey] = savedSound;
                return;
              }
            }
            // Fallback to default sound
            restoredSounds[slotKey] = getDefaultSound(
              DEFAULT_SOUND_KEYS[index]
            );
          });

          return restoredSounds;
        }
      } catch (error) {
        console.warn(
          "Failed to restore sound selections from localStorage:",
          error
        );
      }

      // If allSounds is available, use proper defaults immediately
      if (allSounds.length > 0) {
        return {
          slot1: getDefaultSound(DEFAULT_SOUND_KEYS[0]),
          slot2: getDefaultSound(DEFAULT_SOUND_KEYS[1]),
          slot3: getDefaultSound(DEFAULT_SOUND_KEYS[2]),
          slot4: getDefaultSound(DEFAULT_SOUND_KEYS[3]),
          slot5: getDefaultSound(DEFAULT_SOUND_KEYS[4]),
          slot6: getDefaultSound(DEFAULT_SOUND_KEYS[5]),
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
        slot1: placeholder,
        slot2: placeholder,
        slot3: placeholder,
        slot4: placeholder,
        slot5: placeholder,
        slot6: placeholder,
      };
    }
  );

  // Persist volumes to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem("mesmer-volumes", JSON.stringify(volumes));
    } catch (error) {
      console.warn("Failed to save volumes to localStorage:", error);
    }
  }, [volumes]);

  // Persist sound selections to localStorage whenever they change
  useEffect(() => {
    try {
      const selectionsToSave: Record<string, string> = {};
      Object.entries(selectedSounds).forEach(([slotKey, sound]) => {
        if (sound && sound.id !== "placeholder") {
          selectionsToSave[slotKey] = sound.id;
        }
      });
      localStorage.setItem(
        "mesmer-sound-selections",
        JSON.stringify(selectionsToSave)
      );
    } catch (error) {
      console.warn("Failed to save sound selections to localStorage:", error);
    }
  }, [selectedSounds]);

  // Restore sound selections when allSounds becomes available (for initial load)
  useEffect(() => {
    if (allSounds.length > 0) {
      setSelectedSounds((current) => {
        // Check if we're still using placeholder or incorrect sounds
        const isUsingPlaceholder = current.slot1.id === "placeholder";
        const allUsingSameSound = Object.values(current).every(
          (sound) => sound.id === current.slot1.id
        );

        if (isUsingPlaceholder || allUsingSameSound) {
          // Try to restore from localStorage first
          try {
            const savedSelections = localStorage.getItem(
              "mesmer-sound-selections"
            );
            if (savedSelections) {
              const parsedSelections = JSON.parse(savedSelections);
              const restoredSounds: Record<SlotKey, Sound> = {} as Record<
                SlotKey,
                Sound
              >;

              SLOT_KEYS.forEach((slotKey, index) => {
                const savedSoundId = parsedSelections[slotKey];
                if (savedSoundId) {
                  // Try to find the saved sound
                  const savedSound = allSounds.find(
                    (s) => s.id === savedSoundId
                  );
                  if (savedSound) {
                    restoredSounds[slotKey] = savedSound;
                    return;
                  }
                }
                // Fallback to default sound
                restoredSounds[slotKey] = getDefaultSound(
                  DEFAULT_SOUND_KEYS[index]
                );
              });

              return restoredSounds;
            }
          } catch (error) {
            console.warn("Failed to restore sound selections:", error);
          }

          // Fallback to defaults
          return {
            slot1: getDefaultSound(DEFAULT_SOUND_KEYS[0]),
            slot2: getDefaultSound(DEFAULT_SOUND_KEYS[1]),
            slot3: getDefaultSound(DEFAULT_SOUND_KEYS[2]),
            slot4: getDefaultSound(DEFAULT_SOUND_KEYS[3]),
            slot5: getDefaultSound(DEFAULT_SOUND_KEYS[4]),
            slot6: getDefaultSound(DEFAULT_SOUND_KEYS[5]),
          };
        }

        // Don't reset if user has already made proper selections
        return current;
      });
    }
  }, [allSounds.length]);

  // Update global context only when volumes stabilize (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const soundVolumes: Record<string, number> = {};

      Object.entries(selectedSounds).forEach(([slotKey, sound]) => {
        if (sound && sound.id !== "placeholder") {
          const soundIdentifier = isBuiltInSound(sound) ? sound.key : sound.id;
          const volume = volumes[slotKey as SlotKey] || 0;
          soundVolumes[soundIdentifier] = volume;
        }
      });

      // Only update if there are actual changes to avoid unnecessary updates
      const currentKeys = Object.keys(currentVolumes).sort();
      const newKeys = Object.keys(soundVolumes).sort();
      const hasChanges =
        currentKeys.length !== newKeys.length ||
        currentKeys.some((key) => currentVolumes[key] !== soundVolumes[key]) ||
        newKeys.some((key) => currentVolumes[key] !== soundVolumes[key]);

      if (hasChanges) {
        setCurrentVolumes(soundVolumes);
        console.log("Global context updated with volumes:", soundVolumes);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [volumes, selectedSounds, currentVolumes]);

  // Volume change handler
  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const slotKey = event.target.name as SlotKey;
    const volume = parseInt(event.target.value);

    setVolumes((prev) => ({
      ...prev,
      [slotKey]: volume,
    }));
  };

  // Sound change handler
  const handleSoundChange = (slotKey: SlotKey, newSound: Sound) => {
    setSelectedSounds((prev) => ({
      ...prev,
      [slotKey]: newSound,
    }));
  };

  return {
    volumes,
    selectedSounds,
    setVolumes,
    setSelectedSounds,
    handleVolumeChange,
    handleSoundChange,
    getDefaultSound,
  };
}
