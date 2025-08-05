# Sound Presets Implementation Plan for Mesmer

This document outlines the complete implementation plan for building a sound presets system that stores built-in sounds locally and enables users to upload custom sounds and save preset combinations with volume levels to Supabase.

---

## 📋 Overview

We're implementing a comprehensive sound management system with three core features:

1. **Built-in Local Sounds** - Core sound library bundled with the app
2. **Custom User Uploads** - User-uploaded sounds stored in Supabase Storage
3. **Sound Presets** - Named combinations of sounds with individual volume levels

### Current State Analysis

- ✅ **React + TypeScript + Vite** setup
- ✅ **Supabase** authentication and database integration
- ✅ **SoundContext** for managing sound library
- ✅ **Audio playback** system with volume controls
- ✅ **SoundDropdown** component for sound selection
- ✅ **Custom sound upload** functionality with IndexedDB storage

### Migration Required

- **IndexedDB → Supabase Storage** for custom sounds
- **Local state → Database** for sound presets

---

## 🏗️ Database Schema Implementation

### Phase 1: Create Supabase Tables

#### 1.1 `sounds` Table

```sql
-- User uploaded sounds metadata
CREATE TABLE public.sounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Storage bucket path
  file_size INTEGER NOT NULL, -- in bytes
  file_type TEXT NOT NULL, -- MIME type
  duration DECIMAL(10,2), -- in seconds
  category TEXT DEFAULT 'Custom' CHECK (category IN ('Nature', 'Focus', 'Urban', 'Custom')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance
CREATE INDEX idx_sounds_user_id ON public.sounds(user_id);
CREATE INDEX idx_sounds_category ON public.sounds(category);
```

#### 1.2 `sound_presets` Table

```sql
-- User saved preset combinations
CREATE TABLE public.sound_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance
CREATE INDEX idx_sound_presets_user_id ON public.sound_presets(user_id);
```

#### 1.3 `preset_sounds` Table (Join Table)

```sql
-- Links presets to sounds with individual volume levels
CREATE TABLE public.preset_sounds (
  preset_id UUID NOT NULL REFERENCES public.sound_presets(id) ON DELETE CASCADE,
  sound_id UUID, -- Nullable for built-in sounds
  sound_key TEXT, -- For built-in sounds (ocean, rain, etc.)
  volume NUMERIC(3,2) NOT NULL DEFAULT 1.0 CHECK (volume >= 0 AND volume <= 1),
  is_muted BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,

  -- Ensure either sound_id (custom) OR sound_key (built-in) is provided
  CHECK (
    (sound_id IS NOT NULL AND sound_key IS NULL) OR
    (sound_id IS NULL AND sound_key IS NOT NULL)
  ),

  PRIMARY KEY (preset_id, COALESCE(sound_id, sound_key::uuid))
);

-- Foreign key for custom sounds
ALTER TABLE public.preset_sounds
ADD CONSTRAINT fk_preset_sounds_sound_id
FOREIGN KEY (sound_id) REFERENCES public.sounds(id) ON DELETE CASCADE;
```

#### 1.4 Storage Bucket Setup

```sql
-- Create storage bucket for user sounds
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-sounds',
  'user-sounds',
  false,
  52428800, -- 50MB limit
  ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a']
);
```

#### 1.5 Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE public.sounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sound_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preset_sounds ENABLE ROW LEVEL SECURITY;

-- sounds table policies
CREATE POLICY "Users can view own sounds" ON public.sounds
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own sounds" ON public.sounds
  FOR ALL USING (auth.uid() = user_id);

-- sound_presets table policies
CREATE POLICY "Users can view own presets" ON public.sound_presets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own presets" ON public.sound_presets
  FOR ALL USING (auth.uid() = user_id);

