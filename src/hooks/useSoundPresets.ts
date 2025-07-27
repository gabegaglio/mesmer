import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import type { CustomSound, Sound } from "../types/sound";
import {
  type SoundPreset,
  type VolumeConfiguration,
  type CreatePresetInput,
  type PresetSoundInput,
  convertUIVolumeToDatabase,
  convertDatabaseVolumeToUI,
} from "../types/preset";
import {
  PresetService,
  type SoundPresetRecord,
} from "../services/presetService";
import { SoundService } from "../services/soundService";
import type { CustomSoundUpload } from "../services/soundService";
import { BUILT_IN_SOUNDS } from "../data/builtInSounds";

// Sound selection tracking
export interface SoundSelections {
  [slotKey: string]: string; // Maps slot key to sound ID
}

export interface UseSoundPresetsReturn {
  // Sound management
  customSounds: CustomSound[];
  allSounds: Sound[];
  uploadSound: (file: File, metadata: CustomSoundUpload) => Promise<void>;
  deleteCustomSound: (soundId: string) => Promise<void>;

  // Preset system
  userPresets: SoundPreset[];
  currentVolumes: VolumeConfiguration;
  currentSoundSelections: SoundSelections;
  updateVolume: (soundKey: string, volume: number) => void;
  updateSoundSelection: (slotKey: string, soundId: string) => void;
  setCurrentVolumes: (volumes: VolumeConfiguration) => void;
  setCurrentSoundSelections: (selections: SoundSelections) => void;
  clearAllVolumes: () => void;

  // Preset management
  saveCurrentAsPreset: (
    name: string,
    description?: string
  ) => Promise<SoundPresetRecord>;
  loadPreset: (presetId: string) => Promise<VolumeConfiguration>;
  deletePreset: (presetId: string) => Promise<void>;
  updatePreset: (
    presetId: string,
    updates: { name?: string; description?: string }
  ) => Promise<void>;
  togglePresetFavorite: (presetId: string) => Promise<void>;

  // Loading states
  isLoading: boolean;
  isUploading: boolean;
  isSaving: boolean;
  error: string | null;
}

