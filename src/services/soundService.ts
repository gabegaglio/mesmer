import { supabase } from "../lib/supabase";

export interface CustomSoundUpload {
  name: string;
  category: "Nature" | "Focus" | "Urban" | "Custom";
  description?: string;
}

export interface CustomSoundRecord {
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
}

export class SoundService {
  /**
   * Upload a custom sound file to Supabase Storage and save metadata to database
   */
  static async uploadSound(
    file: File,
    userId: string,
    metadata: CustomSoundUpload
  ): Promise<CustomSoundRecord> {
    try {
      // Generate unique filename
      const fileExt = file.name.split(".").pop()?.toLowerCase();
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 8);
      const fileName = `${userId}/${timestamp}-${randomId}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: storageError } = await supabase.storage
        .from("user-sounds")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (storageError) {
        console.error("Storage upload error:", storageError);
        throw new Error(`Failed to upload file: ${storageError.message}`);
      }

      // Get audio duration
      const duration = await this.getAudioDuration(file);

      // Save metadata to database
      const { data: soundRecord, error: dbError } = await supabase
        .from("sounds")
        .insert({
          user_id: userId,
          name: metadata.name,
          file_path: fileName,
          file_size: file.size,
          file_type: file.type,
          duration,
          category: metadata.category,
          description: metadata.description,
          is_active: true,
        })
        .select()
        .single();

      if (dbError) {
        // Clean up uploaded file if database insert fails
        await supabase.storage.from("user-sounds").remove([fileName]);
        console.error("Database insert error:", dbError);
        throw new Error(`Failed to save sound metadata: ${dbError.message}`);
      }

      return soundRecord;
    } catch (error) {
      console.error("Error in uploadSound:", error);
      throw error;
    }
  }

  /**
   * Get audio duration from file using HTML5 Audio API
   */
  static async getAudioDuration(file: File): Promise<number | null> {
    return new Promise((resolve) => {
      const audio = new Audio();
      const objectUrl = URL.createObjectURL(file);

      audio.addEventListener("loadedmetadata", () => {
        URL.revokeObjectURL(objectUrl);
        resolve(audio.duration);
      });

      audio.addEventListener("error", () => {
        URL.revokeObjectURL(objectUrl);
        resolve(null);
      });

      audio.src = objectUrl;
    });
  }

  /**
   * Fetch all custom sounds for a user
   */
  static async getUserSounds(userId: string): Promise<CustomSoundRecord[]> {
    try {
      const { data, error } = await supabase.functions.invoke('getUserSounds');

      if (error) {
        console.error("Error fetching user sounds:", error);
        throw new Error(`Failed to fetch sounds: ${error.message}`);
      }

      return data.data || [];
    } catch (error) {
      console.error("Error in getUserSounds:", error);
      throw error;
    }
  }

  /**
   * Get public URL for a custom sound file
   */
  static getPublicUrl(filePath: string): string {
    const { data } = supabase.storage
      .from("user-sounds")
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  /**
   * Delete a custom sound (marks as inactive and removes file)
   */
  static async deleteSound(soundId: string, userId: string): Promise<void> {
    try {
      // First get the sound record to find the file path
      const { data: sound, error: fetchError } = await supabase
        .from("sounds")
        .select("file_path")
        .eq("id", soundId)
        .eq("user_id", userId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to find sound: ${fetchError.message}`);
      }

      // Mark as inactive in database
      const { error: updateError } = await supabase
        .from("sounds")
        .update({ is_active: false })
        .eq("id", soundId)
        .eq("user_id", userId);

      if (updateError) {
        throw new Error(`Failed to delete sound: ${updateError.message}`);
      }

      // Remove file from storage
      const { error: storageError } = await supabase.storage
        .from("user-sounds")
        .remove([sound.file_path]);

      if (storageError) {
        console.warn("Failed to remove file from storage:", storageError);
        // Don't throw here as the database update was successful
      }
    } catch (error) {
      console.error("Error in deleteSound:", error);
      throw error;
    }
  }

  /**
   * Update sound metadata
   */
  static async updateSound(
    soundId: string,
    userId: string,
    updates: Partial<
      Pick<CustomSoundUpload, "name" | "category" | "description">
    >
  ): Promise<CustomSoundRecord> {
    try {
      const { data, error } = await supabase
        .from("sounds")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", soundId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update sound: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error("Error in updateSound:", error);
      throw error;
    }
  }
}
