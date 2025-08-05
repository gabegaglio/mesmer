// SVG icon paths from public directory
const windSvg = "/svg/wind.svg";
const musicSvg = "/svg/music.svg";
const coffeeSvg = "/svg/coffee.svg";
const micSvg = "/svg/mic.svg";

// Built-in sound type (local files)
export interface BuiltInSound {
  id: string;
  key: string;
  name: string;
  fileName: string;
  category: "Nature" | "Focus" | "Urban";
  audioFile: string;
  icon: string; // SVG path
  description?: string;
  isCustom: false;
}

// Custom uploaded sound type (Supabase)
export interface CustomSound {
  id: string;
  user_id: string;
  name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  duration?: number;
  category: "Nature" | "Focus" | "Urban" | "Custom";
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  isCustom: true;
  // Runtime properties
  audioFile?: string; // Generated from file_path
  icon?: string; // SVG path based on category
}

// Union type for all sounds
export type Sound = BuiltInSound | CustomSound;

// Sound metadata for uploads
export interface SoundMetadata {
  name: string;
  category: "Nature" | "Focus" | "Urban" | "Custom";
  description?: string;
}

// Category metadata with SVG icons
export const SOUND_CATEGORIES = {
  Nature: {
    icon: windSvg,
    description: "Natural ambient sounds",
  },
  Focus: {
    icon: musicSvg,
    description: "Concentration and focus sounds",
  },
  Urban: {
    icon: coffeeSvg,
    description: "City and indoor ambiences",
  },
  Custom: {
    icon: micSvg,
    description: "Your uploaded sounds",
  },
} as const;

export type SoundCategory = keyof typeof SOUND_CATEGORIES;

// Helper function to get category info
export function getSoundCategory(
  category: string
): (typeof SOUND_CATEGORIES)[SoundCategory] {
  return SOUND_CATEGORIES[category as SoundCategory] || SOUND_CATEGORIES.Custom;
}

// Helper function to generate audio URL for custom sounds
export function getCustomSoundUrl(sound: CustomSound): string {
  if (sound.audioFile) {
    return sound.audioFile;
  }
  throw new Error(`No audio URL available for sound: ${sound.name}`);
}

// Helper function to check if sound is built-in
export function isBuiltInSound(sound: Sound): sound is BuiltInSound {
  return !sound.isCustom;
}

// Helper function to check if sound is custom
export function isCustomSound(sound: Sound): sound is CustomSound {
  return sound.isCustom;
}

// Validation helpers
export function isValidSoundCategory(
  category: string
): category is SoundCategory {
  return category in SOUND_CATEGORIES;
}

export function isValidAudioFileType(fileType: string): boolean {
  const validTypes = [
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "audio/mp4",
    "audio/x-m4a",
    "audio/webm",
  ];
  return validTypes.includes(fileType);
}

// Volume configuration type (used by components)
export interface VolumeConfiguration {
  [soundKey: string]: number; // 0-100 scale for UI
}
