import { useState } from "react";
import { isBuiltInSound } from "../types/sound";
import type { Sound } from "../types/sound";
import type { SlotKey } from "./useHowlerAudio";
import { SLOT_KEYS } from "./useHowlerAudio";

interface UseAudioControlsProps {
  volumes: Record<SlotKey, number>;
  setVolumes: React.Dispatch<React.SetStateAction<Record<SlotKey, number>>>;
  selectedSounds: Record<SlotKey, Sound>;
  setSelectedSounds: React.Dispatch<
    React.SetStateAction<Record<SlotKey, Sound>>
  >;
  setCurrentVolumes: (volumes: Record<string, number>) => void;
  stopAllHowls: () => void;
  getDefaultSound: (soundKey: string) => Sound;
  allSounds: Sound[];
}

const DEFAULT_SOUND_KEYS = [
  "ocean",
  "rain",
  "chimes",
  "fire",
  "crickets",
  "wind",
];

export function useAudioControls({
  volumes,
  setVolumes,
  selectedSounds,
  setSelectedSounds,
  setCurrentVolumes,
  stopAllHowls,
  getDefaultSound,
  allSounds,
}: UseAudioControlsProps) {
  // Mute state
  const [isMuted, setIsMuted] = useState(false);

  // Preset management state
  const [showPresetManager, setShowPresetManager] = useState(false);

  // Mute toggle functionality
  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  // Smooth reset functionality with animation
  const handleReset = () => {
    setVolumes((prevVolumes) => {
      const slotKeys = Object.keys(prevVolumes) as SlotKey[];
      const animationDuration = 800;
      const steps = 40;
      const stepDuration = animationDuration / steps;

      // Calculate step decrements for each sound
      const stepDecrements: Record<SlotKey, number> = {} as Record<
        SlotKey,
        number
      >;
      for (const slotKey of slotKeys) {
        stepDecrements[slotKey] = prevVolumes[slotKey] / steps;
      }

      // Animate each step
      let currentStep = 0;
      const animationInterval = setInterval(() => {
        currentStep++;

        setVolumes((currentStepVolumes) => {
          const newVolumes = { ...currentStepVolumes };

          for (const slotKey of slotKeys) {
            const newVolume = Math.max(
              0,
              currentStepVolumes[slotKey] - stepDecrements[slotKey]
            );
            newVolumes[slotKey] = newVolume;
          }

          return newVolumes;
        });

        // Stop animation when complete
        if (currentStep >= steps) {
          clearInterval(animationInterval);

          // Ensure all volumes are exactly 0 at the end
          setVolumes({
            slot1: 0,
            slot2: 0,
            slot3: 0,
            slot4: 0,
            slot5: 0,
            slot6: 0,
          });

          // Stop all audio
          stopAllHowls();
        }
      }, stepDuration);

      return prevVolumes;
    });
  };

  // Enhanced reset that also clears global context and localStorage
  const handleResetWithContext = () => {
    handleReset();
    setCurrentVolumes({});

    // Clear localStorage to ensure fresh state
    try {
      localStorage.removeItem("mesmer-volumes");
      localStorage.removeItem("mesmer-sound-selections");
    } catch (error) {
      console.warn("Failed to clear localStorage during reset:", error);
    }
  };

  // Handle preset loading
  const handleApplyPreset = (presetVolumes: Record<string, number>) => {
    console.log("🔍 Loading preset with volumes:", presetVolumes);

    // CRITICAL: Stop all currently playing audio and reset volumes to 0 first
    console.log("🛑 Stopping all audio and resetting volumes to 0");
    stopAllHowls();
    
    // Reset all volumes to 0 immediately to stop any ongoing sounds
    setVolumes({
      slot1: 0,
      slot2: 0,
      slot3: 0,
      slot4: 0,
      slot5: 0,
      slot6: 0,
    });

    // Convert preset volumes (which use sound keys/IDs) back to slot-based volumes
    const newVolumes: Record<SlotKey, number> = {
      slot1: 0,
      slot2: 0,
      slot3: 0,
      slot4: 0,
      slot5: 0,
      slot6: 0,
    };

    // Track which sounds need to be restored
    const soundsToRestore: Record<SlotKey, Sound | null> = {
      slot1: null,
      slot2: null,
      slot3: null,
      slot4: null,
      slot5: null,
      slot6: null,
    };

    // First, try to map based on current selectedSounds
    Object.entries(selectedSounds).forEach(([slotKey, sound]) => {
      if (sound && sound.id !== "placeholder") {
        const soundIdentifier = isBuiltInSound(sound) ? sound.key : sound.id;
        const volume = presetVolumes[soundIdentifier];
        if (volume !== undefined) {
          newVolumes[slotKey as SlotKey] = volume;
          soundsToRestore[slotKey as SlotKey] = sound;
          console.log(
            `✅ Mapped ${soundIdentifier} to ${slotKey} with volume ${volume}`
          );
        }
      }
    });

    // For remaining preset volumes, try to find the sounds and assign them to empty slots
    const unassignedVolumes = Object.entries(presetVolumes).filter(
      ([soundKey, volume]) => {
        // Check if this sound was already assigned
        const alreadyAssigned = Object.values(soundsToRestore).some((sound) => {
          if (!sound) return false;
          const soundIdentifier = isBuiltInSound(sound) ? sound.key : sound.id;
          return soundIdentifier === soundKey;
        });
        return !alreadyAssigned && volume > 0;
      }
    );

    console.log("🔍 Unassigned volumes to restore:", unassignedVolumes);

    // Try to find sounds for unassigned volumes
    unassignedVolumes.forEach(([soundKey, volume]) => {
      // Find the sound by key (built-in) or ID (custom)
      const sound = allSounds.find((s) => {
        if (isBuiltInSound(s)) {
          return s.key === soundKey;
        } else {
          return s.id === soundKey;
        }
      });

      if (sound) {
        // Find an empty slot to assign it to
        const emptySlot = SLOT_KEYS.find(
          (slotKey) => soundsToRestore[slotKey] === null
        );
        if (emptySlot) {
          newVolumes[emptySlot] = volume;
          soundsToRestore[emptySlot] = sound;
          console.log(
            `✅ Restored ${soundKey} to ${emptySlot} with volume ${volume}`
          );
        } else {
          console.warn(`⚠️ No empty slot available for sound ${soundKey}`);
        }
      } else {
        console.warn(`⚠️ Could not find sound for key/ID: ${soundKey}`);
      }
    });

    // Also check for backward compatibility with old slot-based presets
    SLOT_KEYS.forEach((slotKey) => {
      if (presetVolumes[slotKey] !== undefined) {
        newVolumes[slotKey] = presetVolumes[slotKey];
      }
    });

    // Also check for backward compatibility with old named sound keys
    const legacyMapping: Record<string, SlotKey> = {
      ocean: "slot1",
      rain: "slot2",
      chimes: "slot3",
      fire: "slot4",
      crickets: "slot5",
      wind: "slot6",
    };

    Object.entries(legacyMapping).forEach(([oldKey, slotKey]) => {
      if (presetVolumes[oldKey] !== undefined && newVolumes[slotKey] === 0) {
        newVolumes[slotKey] = presetVolumes[oldKey];
      }
    });

    // Update sound selections first
    const newSelectedSounds: Record<SlotKey, Sound> = {
      slot1: getDefaultSound(DEFAULT_SOUND_KEYS[0]),
      slot2: getDefaultSound(DEFAULT_SOUND_KEYS[1]),
      slot3: getDefaultSound(DEFAULT_SOUND_KEYS[2]),
      slot4: getDefaultSound(DEFAULT_SOUND_KEYS[3]),
      slot5: getDefaultSound(DEFAULT_SOUND_KEYS[4]),
      slot6: getDefaultSound(DEFAULT_SOUND_KEYS[5]),
    };

    SLOT_KEYS.forEach((slotKey) => {
      const restoredSound = soundsToRestore[slotKey];
      if (restoredSound) {
        newSelectedSounds[slotKey] = restoredSound;
      } else {
        // Keep existing sound if available, otherwise use default
        const currentSound = selectedSounds[slotKey];
        if (currentSound && currentSound.id !== "placeholder") {
          newSelectedSounds[slotKey] = currentSound;
        }
        // else: keep the default sound that was already set above
      }
    });

    console.log("🔍 Restoring sound selections:", newSelectedSounds);
    setSelectedSounds(newSelectedSounds);

    // Update volumes state
    console.log("🔍 Restoring volumes:", newVolumes);
    setVolumes(newVolumes);

    // Update global context with the preset volumes
    setCurrentVolumes(presetVolumes);

    console.log("✅ Preset applied and saved to localStorage:", {
      newVolumes,
      newSelectedSounds,
      presetVolumes,
    });
  };

  return {
    isMuted,
    showPresetManager,
    setShowPresetManager,
    toggleMute,
    handleReset,
    handleResetWithContext,
    handleApplyPreset,
  };
}
