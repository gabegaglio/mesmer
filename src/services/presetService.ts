import { supabase } from "../lib/supabase";

export interface PresetSoundInput {
  soundId?: string; // For custom sounds
  soundKey?: string; // For built-in sounds (ocean, rain, etc.)
  volume: number; // 0.0 to 1.0
  isMuted?: boolean;
  sortOrder?: number;
}

export interface CreatePresetInput {
  name: string;
  description?: string;
  sounds: PresetSoundInput[];
}

export interface PresetSoundRecord {
  preset_id: string;
  sound_id?: string;
  sound_key?: string;
  volume: number;
  is_muted: boolean;
  sort_order: number;
  // Joined sound data for custom sounds
  sounds?: {
    id: string;
    name: string;
    file_path: string;
    category: string;
  };
}

export interface SoundPresetRecord {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  // Joined preset sounds
  preset_sounds?: PresetSoundRecord[];
}

export class PresetService {
  /**
   * Save a new preset for a user
   */
  static async savePreset(
    userId: string,
    preset: CreatePresetInput
  ): Promise<SoundPresetRecord> {
    try {
      console.log("🔍 PresetService Debug - Saving preset via Edge Function for user:", userId);
      console.log("🔍 PresetService Debug - Preset input:", preset);

      // Create the preset via Edge Function
      const { data, error } = await supabase.functions.invoke('createPreset', {
        body: { preset }
      });

      if (error) {
        console.error(
          "❌ PresetService Debug - Error creating preset via Edge Function:",
          error
        );
        throw new Error(`Failed to create preset: ${error.message}`);
      }

      console.log(
        "✅ PresetService Debug - Created preset via Edge Function:",
        data
      );

      // Return the complete preset with sounds
      const result = await this.getPresetById(data.data.id, userId);
      console.log("✅ PresetService Debug - Final preset result:", result);
      return result;
    } catch (error) {
      console.error("❌ PresetService Debug - Error in savePreset:", error);
      throw error;
    }
  }

  /**
   * Get all presets for a user
   */
  static async getUserPresets(userId: string): Promise<SoundPresetRecord[]> {
    try {
      const { data, error } = await supabase.functions.invoke('getUserPresets');

      if (error) {
        console.error("Error fetching user presets:", error);
        throw new Error(`Failed to fetch presets: ${error.message}`);
      }

      return data.data || [];
    } catch (error) {
      console.error("Error in getUserPresets:", error);
      throw error;
    }
  }

  /**
   * Get a specific preset by ID with all its sounds
   */
  static async getPresetById(
    presetId: string,
    userId: string
  ): Promise<SoundPresetRecord> {
    try {
      const { data, error } = await supabase.functions.invoke('getPresetSounds', {
        body: { presetId }
      });

      if (error) {
        throw new Error(`Failed to fetch preset: ${error.message}`);
      }

      return data.data;
    } catch (error) {
      console.error("Error in getPresetById:", error);
      throw error;
    }
  }

  /**
   * Update preset metadata (name, description, favorite status)
   */
  static async updatePreset(
    presetId: string,
    userId: string,
    updates: Partial<
      Pick<CreatePresetInput, "name" | "description"> & { isFavorite: boolean }
    >
  ): Promise<SoundPresetRecord> {
    try {
      const { data, error } = await supabase.functions.invoke('updatePreset', {
        body: { presetId, updates }
      });

      if (error) {
        throw new Error(`Failed to update preset: ${error.message}`);
      }

      return await this.getPresetById(presetId, userId);
    } catch (error) {
      console.error("Error in updatePreset:", error);
      throw error;
    }
  }

  /**
   * Delete a preset and all its associated sounds
   */
  static async deletePreset(presetId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase.functions.invoke('deletePreset', {
        body: { presetId }
      });

      if (error) {
        throw new Error(`Failed to delete preset: ${error.message}`);
      }
    } catch (error) {
      console.error("Error in deletePreset:", error);
      throw error;
    }
  }

  /**
   * Update preset sounds (replace all sounds in a preset)
   */
  static async updatePresetSounds(
    presetId: string,
    userId: string,
    sounds: PresetSoundInput[]
  ): Promise<SoundPresetRecord> {
    try {
      const { data, error } = await supabase.functions.invoke('updatePresetSounds', {
        body: { presetId, sounds }
      });

      if (error) {
        throw new Error(`Failed to update preset sounds: ${error.message}`);
      }

      return await this.getPresetById(presetId, userId);
    } catch (error) {
      console.error("Error in updatePresetSounds:", error);
      throw error;
    }
  }

  /**
   * Toggle favorite status for a preset
   */
  static async toggleFavorite(
    presetId: string,
    userId: string
  ): Promise<SoundPresetRecord> {
    try {
      const { data, error } = await supabase.functions.invoke('togglePresetFavorite', {
        body: { presetId }
      });

      if (error) {
        throw new Error(`Failed to toggle favorite: ${error.message}`);
      }

      return await this.getPresetById(presetId, userId);
    } catch (error) {
      console.error("Error in toggleFavorite:", error);
      throw error;
    }
  }
}
