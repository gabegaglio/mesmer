import { supabase } from "../lib/supabase";
import type { BuiltInSound } from "../types/sound";

// SVG icon paths from public directory
const windSvg = "/mesmer/svg/wind.svg";
const rainSvg = "/mesmer/svg/rain.svg";
const oceanSvg = "/mesmer/svg/ocean.svg";
const fireSvg = "/mesmer/svg/fire.svg";
const cricketsSvg = "/mesmer/svg/crickets.svg";
const starSvg = "/mesmer/svg/star.svg";
const coffeeSvg = "/mesmer/svg/coffee.svg";
const chimesSvg = "/mesmer/svg/chimes.svg";

// Icon mapping
const ICON_MAP: Record<string, string> = {
  wind: windSvg,
  rain: rainSvg,
  ocean: oceanSvg,
  fire: fireSvg,
  crickets: cricketsSvg,
  star: starSvg,
  coffee: coffeeSvg,
  chimes: chimesSvg,
};

interface SupabaseBuiltinSound {
  id: string;
  key: string;
  name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  duration?: number;
  category: "Nature" | "Focus" | "Urban";
  description?: string;
  icon_key?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class BuiltinSoundsService {
  private static readonly BUCKET_NAME = "builtin-sounds";
  private static cache: BuiltInSound[] | null = null;
  private static cacheTimestamp: number = 0;
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get all built-in sounds from Supabase
   */
  static async getBuiltinSounds(): Promise<BuiltInSound[]> {
    try {
      // Check cache first
      if (
        this.cache &&
        Date.now() - this.cacheTimestamp < this.CACHE_DURATION
      ) {
        return this.cache;
      }

      console.log("🎵 Fetching built-in sounds from Supabase...");

      // Fetch from database
      const { data, error } = await supabase
        .from("builtin_sounds")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch built-in sounds: ${error.message}`);
      }

      if (!data || data.length === 0) {
        console.warn("No built-in sounds found in database");
        return [];
      }

      // Convert to BuiltInSound format
      const sounds = data.map((sound: SupabaseBuiltinSound) =>
        this.mapToBuiltInSound(sound)
      );

      // Update cache
      this.cache = sounds;
      this.cacheTimestamp = Date.now();

      console.log(`✅ Loaded ${sounds.length} built-in sounds from Supabase`);
      return sounds;
    } catch (error) {
      console.error("Failed to get built-in sounds:", error);

      // Return fallback sounds if Supabase fails
      return this.getFallbackSounds();
    }
  }

  /**
   * Get public URL for a built-in sound file
   */
  static getPublicUrl(filePath: string): string {
    const { data } = supabase.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  /**
   * Clear cache (useful for development or manual refresh)
   */
  static clearCache(): void {
    this.cache = null;
    this.cacheTimestamp = 0;
  }

  /**
   * Map Supabase record to BuiltInSound
   */
  private static mapToBuiltInSound(sound: SupabaseBuiltinSound): BuiltInSound {
    const publicUrl = this.getPublicUrl(sound.file_path);
    const icon = ICON_MAP[sound.icon_key || "star"] || starSvg;

    return {
      id: sound.id,
      key: sound.key,
      name: sound.name,
      fileName: sound.file_path.split("/").pop() || sound.key,
      category: sound.category,
      audioFile: publicUrl,
      icon,
      description: sound.description,
      isCustom: false,
    };
  }

  /**
   * Fallback sounds (your original hardcoded sounds as backup)
   */
  private static getFallbackSounds(): BuiltInSound[] {
    console.warn("Using fallback sounds due to Supabase error");

    return [
      {
        id: "rain-fallback",
        key: "rain",
        name: "Rain",
        fileName: "rain.mp3",
        category: "Nature",
        audioFile: "/presets/nature/rain.mp3", // Fallback to public files
        icon: rainSvg,
        description: "Gentle rainfall sounds",
        isCustom: false,
      },
      {
        id: "ocean-fallback",
        key: "ocean",
        name: "Ocean",
        fileName: "ocean.mp3",
        category: "Nature",
        audioFile: "/presets/nature/ocean.mp3", // Fallback to public files
        icon: oceanSvg,
        description: "Ocean waves and surf",
        isCustom: false,
      },
      {
        id: "fire-fallback",
        key: "fire",
        name: "Fire",
        fileName: "fire.mp3",
        category: "Nature",
        audioFile: "/presets/nature/fire.mp3",
        icon: fireSvg,
        description: "Warm crackling fireplace",
        isCustom: false,
      },
      {
        id: "crickets-fallback",
        key: "crickets",
        name: "Crickets",
        fileName: "crickets.mp3",
        category: "Nature",
        audioFile: "/presets/nature/crickets.mp3",
        icon: cricketsSvg,
        description: "Peaceful cricket sounds",
        isCustom: false,
      },
      {
        id: "wind-fallback",
        key: "wind",
        name: "Wind",
        fileName: "wind.mp3",
        category: "Nature",
        audioFile: "/presets/nature/wind.mp3",
        icon: windSvg,
        description: "Gentle wind through trees",
        isCustom: false,
      },
      {
        id: "white-noise-fallback",
        key: "white",
        name: "White Noise",
        fileName: "white.mp3",
        category: "Focus",
        audioFile: "/presets/focus/white.mp3",
        icon: starSvg,
        description: "Pure white noise for concentration",
        isCustom: false,
      },
      {
        id: "brown-noise-fallback",
        key: "brown",
        name: "Brown Noise",
        fileName: "brown.mp3",
        category: "Focus",
        audioFile: "/presets/focus/brown.mp3",
        icon: starSvg,
        description: "Deep brown noise for focus",
        isCustom: false,
      },
      {
        id: "pink-noise-fallback",
        key: "pink",
        name: "Pink Noise",
        fileName: "pink.mp3",
        category: "Focus",
        audioFile: "/presets/focus/pink.mp3",
        icon: starSvg,
        description: "Balanced pink noise",
        isCustom: false,
      },
      {
        id: "cafe-fallback",
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
        id: "chimes-fallback",
        key: "chimes",
        name: "Chimes",
        fileName: "chimes.mp3",
        category: "Urban",
        audioFile: "/presets/urban/chimes.mp3",
        icon: chimesSvg,
        description: "Gentle wind chimes",
        isCustom: false,
      },
    ];
  }

  /**
   * Refresh sounds from server (bypasses cache)
   */
  static async refreshSounds(): Promise<BuiltInSound[]> {
    this.clearCache();
    return this.getBuiltinSounds();
  }

  /**
   * Get built-in sounds by category
   */
  static async getSoundsByCategory(): Promise<Record<string, BuiltInSound[]>> {
    const sounds = await this.getBuiltinSounds();

    return sounds.reduce((acc, sound) => {
      if (!acc[sound.category]) {
        acc[sound.category] = [];
      }
      acc[sound.category].push(sound);
      return acc;
    }, {} as Record<string, BuiltInSound[]>);
  }
}
