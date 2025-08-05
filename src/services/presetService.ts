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
   * Save a new sound preset with volume levels
   */
  static async savePreset(
    userId: string,
    preset: CreatePresetInput
  ): Promise<SoundPresetRecord> {
    try {
      console.log("🔍 PresetService Debug - Saving preset for user:", userId);
      console.log("🔍 PresetService Debug - Preset input:", preset);

      // Create the preset record
      const { data: presetRecord, error: presetError } = await supabase
        .from("sound_presets")
        .insert({
          user_id: userId,
          name: preset.name,
          description: preset.description,
          is_favorite: false,
        })
        .select()
        .single();

      if (presetError) {
        console.error(
          "❌ PresetService Debug - Error creating preset:",
          presetError
        );
        throw new Error(`Failed to create preset: ${presetError.message}`);
      }

      console.log(
        "✅ PresetService Debug - Created preset record:",
        presetRecord
      );

      // Create preset_sounds records
      if (preset.sounds.length > 0) {
        const presetSounds = preset.sounds.map((sound, index) => ({
          preset_id: presetRecord.id,
          sound_id: sound.soundId || null,
          sound_key: sound.soundKey || null,
          volume: Math.max(0, Math.min(1, sound.volume)), // Clamp to 0-1
          is_muted: sound.isMuted || false,
          sort_order: sound.sortOrder ?? index,
        }));

        console.log(
          "🔍 PresetService Debug - Preset sounds to insert:",
          presetSounds
        );

        const { error: soundsError } = await supabase
          .from("preset_sounds")
          .insert(presetSounds);

        if (soundsError) {
          console.error(
            "❌ PresetService Debug - Error creating preset sounds:",
            soundsError
          );

          // Clean up the preset if sounds insertion fails
          await supabase
            .from("sound_presets")
            .delete()
            .eq("id", presetRecord.id);

          throw new Error(
            `Failed to save preset sounds: ${soundsError.message}`
          );
        }

        console.log(
          "✅ PresetService Debug - Successfully inserted preset sounds"
        );
      }

      // Return the complete preset with sounds
      const result = await this.getPresetById(presetRecord.id, userId);
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
      const { data, error } = await supabase
        .from("sound_presets")
        .select(
          `
          *,
          preset_sounds (
            preset_id,
            sound_id,
            sound_key,
            volume,
            is_muted,
            sort_order,
            sounds (
              id,
              name,
              file_path,
              category
            )
          )
        `
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch presets: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error("Error in getUserPresets:", error);
      throw error;
    }
  }

  /**
   * Get a specific preset by ID
   */
  static async getPresetById(
    presetId: string,
    userId: string
  ): Promise<SoundPresetRecord> {
    try {
      const { data, error } = await supabase
        .from("sound_presets")
        .select(
          `
          *,
          preset_sounds (
            preset_id,
            sound_id,
            sound_key,
            volume,
            is_muted,
            sort_order,
            sounds (
              id,
              name,
              file_path,
              category
            )
          )
        `
        )
        .eq("id", presetId)
        .eq("user_id", userId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch preset: ${error.message}`);
      }

      return data;
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
      const { error } = await supabase
        .from("sound_presets")
        .update({
          name: updates.name,
          description: updates.description,
          is_favorite: updates.isFavorite,
          updated_at: new Date().toISOString(),
        })
        .eq("id", presetId)
        .eq("user_id", userId)
        .select()
        .single();

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
      const { error } = await supabase
        .from("sound_presets")
        .delete()
        .eq("id", presetId)
        .eq("user_id", userId);

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
      // Verify preset ownership
      const { error: verifyError } = await supabase
        .from("sound_presets")
        .select("id")
        .eq("id", presetId)
        .eq("user_id", userId)
        .single();

      if (verifyError) {
        throw new Error(`Preset not found: ${verifyError.message}`);
      }

      // Delete existing preset sounds
      const { error: deleteError } = await supabase
        .from("preset_sounds")
        .delete()
        .eq("preset_id", presetId);

      if (deleteError) {
        throw new Error(`Failed to remove old sounds: ${deleteError.message}`);
      }

      // Insert new preset sounds
      if (sounds.length > 0) {
        const presetSounds = sounds.map((sound, index) => ({
          preset_id: presetId,
          sound_id: sound.soundId || null,
          sound_key: sound.soundKey || null,
          volume: Math.max(0, Math.min(1, sound.volume)),
          is_muted: sound.isMuted || false,
          sort_order: sound.sortOrder ?? index,
        }));

        const { error: insertError } = await supabase
          .from("preset_sounds")
          .insert(presetSounds);

        if (insertError) {
          throw new Error(`Failed to save new sounds: ${insertError.message}`);
        }
      }

      // Update preset timestamp
      await supabase
        .from("sound_presets")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", presetId);

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
      // Get current favorite status
      const { data: current, error: fetchError } = await supabase
        .from("sound_presets")
        .select("is_favorite")
        .eq("id", presetId)
        .eq("user_id", userId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch preset: ${fetchError.message}`);
      }

      // Toggle the favorite status
      const { error: updateError } = await supabase
        .from("sound_presets")
        .update({
          is_favorite: !current.is_favorite,
          updated_at: new Date().toISOString(),
        })
        .eq("id", presetId)
        .eq("user_id", userId);

      if (updateError) {
        throw new Error(`Failed to update favorite: ${updateError.message}`);
      }

      return await this.getPresetById(presetId, userId);
    } catch (error) {
      console.error("Error in toggleFavorite:", error);
      throw error;
    }
  }
}
