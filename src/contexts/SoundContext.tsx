import { createContext, useContext, type ReactNode } from "react";
import { useSoundPresets } from "../hooks/useSoundPresets";
import type { Sound, CustomSound as NewCustomSound } from "../types/sound";
import type { SoundPreset, VolumeConfiguration } from "../types/preset";
import type { CustomSoundUpload } from "../services/soundService";

// Legacy interface for backward compatibility
export interface PresetSound {
  id: string;
  name: string;
  fileName: string;
  category: string;
  audioFile: string;
  icon: string;
  isCustom: false;
}

// Legacy custom sound interface (for compatibility only)
export interface CustomSound {
  id: string;
  name: string;
  fileName: string;
  category: string;
  audioData: ArrayBuffer;
  dateAdded: Date;
  fileSize: number;
  icon: string;
  isCustom: true;
}

// Sound selection tracking for presets
export interface SoundSelections {
  [slotKey: string]: string; // Maps slot key to sound ID
}

// Updated interface that includes preset management
interface SoundContextType {
  // Sound management
  customSounds: NewCustomSound[];
  allSounds: Sound[];
  uploadSound: (file: File, metadata: CustomSoundUpload) => Promise<void>;
  deleteCustomSound: (soundId: string) => Promise<void>;
  getSoundsByCategory: () => Record<string, Sound[]>;

  // Preset system
  userPresets: SoundPreset[];
  currentVolumes: VolumeConfiguration;
  currentSoundSelections: SoundSelections; // Track which sounds are selected
  updateVolume: (soundKey: string, volume: number) => void;
  updateSoundSelection: (slotKey: string, soundId: string) => void; // Update sound selection
  setCurrentVolumes: (volumes: VolumeConfiguration) => void;
  setCurrentSoundSelections: (selections: SoundSelections) => void;
  clearAllVolumes: () => void;

  // Preset management
  saveCurrentAsPreset: (name: string, description?: string) => Promise<void>;
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

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const useSounds = () => {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error("useSounds must be used within a SoundProvider");
  }
  return context;
};

interface SoundProviderProps {
  children: ReactNode;
}

export const SoundProvider = ({ children }: SoundProviderProps) => {
  // Use the new hook
  const {
    customSounds,
    allSounds,
    uploadSound,
    deleteCustomSound,
    userPresets,
    currentVolumes,
    currentSoundSelections,
    updateVolume,
    updateSoundSelection,
    setCurrentVolumes,
    setCurrentSoundSelections,
    clearAllVolumes,
    saveCurrentAsPreset,
    loadPreset,
    deletePreset,
    updatePreset,
    togglePresetFavorite,
    isLoading,
    isUploading,
    isSaving,
    error,
  } = useSoundPresets();

  const getSoundsByCategory = (): Record<string, Sound[]> => {
    const categorized = allSounds.reduce((acc, sound) => {
      if (!acc[sound.category]) {
        acc[sound.category] = [];
      }
      acc[sound.category].push(sound);
      return acc;
    }, {} as Record<string, Sound[]>);

    return categorized;
  };

  // Wrapper function to match interface expectation
  const saveCurrentAsPresetWrapper = async (
    name: string,
    description?: string
  ): Promise<void> => {
    await saveCurrentAsPreset(name, description);
  };

  return (
    <SoundContext.Provider
      value={{
        // Sound management
        customSounds,
        allSounds,
        uploadSound,
        deleteCustomSound,
        getSoundsByCategory,

        // Preset system
        userPresets,
        currentVolumes,
        currentSoundSelections,
        updateVolume,
        updateSoundSelection,
        setCurrentVolumes,
        setCurrentSoundSelections,
        clearAllVolumes,
        saveCurrentAsPreset: saveCurrentAsPresetWrapper,
        loadPreset,
        deletePreset,
        updatePreset,
        togglePresetFavorite,

        // Loading states
        isLoading,
        isUploading,
        isSaving,
        error,
      }}
    >
      {children}
    </SoundContext.Provider>
  );
};
