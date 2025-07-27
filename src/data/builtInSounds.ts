// Import SVG icons
import oceanSvg from "../assets/svg/ocean.svg";
import rainSvg from "../assets/svg/rain.svg";
import fireSvg from "../assets/svg/fire.svg";
import cricketsSvg from "../assets/svg/crickets.svg";
import windSvg from "../assets/svg/wind.svg";
import musicSvg from "../assets/svg/music.svg";
import chimesSvg from "../assets/svg/chimes.svg";
import coffeeSvg from "../assets/svg/coffee.svg";
import micSvg from "../assets/svg/mic.svg";

export interface BuiltInSound {
  id: string;
  key: string; // Used for preset_sounds.sound_key
  name: string;
  fileName: string;
  category: "Nature" | "Focus" | "Urban";
  audioFile: string;
  icon: string; // SVG path instead of emoji
  description?: string;
  isCustom: false;
}

export const BUILT_IN_SOUNDS: BuiltInSound[] = [
  // Nature Category
  {
    id: "ocean-waves",
    key: "ocean",
    name: "Ocean Waves",
    fileName: "ocean.mp3",
    category: "Nature",
    audioFile: "/presets/nature/ocean.mp3",
    icon: oceanSvg,
    description: "Gentle waves lapping against the shore",
    isCustom: false,
  },
  {
    id: "gentle-rain",
    key: "rain",
    name: "Gentle Rain",
    fileName: "rain.mp3",
    category: "Nature",
    audioFile: "/presets/nature/rain.mp3",
    icon: rainSvg,
    description: "Soft rainfall on leaves",
    isCustom: false,
  },
  {
    id: "crackling-fire",
    key: "fire",
    name: "Crackling Fire",
    fileName: "fire.mp3",
    category: "Nature",
    audioFile: "/presets/nature/fire.mp3",
    icon: fireSvg,
    description: "Warm crackling fireplace",
    isCustom: false,
  },
  {
    id: "chirping-crickets",
    key: "crickets",
    name: "Chirping Crickets",
    fileName: "crickets.mp3",
    category: "Nature",
    audioFile: "/presets/nature/crickets.mp3",
    icon: cricketsSvg,
    description: "Peaceful cricket sounds",
    isCustom: false,
  },
  {
    id: "whispering-wind",
    key: "wind",
    name: "Whispering Wind",
    fileName: "wind.mp3",
    category: "Nature",
    audioFile: "/presets/nature/wind.mp3",
    icon: windSvg,
    description: "Gentle wind through trees",
    isCustom: false,
  },

  // Focus Category
  {
    id: "white-noise",
    key: "white",
    name: "White Noise",
    fileName: "white.mp3",
    category: "Focus",
    audioFile: "/presets/focus/white.mp3",
    icon: musicSvg,
    description: "Pure white noise for concentration",
    isCustom: false,
  },
  {
    id: "brown-noise",
    key: "brown",
    name: "Brown Noise",
    fileName: "brown.mp3",
    category: "Focus",
    audioFile: "/presets/focus/brown.mp3",
    icon: musicSvg,
    description: "Deep brown noise for focus",
    isCustom: false,
  },
  {
    id: "pink-noise",
    key: "pink",
    name: "Pink Noise",
    fileName: "pink.mp3",
    category: "Focus",
    audioFile: "/presets/focus/pink.mp3",
    icon: musicSvg,
    description: "Balanced pink noise",
    isCustom: false,
  },

  // Urban Category
  {
    id: "cafe-ambience",
    key: "cafe",
    name: "Cafe Ambience",
    fileName: "cafe.mp3",
    category: "Urban",
    audioFile: "/presets/urban/cafe.mp3",
    icon: coffeeSvg,
    description: "Cozy coffee shop atmosphere",
    isCustom: false,
  },
  {
    id: "distant-chimes",
    key: "chimes",
    name: "Distant Chimes",
    fileName: "chimes.mp3",
    category: "Urban",
    audioFile: "/presets/urban/chimes.mp3",
    icon: chimesSvg,
    description: "Gentle wind chimes",
    isCustom: false,
  },
];

export const SOUND_CATEGORIES = {
  Nature: {
    icon: windSvg, // Use wind SVG for nature category
    description: "Natural ambient sounds",
  },
  Focus: {
    icon: musicSvg, // Use music SVG for focus category
    description: "Concentration and focus sounds",
  },
  Urban: {
    icon: coffeeSvg, // Use coffee SVG for urban category
    description: "City and indoor ambiences",
  },
  Custom: {
    icon: micSvg, // Use mic SVG for custom category
    description: "Your uploaded sounds",
  },
} as const;

// Helper functions
export function getSoundByKey(key: string): BuiltInSound | undefined {
  return BUILT_IN_SOUNDS.find((sound) => sound.key === key);
}

export function getSoundsByCategory(
  category: "Nature" | "Focus" | "Urban"
): BuiltInSound[] {
  return BUILT_IN_SOUNDS.filter((sound) => sound.category === category);
}

export function getAllSoundKeys(): string[] {
  return BUILT_IN_SOUNDS.map((sound) => sound.key);
}
