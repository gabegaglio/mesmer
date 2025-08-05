#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role for admin operations

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  console.error(
    "Make sure you have VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Mapping of your current audio files to their metadata
const soundFiles = [
  {
    key: "rain",
    localPath: "../public/presets/nature/rain.mp3",
    storagePath: "nature/rain.mp3",
    name: "Rain",
    category: "Nature",
    description: "Gentle rainfall sounds",
    iconKey: "rain",
  },
  {
    key: "ocean",
    localPath: "../public/presets/nature/ocean.mp3",
    storagePath: "nature/ocean.mp3",
    name: "Ocean",
    category: "Nature",
    description: "Ocean waves and surf",
    iconKey: "ocean",
  },
  {
    key: "fire",
    localPath: "../public/presets/nature/fire.mp3",
    storagePath: "nature/fire.mp3",
    name: "Fire",
    category: "Nature",
    description: "Crackling fireplace",
    iconKey: "fire",
  },
  {
    key: "wind",
    localPath: "../public/presets/nature/wind.mp3",
    storagePath: "nature/wind.mp3",
    name: "Wind",
    category: "Nature",
    description: "Gentle wind through trees",
    iconKey: "wind",
  },
  {
    key: "crickets",
    localPath: "../public/presets/nature/crickets.mp3",
    storagePath: "nature/crickets.mp3",
    name: "Crickets",
    category: "Nature",
    description: "Evening cricket sounds",
    iconKey: "crickets",
  },
  {
    key: "white",
    localPath: "../public/presets/focus/white.mp3",
    storagePath: "focus/white.mp3",
    name: "White Noise",
    category: "Focus",
    description: "Pure white noise for concentration",
    iconKey: "star",
  },
  {
    key: "pink",
    localPath: "../public/presets/focus/pink.mp3",
    storagePath: "focus/pink.mp3",
    name: "Pink Noise",
    category: "Focus",
    description: "Pink noise for better sleep",
    iconKey: "star",
  },
  {
    key: "brown",
    localPath: "../public/presets/focus/brown.mp3",
    storagePath: "focus/brown.mp3",
    name: "Brown Noise",
    category: "Focus",
    description: "Deep brown noise",
    iconKey: "star",
  },
  {
    key: "cafe",
    localPath: "../public/presets/urban/cafe.mp3",
    storagePath: "urban/cafe.mp3",
    name: "Cafe",
    category: "Urban",
    description: "Coffee shop ambience",
    iconKey: "coffee",
  },
  {
    key: "chimes",
    localPath: "../public/presets/urban/chimes.mp3",
    storagePath: "urban/chimes.mp3",
    name: "Chimes",
    category: "Urban",
    description: "Gentle wind chimes",
    iconKey: "chimes",
  },
];

async function uploadSounds() {
  console.log("🎵 Starting built-in sounds upload...");

  for (const sound of soundFiles) {
    try {
      const fullPath = path.resolve(__dirname, sound.localPath);

      // Check if file exists
      if (!fs.existsSync(fullPath)) {
        console.warn(`⚠️  File not found: ${sound.localPath}`);
        continue;
      }

      console.log(`📤 Uploading ${sound.name}...`);

      // Read file
      const fileBuffer = fs.readFileSync(fullPath);
      const fileSize = fs.statSync(fullPath).size;

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("builtin-sounds")
        .upload(sound.storagePath, fileBuffer, {
          contentType: "audio/mpeg",
          cacheControl: "3600",
          upsert: true, // Overwrite if exists
        });

      if (uploadError) {
        console.error(
          `❌ Upload failed for ${sound.name}:`,
          uploadError.message
        );
        continue;
      }

      console.log(`✅ Uploaded ${sound.name} to ${sound.storagePath}`);

      // Update database record with actual file size
      const { error: dbError } = await supabase.from("builtin_sounds").upsert({
        key: sound.key,
        name: sound.name,
        file_path: sound.storagePath,
        file_size: fileSize,
        file_type: "audio/mpeg",
        category: sound.category,
        description: sound.description,
        icon_key: sound.iconKey,
        is_active: true,
      });

      if (dbError) {
        console.error(
          `❌ Database update failed for ${sound.name}:`,
          dbError.message
        );
      } else {
        console.log(`✅ Updated database for ${sound.name}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${sound.name}:`, error.message);
    }
  }

  console.log("🎉 Upload complete!");
}

// Run the upload
uploadSounds().catch(console.error);