-- preset_sounds table policies
CREATE POLICY "Users can view own preset sounds" ON public.preset_sounds
  FOR SELECT USING (
    preset_id IN (
      SELECT id FROM public.sound_presets WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own preset sounds" ON public.preset_sounds
  FOR ALL USING (
    preset_id IN (
      SELECT id FROM public.sound_presets WHERE user_id = auth.uid()
    )
  );

-- Storage bucket policies
CREATE POLICY "Users can upload own sounds" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'user-sounds' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own sounds" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'user-sounds' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own sounds" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'user-sounds' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

---

## 📁 File Structure Refactoring

### Phase 2: Update Built-in Sound Organization

#### 2.1 Create `public/presets/` Directory

```
public/
  presets/
    nature/
      ocean-waves.mp3
      gentle-rain.mp3
      crackling-fire.mp3
      chirping-crickets.mp3
      whispering-wind.mp3
    focus/
      white-noise.mp3
      brown-noise.mp3
      pink-noise.mp3
      binaural-beats.mp3
    urban/
      cafe-ambience.mp3
      distant-chimes.mp3
      city-rain.mp3
```

#### 2.2 Update Built-in Sounds Configuration

Create `src/data/builtInSounds.ts`:

```typescript
export interface BuiltInSound {
  id: string;
  key: string; // Used for preset_sounds.sound_key
  name: string;
  fileName: string;
  category: "Nature" | "Focus" | "Urban";
  audioFile: string;
  icon: string;
  description?: string;
}

export const BUILT_IN_SOUNDS: BuiltInSound[] = [
  // Nature Category
  {
    id: "ocean-waves",
    key: "ocean",
    name: "Ocean Waves",
    fileName: "ocean-waves.mp3",
    category: "Nature",
    audioFile: "/presets/nature/ocean-waves.mp3",
    icon: "🌊",
    description: "Gentle waves lapping against the shore",
  },
  {
    id: "gentle-rain",
    key: "rain",
    name: "Gentle Rain",
    fileName: "gentle-rain.mp3",
    category: "Nature",
    audioFile: "/presets/nature/gentle-rain.mp3",
    icon: "🌧️",
    description: "Soft rainfall on leaves",
  },
  // ... more sounds
];

export const SOUND_CATEGORIES = {
  Nature: {
    icon: "🌿",
    description: "Natural ambient sounds",
  },
  Focus: {
    icon: "🎯",
    description: "Concentration and focus sounds",
  },
  Urban: {
    icon: "🏙️",
    description: "City and indoor ambiences",
  },
  Custom: {
    icon: "🎤",
    description: "Your uploaded sounds",
  },
} as const;
```

---

## 🔧 Core Service Implementation

### Phase 3: Sound Management Services

#### 3.1 Create `src/services/soundService.ts`

```typescript
import { supabase } from "../lib/supabase";
import type { CustomSound } from "../types/sound";

export class SoundService {
  // Upload custom sound to Supabase Storage
  static async uploadSound(
    file: File,
    userId: string,
    metadata: {
      name: string;
      category: string;
      description?: string;
    }
  ): Promise<CustomSound> {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    // Upload to storage
    const { data: storageData, error: storageError } = await supabase.storage
      .from("user-sounds")
      .upload(fileName, file);

    if (storageError) throw storageError;

    // Get file size and duration (you might want to implement audio analysis)
    const duration = await this.getAudioDuration(file);

    // Save metadata to database
    const { data, error } = await supabase
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
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get audio duration from file
  static async getAudioDuration(file: File): Promise<number> {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.addEventListener("loadedmetadata", () => {
        resolve(audio.duration);
      });
      audio.src = URL.createObjectURL(file);
    });
  }

  // Fetch user's custom sounds
  static async getUserSounds(userId: string): Promise<CustomSound[]> {
    const { data, error } = await supabase
      .from("sounds")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Delete custom sound
  static async deleteSound(soundId: string): Promise<void> {
    // Get sound data first to delete from storage
    const { data: sound, error: fetchError } = await supabase
      .from("sounds")
      .select("file_path")
      .eq("id", soundId)
      .single();

    if (fetchError) throw fetchError;

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from("user-sounds")
      .remove([sound.file_path]);

    if (storageError) throw storageError;

    // Delete from database
    const { error: dbError } = await supabase
      .from("sounds")
      .delete()
      .eq("id", soundId);

    if (dbError) throw dbError;
  }

  // Get public URL for sound file
  static getPublicUrl(filePath: string): string {
    const { data } = supabase.storage
      .from("user-sounds")
      .getPublicUrl(filePath);

    return data.publicUrl;
  }
}
```

#### 3.2 Create `src/services/presetService.ts`

```typescript
import { supabase } from "../lib/supabase";
import type { SoundPreset, PresetSound } from "../types/preset";

export class PresetService {
  // Save current sound configuration as preset
  static async savePreset(
    userId: string,
    presetData: {
      name: string;
      description?: string;
      sounds: Array<{
        soundId?: string; // For custom sounds
        soundKey?: string; // For built-in sounds
        volume: number;
        isMuted: boolean;
      }>;
    }
  ): Promise<SoundPreset> {
    // Create preset record
    const { data: preset, error: presetError } = await supabase
      .from("sound_presets")
      .insert({
        user_id: userId,
        name: presetData.name,
        description: presetData.description,
      })
      .select()
      .single();

    if (presetError) throw presetError;

    // Create preset_sounds records
    const presetSounds = presetData.sounds.map((sound, index) => ({
      preset_id: preset.id,
      sound_id: sound.soundId,
      sound_key: sound.soundKey,
      volume: sound.volume,
      is_muted: sound.isMuted,
      sort_order: index,
    }));

    const { error: soundsError } = await supabase
      .from("preset_sounds")
      .insert(presetSounds);

    if (soundsError) throw soundsError;

    return preset;
  }

  // Load user's presets
  static async getUserPresets(userId: string): Promise<SoundPreset[]> {
    const { data, error } = await supabase
      .from("sound_presets")
      .select(
        `
        *,
        preset_sounds (
          sound_id,
          sound_key,
          volume,
          is_muted,
          sort_order,
          sounds: sound_id (
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

    if (error) throw error;
    return data || [];
  }

  // Apply preset to current session
  static async applyPreset(presetId: string): Promise<PresetSound[]> {
    const { data, error } = await supabase
      .from("preset_sounds")
      .select(
        `
        *,
        sounds: sound_id (
          id,
          name,
          file_path,
          category
        )
      `
      )
      .eq("preset_id", presetId)
      .order("sort_order");

    if (error) throw error;
    return data || [];
  }

  // Delete preset
  static async deletePreset(presetId: string): Promise<void> {
    const { error } = await supabase
      .from("sound_presets")
      .delete()
      .eq("id", presetId);

    if (error) throw error;
  }
}
```

---

## 🎨 Component Updates

### Phase 4: Update Existing Components

#### 4.1 Update `src/contexts/SoundContext.tsx`

```typescript
// Add new methods to context
interface SoundContextType {
  // Existing...
  allSounds: Sound[];
  customSounds: CustomSound[];

  // New methods
  uploadCustomSound: (file: File, metadata: SoundMetadata) => Promise<void>;
  deleteCustomSound: (soundId: string) => Promise<void>;
  refreshSounds: () => Promise<void>;

  // Preset methods
  saveCurrentAsPreset: (name: string, description?: string) => Promise<void>;
  loadPreset: (presetId: string) => Promise<void>;
  getUserPresets: () => Promise<SoundPreset[]>;
  deletePreset: (presetId: string) => Promise<void>;
}

// Update provider implementation
export const SoundProvider = ({ children }: SoundProviderProps) => {
  const { user } = useAuth();
  const [customSounds, setCustomSounds] = useState<CustomSound[]>([]);
  const [userPresets, setUserPresets] = useState<SoundPreset[]>([]);
  const [currentVolumes, setCurrentVolumes] = useState<Record<string, number>>(
    {}
  );

  // Load custom sounds from Supabase instead of IndexedDB
  const loadCustomSounds = useCallback(async () => {
    if (!user) return;

    try {
      const sounds = await SoundService.getUserSounds(user.id);
      setCustomSounds(sounds);
    } catch (error) {
      console.error("Failed to load custom sounds:", error);
    }
  }, [user]);

  // Upload custom sound to Supabase
  const uploadCustomSound = async (file: File, metadata: SoundMetadata) => {
    if (!user) throw new Error("User not authenticated");

    const sound = await SoundService.uploadSound(file, user.id, metadata);
    setCustomSounds((prev) => [sound, ...prev]);
  };

  // Save current state as preset
  const saveCurrentAsPreset = async (name: string, description?: string) => {
    if (!user) throw new Error("User not authenticated");

    const sounds = Object.entries(currentVolumes)
      .filter(([_, volume]) => volume > 0)
      .map(([key, volume]) => {
        const isBuiltIn = BUILT_IN_SOUNDS.some((s) => s.key === key);
        return {
          soundKey: isBuiltIn ? key : undefined,
          soundId: isBuiltIn ? undefined : key,
          volume: volume / 100,
          isMuted: false,
        };
      });

    const preset = await PresetService.savePreset(user.id, {
      name,
      description,
      sounds,
    });

    setUserPresets((prev) => [preset, ...prev]);
  };

  // ... other methods
};
```

#### 4.2 Create `src/components/PresetManager/PresetManager.tsx`

```typescript
interface PresetManagerProps {
  onClose: () => void;
  currentVolumes: Record<string, number>;
  onApplyPreset: (volumes: Record<string, number>) => void;
}

export function PresetManager({
  onClose,
  currentVolumes,
  onApplyPreset,
}: PresetManagerProps) {
  const { saveCurrentAsPreset, getUserPresets, deletePreset, loadPreset } =
    useSounds();

  const [presets, setPresets] = useState<SoundPreset[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [presetDescription, setPresetDescription] = useState("");

  // Load presets on mount
  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    try {
      const userPresets = await getUserPresets();
      setPresets(userPresets);
    } catch (error) {
      console.error("Failed to load presets:", error);
    }
  };

  const handleSavePreset = async () => {
    if (!presetName.trim()) return;

    try {
      await saveCurrentAsPreset(presetName, presetDescription);
      setPresetName("");
      setPresetDescription("");
      setShowSaveDialog(false);
      await loadPresets(); // Refresh list
    } catch (error) {
      console.error("Failed to save preset:", error);
    }
  };

  const handleApplyPreset = async (presetId: string) => {
    try {
      const presetSounds = await loadPreset(presetId);

      // Convert preset sounds to volume configuration
      const volumes: Record<string, number> = {};
      presetSounds.forEach((ps) => {
        const key = ps.sound_key || ps.sound_id;
        if (key) {
          volumes[key] = ps.volume * 100; // Convert to 0-100 scale
        }
      });

      onApplyPreset(volumes);
      onClose();
    } catch (error) {
      console.error("Failed to apply preset:", error);
    }
  };

  return (
    <div className="preset-manager">
      {/* Save current as preset section */}
      <div className="save-section">
        <h3>Save Current Mix</h3>
        <button onClick={() => setShowSaveDialog(true)}>Save as Preset</button>
      </div>

      {/* Saved presets list */}
      <div className="presets-list">
        <h3>Your Presets</h3>
        {presets.map((preset) => (
          <div key={preset.id} className="preset-item">
            <div className="preset-info">
              <h4>{preset.name}</h4>
              {preset.description && <p>{preset.description}</p>}
            </div>
            <div className="preset-actions">
              <button onClick={() => handleApplyPreset(preset.id)}>
                Apply
              </button>
              <button onClick={() => deletePreset(preset.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* Save dialog */}
      {showSaveDialog && (
        <div className="save-dialog">
          <h3>Save Preset</h3>
          <input
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="Preset name"
          />
          <textarea
            value={presetDescription}
            onChange={(e) => setPresetDescription(e.target.value)}
            placeholder="Description (optional)"
          />
          <div className="dialog-actions">
            <button onClick={handleSavePreset}>Save</button>
            <button onClick={() => setShowSaveDialog(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 📝 TypeScript Type Definitions

### Phase 5: Update Type Definitions

#### 5.1 Update `src/types/sound.ts`

```typescript
// Built-in sound type
export interface BuiltInSound {
  id: string;
  key: string;
  name: string;
  fileName: string;
  category: "Nature" | "Focus" | "Urban";
  audioFile: string;
  icon: string;
  description?: string;
  isCustom: false;
}

// Custom uploaded sound type
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
  icon?: string; // Based on category
}

// Union type for all sounds
export type Sound = BuiltInSound | CustomSound;

// Sound metadata for uploads
export interface SoundMetadata {
  name: string;
  category: "Nature" | "Focus" | "Urban" | "Custom";
  description?: string;
}
```

#### 5.2 Create `src/types/preset.ts`

```typescript
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

// Individual sound in a preset
export interface PresetSound {
  preset_id: string;
  sound_id?: string; // For custom sounds
  sound_key?: string; // For built-in sounds
  volume: number; // 0.0 to 1.0
  is_muted: boolean;
  sort_order: number;

  // Populated from joins
  sounds?: CustomSound;
}

// Volume configuration type
export interface VolumeConfiguration {
  [soundKey: string]: number; // 0-100 scale
}
```

---

## 🚀 Migration Plan

### Phase 6: Migration from IndexedDB to Supabase

#### 6.1 Create Migration Utility

```typescript
// src/utils/migration.ts
export class SoundMigration {
  static async migrateFromIndexedDB(userId: string): Promise<void> {
    try {
      // 1. Extract sounds from IndexedDB (if any exist)
      const existingSounds = await this.getIndexedDBSounds();

      // 2. Upload each sound to Supabase
      for (const sound of existingSounds) {
        await this.migrateSingleSound(sound, userId);
      }

      // 3. Clear IndexedDB
      await this.clearIndexedDB();

      console.log(`Migrated ${existingSounds.length} sounds to Supabase`);
    } catch (error) {
      console.error("Migration failed:", error);
    }
  }

  private static async getIndexedDBSounds(): Promise<any[]> {
    // Implementation to read from IndexedDB
    // Return existing sounds if any
    return [];
  }

  private static async migrateSingleSound(
    sound: any,
    userId: string
  ): Promise<void> {
    // Convert IndexedDB sound to Supabase format and upload
  }

  private static async clearIndexedDB(): Promise<void> {
    // Clean up IndexedDB storage
  }
}
```

#### 6.2 Add Migration Check to App Initialization

```typescript
// In SoundProvider or App component
useEffect(() => {
  if (user) {
    // Check if migration is needed
    SoundMigration.migrateFromIndexedDB(user.id);
  }
}, [user]);
```

---

## 🧪 Testing Plan

### Phase 7: Testing Strategy

#### 7.1 Database Testing

- [ ] Test all CRUD operations for sounds and presets
- [ ] Verify RLS policies work correctly
- [ ] Test storage bucket upload/download/delete
- [ ] Test foreign key constraints and cascading deletes

#### 7.2 Component Testing

- [ ] Test custom sound upload flow
- [ ] Test preset save/load functionality
- [ ] Test sound switching and volume controls
- [ ] Test error handling for network failures

#### 7.3 Integration Testing

- [ ] Test full user journey: upload → create preset → apply preset
- [ ] Test migration from existing IndexedDB data
- [ ] Test offline behavior and error recovery
- [ ] Test with large audio files and many presets

---

## 📈 Performance Considerations

### Phase 8: Optimization

#### 8.1 Caching Strategy

- **Built-in sounds**: Cached in browser naturally (static files)
- **Custom sounds**: Implement smart caching with service worker
- **Presets**: Cache in React state with periodic refresh
- **Audio objects**: Reuse existing audio elements when possible

#### 8.2 File Upload Optimization

- **Client-side compression**: Reduce file sizes before upload
- **Progress indicators**: Show upload progress for large files
- **Chunked uploads**: For very large files (future enhancement)
- **File validation**: Check format and size before upload

---

## 🎯 Implementation Timeline

### Week 1: Database Setup

- [ ] Create all database tables and policies
- [ ] Set up storage bucket with proper configuration
- [ ] Test database operations manually

### Week 2: Core Services

- [ ] Implement SoundService and PresetService
- [ ] Update SoundContext to use Supabase
- [ ] Create migration utility for existing data

### Week 3: UI Components

- [ ] Update existing components to work with new data flow
- [ ] Create PresetManager component
- [ ] Update upload flow to use Supabase Storage

### Week 4: Testing & Polish

- [ ] Comprehensive testing of all features
- [ ] Performance optimization
- [ ] Error handling and user feedback
- [ ] Documentation and cleanup

---

## 🔄 Success Metrics

- ✅ **Built-in sounds** load instantly from local files
- ✅ **Custom uploads** save to Supabase Storage reliably
- ✅ **Presets** can be saved, loaded, and shared across devices
- ✅ **Volume levels** are preserved accurately in presets
- ✅ **Migration** from IndexedDB works seamlessly
- ✅ **Performance** remains smooth with many custom sounds
- ✅ **Error handling** provides clear user feedback

This plan provides a complete roadmap for implementing the sound presets system while maintaining compatibility with the existing Mesmer app architecture and ensuring a smooth user experience.
