// Type definitions for sound presets functionality

// Sound preset definition
export interface SoundPreset {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  // Populated from joins
  preset_sounds?: PresetSound[];
}

// Individual sound in a preset with volume settings
export interface PresetSound {
  preset_id: string;
  sound_id?: string; // For custom sounds (UUID from sounds table)
  sound_key?: string; // For built-in sounds (ocean, rain, etc.)
  volume: number; // 0.0 to 1.0 (database scale)
  is_muted: boolean;
  sort_order: number;
  // Populated from joins (for custom sounds only)
  sounds?: {
    id: string;
    name: string;
    file_path: string;
    category: string;
  };
}

// Input type for creating presets
export interface CreatePresetInput {
  name: string;
  description?: string;
  sounds: PresetSoundInput[];
}

// Input type for individual sounds in a preset
export interface PresetSoundInput {
  soundId?: string; // For custom sounds
  soundKey?: string; // For built-in sounds
  volume: number; // 0.0 to 1.0
  isMuted?: boolean;
  sortOrder?: number;
}

// Volume configuration for the UI (different scale)
export interface VolumeConfiguration {
  [soundKey: string]: number; // 0-100 scale for sliders
}

// Preset summary for lists and dropdowns
export interface PresetSummary {
  id: string;
  name: string;
  description?: string;
  is_favorite: boolean;
  soundCount: number;
  created_at: string;
}

// Helper function to convert UI volumes (0-100) to database volumes (0-1)
export function uiVolumeToDbVolume(uiVolume: number): number {
  return Math.max(0, Math.min(1, uiVolume / 100));
}

// Helper function to convert database volumes (0-1) to UI volumes (0-100)
export function dbVolumeToUiVolume(dbVolume: number): number {
  return Math.round(Math.max(0, Math.min(100, dbVolume * 100)));
}

// Helper function to convert VolumeConfiguration to PresetSoundInput array
export function volumeConfigToPresetSounds(
  volumes: VolumeConfiguration,
  builtInSoundKeys: string[]
): PresetSoundInput[] {
  return Object.entries(volumes)
    .filter(([_, volume]) => volume > 0)
    .map(([key, volume]) => {
      const isBuiltIn = builtInSoundKeys.includes(key);
      return {
        soundKey: isBuiltIn ? key : undefined,
        soundId: isBuiltIn ? undefined : key,
        volume: uiVolumeToDbVolume(volume),
        isMuted: false,
      };
    });
}

// Helper function to convert preset sounds to VolumeConfiguration
export function presetSoundsToVolumeConfig(
  presetSounds: PresetSound[]
): VolumeConfiguration {
  const config: VolumeConfiguration = {};

  presetSounds.forEach((sound) => {
    const key = sound.sound_key || sound.sound_id;
    if (key && !sound.is_muted) {
      config[key] = dbVolumeToUiVolume(sound.volume);
    }
  });

  return config;
}

// Alias functions for cleaner API naming
export const convertUIVolumeToDatabase = volumeConfigToPresetSounds;
export const convertDatabaseVolumeToUI = presetSoundsToVolumeConfig;
