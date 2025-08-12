import { supabase } from "../lib/supabase";
import type { CustomSound, SoundMetadata } from "../types/sound";

export interface SupabaseSound {
  id: string;
  user_id: string;
  name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  duration?: number;
  category: "Nature" | "Focus" | "Urban" | "Custom";
  description?: string;
  icon_path?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class SupabaseSoundService {
  private static readonly BUCKET_NAME = "sounds";
  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  private static readonly ALLOWED_TYPES = [
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "audio/mp4",
    "audio/x-m4a",
    "audio/webm",
  ];

  /**
   * Upload a sound file and create database record
   */
  static async uploadSound(
    file: File,
    metadata: SoundMetadata,
    userId: string,
    onProgress?: (progress: number) => void
  ): Promise<CustomSound> {
    try {
      // Validate file
      this.validateFile(file);

      // Generate unique file path
      const fileExtension = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}.${fileExtension}`;
      const filePath = `${userId}/${fileName}`;

      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get duration if possible
      const duration = await this.getAudioDuration(file);

      // Create database record
      const soundRecord: Omit<
        SupabaseSound,
        "id" | "created_at" | "updated_at"
      > = {
        user_id: userId,
        name: metadata.name,
        file_path: uploadData.path,
        file_size: file.size,
        file_type: file.type,
        duration,
        category: metadata.category,
        description: metadata.description,
        is_active: true,
      };

      const { data: dbData, error: dbError } = await supabase
        .from("sounds")
        .insert([soundRecord])
        .select()
        .single();

      if (dbError) {
        // Clean up uploaded file if database insert fails
        await supabase.storage.from(this.BUCKET_NAME).remove([uploadData.path]);
        throw new Error(`Database error: ${dbError.message}`);
      }

      // Convert to CustomSound format
      return this.mapToCustomSound(dbData);
    } catch (error) {
      console.error("Sound upload failed:", error);
      throw error;
    }
  }

  /**
   * Get all sounds for a user
   */
  static async getUserSounds(userId: string): Promise<CustomSound[]> {
    try {
      const { data, error } = await supabase.functions.invoke('getUserSounds');

      if (error) {
        throw new Error(`Failed to fetch sounds: ${error.message}`);
      }

      const sounds = await Promise.all(
        data.data.map(async (sound: any) => {
          const customSound = this.mapToCustomSound(sound);
          customSound.audioFile = await this.getSignedUrl(sound.file_path);
          return customSound;
        })
      );

      return sounds;
    } catch (error) {
      console.error("Failed to get user sounds:", error);
      throw error;
    }
  }

  /**
   * Delete a sound (soft delete in DB, hard delete in storage)
   */
  static async deleteSound(soundId: string, userId: string): Promise<void> {
    try {
      // Get sound details first
      const { data: sound, error: fetchError } = await supabase
        .from("sounds")
        .select("file_path")
        .eq("id", soundId)
        .eq("user_id", userId)
        .single();

      if (fetchError) {
        throw new Error(`Sound not found: ${fetchError.message}`);
      }

      // Soft delete in database
      const { error: dbError } = await supabase
        .from("sounds")
        .update({ is_active: false })
        .eq("id", soundId)
        .eq("user_id", userId);

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`);
      }

      // Hard delete from storage
      const { error: storageError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([sound.file_path]);

      if (storageError) {
        console.warn(
          "Failed to delete file from storage:",
          storageError.message
        );
      }
    } catch (error) {
      console.error("Failed to delete sound:", error);
      throw error;
    }
  }

  /**
   * Update sound metadata
   */
  static async updateSound(
    soundId: string,
    userId: string,
    updates: Partial<SoundMetadata>
  ): Promise<CustomSound> {
    try {
      const { data, error } = await supabase
        .from("sounds")
        .update(updates)
        .eq("id", soundId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        throw new Error(`Update failed: ${error.message}`);
      }

      const customSound = this.mapToCustomSound(data);
      customSound.audioFile = await this.getSignedUrl(data.file_path);
      return customSound;
    } catch (error) {
      console.error("Failed to update sound:", error);
      throw error;
    }
  }

  /**
   * Get signed URL for audio file
   */
  static async getSignedUrl(filePath: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (error) {
      throw new Error(`Failed to get signed URL: ${error.message}`);
    }

    return data.signedUrl;
  }

  /**
   * Validate uploaded file
   */
  private static validateFile(file: File): void {
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(
        `File too large. Maximum size is ${
          this.MAX_FILE_SIZE / (1024 * 1024)
        }MB`
      );
    }

    if (!this.ALLOWED_TYPES.includes(file.type)) {
      throw new Error(
        `Invalid file type. Allowed types: ${this.ALLOWED_TYPES.join(", ")}`
      );
    }
  }

  /**
   * Get audio duration from file
   */
  private static async getAudioDuration(
    file: File
  ): Promise<number | undefined> {
    return new Promise((resolve) => {
      const audio = document.createElement("audio");
      const url = URL.createObjectURL(file);

      audio.addEventListener("loadedmetadata", () => {
        resolve(Math.round(audio.duration));
        URL.revokeObjectURL(url);
      });

      audio.addEventListener("error", () => {
        resolve(undefined);
        URL.revokeObjectURL(url);
      });

      audio.src = url;
    });
  }

  /**
   * Map Supabase record to CustomSound
   */
  private static mapToCustomSound(sound: SupabaseSound): CustomSound {
    return {
      id: sound.id,
      user_id: sound.user_id,
      name: sound.name,
      file_path: sound.file_path,
      file_size: sound.file_size,
      file_type: sound.file_type,
      duration: sound.duration,
      category: sound.category,
      description: sound.description,
      is_active: sound.is_active,
      created_at: sound.created_at,
      updated_at: sound.updated_at,
      isCustom: true,
      // Runtime properties will be set separately
      audioFile: undefined,
      icon: undefined,
    };
  }

  /**
   * Get storage usage for user
   */
  static async getStorageUsage(userId: string): Promise<{
    totalFiles: number;
    totalSize: number;
    maxSize: number;
  }> {
    try {
      const { data, error } = await supabase
        .from("sounds")
        .select("file_size")
        .eq("user_id", userId)
        .eq("is_active", true);

      if (error) {
        throw new Error(`Failed to get storage usage: ${error.message}`);
      }

      const totalSize = data.reduce(
        (sum: any, sound: any) => sum + sound.file_size,
        0
      );

      return {
        totalFiles: data.length,
        totalSize,
        maxSize: this.MAX_FILE_SIZE * 10, // Allow up to 10 files max size
      };
    } catch (error) {
      console.error("Failed to get storage usage:", error);
      return { totalFiles: 0, totalSize: 0, maxSize: this.MAX_FILE_SIZE * 10 };
    }
  }
}