export function useSoundPresets(): UseSoundPresetsReturn {
  const { user } = useAuth();

  // State
  const [customSounds, setCustomSounds] = useState<CustomSound[]>([]);
  const [userPresets, setUserPresets] = useState<SoundPreset[]>([]);
  const [currentVolumes, setCurrentVolumes] = useState<VolumeConfiguration>({});
  const [currentSoundSelections, setCurrentSoundSelections] =
    useState<SoundSelections>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Combine built-in and custom sounds
  const allSounds: Sound[] = [...BUILT_IN_SOUNDS, ...customSounds];

  // Initialize default sound selections
  useEffect(() => {
    if (
      Object.keys(currentSoundSelections).length === 0 &&
      allSounds.length > 0
    ) {
      const defaultSelections: SoundSelections = {};
      const builtInKeys = [
        "ocean",
        "rain",
        "chimes",
        "fire",
        "crickets",
        "wind",
      ];

      builtInKeys.forEach((key) => {
        const defaultSound = allSounds.find(
          (sound) =>
            !sound.isCustom && "key" in sound && (sound as any).key === key
        );
        if (defaultSound) {
          defaultSelections[key] = defaultSound.id;
        }
      });

      setCurrentSoundSelections(defaultSelections);
    }
  }, [allSounds.length, currentSoundSelections]);

  // Update volume for a sound
  const updateVolume = (soundKey: string, volume: number) => {
    setCurrentVolumes((prev) => ({
      ...prev,
      [soundKey]: volume,
    }));
  };

  // Update sound selection for a slot
  const updateSoundSelection = (slotKey: string, soundId: string) => {
    setCurrentSoundSelections((prev) => ({
      ...prev,
      [slotKey]: soundId,
    }));
  };

  // Clear all volumes and selections
  const clearAllVolumes = () => {
    setCurrentVolumes({});
  };

  // Load data when user changes
  useEffect(() => {
    if (user) {
      loadUserData();
    } else {
      // Clear data when user logs out
      setCustomSounds([]);
      setUserPresets([]);
      setCurrentVolumes({});
      setCurrentSoundSelections({});
      setIsLoading(false);
    }
  }, [user]);

  // Load user's custom sounds and presets
  const loadUserData = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const [sounds, presets] = await Promise.all([
        SoundService.getUserSounds(user.id),
        PresetService.getUserPresets(user.id),
      ]);

      // Convert CustomSoundRecord to CustomSound with runtime properties
      const customSoundsWithUrls: CustomSound[] = sounds.map((sound) => ({
        ...sound,
        isCustom: true as const,
        audioFile: SoundService.getPublicUrl(sound.file_path),
        icon: getSoundCategoryIcon(sound.category),
      }));

      setCustomSounds(customSoundsWithUrls);
      setUserPresets(presets);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load user data");
      console.error("Error loading user data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh functions
  const refreshSounds = async () => {
    if (!user) return;

    try {
      const sounds = await SoundService.getUserSounds(user.id);
      const customSoundsWithUrls: CustomSound[] = sounds.map((sound) => ({
        ...sound,
        isCustom: true as const,
        audioFile: SoundService.getPublicUrl(sound.file_path),
        icon: getSoundCategoryIcon(sound.category),
      }));
      setCustomSounds(customSoundsWithUrls);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh sounds");
    }
  };

  const refreshPresets = async () => {
    if (!user) return;

    try {
      const presets = await PresetService.getUserPresets(user.id);
      setUserPresets(presets);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to refresh presets"
      );
    }
  };

  // Sound management functions
  const uploadSound = async (file: File, metadata: CustomSoundUpload) => {
    if (!user) throw new Error("User not authenticated");

    setIsUploading(true);
    setError(null);

    try {
      const soundRecord = await SoundService.uploadSound(
        file,
        user.id,
        metadata
      );

      // Convert to CustomSound with runtime properties
      const customSound: CustomSound = {
        ...soundRecord,
        isCustom: true,
        audioFile: SoundService.getPublicUrl(soundRecord.file_path),
        icon: getSoundCategoryIcon(soundRecord.category),
      };

      setCustomSounds((prev) => [customSound, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload sound");
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  const deleteCustomSound = async (soundId: string) => {
    if (!user) throw new Error("User not authenticated");

    try {
      await SoundService.deleteSound(soundId, user.id);
      setCustomSounds((prev) => prev.filter((sound) => sound.id !== soundId));

      // Remove from current volumes if present
      setCurrentVolumes((prev) => {
        const updated = { ...prev };
        delete updated[soundId];
        return updated;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete sound");
      throw err;
    }
  };

  // Preset management functions
  const saveCurrentAsPreset = async (
    name: string,
    description?: string
  ): Promise<SoundPresetRecord> => {
    if (!user) throw new Error("User not authenticated");

    setIsSaving(true);
    setError(null);

    try {
      const builtInKeys = BUILT_IN_SOUNDS.map((s) => s.key);
      const sounds = convertUIVolumeToDatabase(currentVolumes, builtInKeys);

      const presetInput: CreatePresetInput = {
        name,
        description,
        sounds,
      };

      const preset = await PresetService.savePreset(user.id, presetInput);
      await refreshPresets();

      return preset;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save preset");
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const loadPreset = async (presetId: string): Promise<VolumeConfiguration> => {
    if (!user) throw new Error("User not authenticated");

    try {
      const preset = await PresetService.getPresetById(presetId, user.id);
      const volumes = convertDatabaseVolumeToUI(preset.preset_sounds || []);
      setCurrentVolumes(volumes);
      return volumes;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load preset");
      throw err;
    }
  };

  const deletePreset = async (presetId: string) => {
    if (!user) throw new Error("User not authenticated");

    try {
      await PresetService.deletePreset(presetId, user.id);
      setUserPresets((prev) => prev.filter((preset) => preset.id !== presetId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete preset");
      throw err;
    }
  };

  const updatePreset = async (
    presetId: string,
    updates: { name?: string; description?: string }
  ) => {
    if (!user) throw new Error("User not authenticated");

    try {
      const updatedPreset = await PresetService.updatePreset(
        presetId,
        user.id,
        updates
      );
      setUserPresets((prev) =>
        prev.map((preset) => (preset.id === presetId ? updatedPreset : preset))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update preset");
      throw err;
    }
  };

  const togglePresetFavorite = async (presetId: string) => {
    if (!user) throw new Error("User not authenticated");

    try {
      const updatedPreset = await PresetService.toggleFavorite(
        presetId,
        user.id
      );
      setUserPresets((prev) =>
        prev.map((preset) => (preset.id === presetId ? updatedPreset : preset))
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to toggle favorite"
      );
      throw err;
    }
  };

  // Volume management functions
  // const updateVolume = (soundKey: string, volume: number) => {
  //   setCurrentVolumes((prev) => ({
  //     ...prev,
  //     [soundKey]: Math.max(0, Math.min(100, volume)),
  //   }));
  // };

  // const clearAllVolumes = () => {
  //   setCurrentVolumes({});
  // };

  return {
    // Sound management
    customSounds,
    allSounds,
    uploadSound,
    deleteCustomSound,

    // Preset management
    userPresets,
    saveCurrentAsPreset,
    loadPreset,
    deletePreset,
    updatePreset,
    togglePresetFavorite,

    // Volume management
    currentVolumes,
    setCurrentVolumes,
    updateVolume,
    clearAllVolumes,
    currentSoundSelections,
    updateSoundSelection,
    setCurrentSoundSelections,

    // Loading states
    isLoading,
    isUploading,
    isSaving,
    error,
  };
}

// Helper function to get category icon
function getSoundCategoryIcon(category: string): string {
  switch (category) {
    case "Nature":
      return "Nature"; // Assuming SOUND_CATEGORIES is removed, so this will cause an error
    case "Focus":
      return "Focus"; // Assuming SOUND_CATEGORIES is removed, so this will cause an error
    case "Urban":
      return "Urban"; // Assuming SOUND_CATEGORIES is removed, so this will cause an error
    case "Custom":
    default:
      return "Custom"; // Assuming SOUND_CATEGORIES is removed, so this will cause an error
  }
}
