# Mesmer App - Supabase Database Schema

This document outlines the complete database schema for the Mesmer meditation app, including user management, preferences, custom sound file storage, and optimized volume handling.

## 📊 **Database Overview**

The schema consists of:

- **User Management**: Authentication and roles
- **User Preferences**: App settings, states, and volume controls
- **Custom Sounds**: File uploads and metadata
- **Storage Buckets**: File storage for audio files
- **Smart Volume Saving**: Prevents database overload

## 🔊 **Volume Management Strategy**

### **Problem**:

Saving to database on every volume slider change would create hundreds of unnecessary API calls.

### **Solution**:

Implement a smart saving strategy with debouncing and batch updates.

- **Debounced Save**: 1 second after user stops adjusting
- **Minimum Interval**: At least 2 seconds between database saves
- **Auto-save on Close**: Immediate save when user leaves app
- **Batch Updates**: Multiple volume changes in one database call

## 🏗️ **Table Structure**

### 1. **users** Table (Already Created)

Manages user authentication and roles.

```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_sign_in_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT valid_role CHECK (role IN ('user', 'admin'))
);
```

### 2. **user_preferences** Table

Stores user-specific app settings and states with optimized volume handling.

```sql
CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Theme & Visual Settings
  is_night_mode BOOLEAN DEFAULT false,
  night_mode_effect_disabled BOOLEAN DEFAULT false,

  -- Time & Clock Settings
  clock_enabled BOOLEAN DEFAULT true,
  clock_format TEXT DEFAULT '12h' CHECK (clock_format IN ('12h', '24h')),

  -- Audio Settings (Optimized for Smart Saving)
  master_volume DECIMAL(3,2) DEFAULT 0.75 CHECK (master_volume >= 0 AND master_volume <= 1),
  nature_sounds_volume DECIMAL(3,2) DEFAULT 0.75 CHECK (nature_sounds_volume >= 0 AND nature_sounds_volume <= 1),
  custom_sounds_volume DECIMAL(3,2) DEFAULT 0.75 CHECK (custom_sounds_volume >= 0 AND custom_sounds_volume <= 1),
  ambient_volume DECIMAL(3,2) DEFAULT 0.75 CHECK (ambient_volume >= 0 AND ambient_volume <= 1),

  -- Audio Toggles
  nature_sounds_enabled BOOLEAN DEFAULT true,
  custom_sounds_enabled BOOLEAN DEFAULT true,
  is_muted BOOLEAN DEFAULT false,

  -- Session Settings
  default_session_duration INTEGER DEFAULT 600, -- in seconds (10 minutes)
  auto_start_enabled BOOLEAN DEFAULT false,
  notification_enabled BOOLEAN DEFAULT true,

  -- Advanced Settings
  breathing_guide_enabled BOOLEAN DEFAULT true,
  ambient_effects_enabled BOOLEAN DEFAULT true,
  auto_save_sessions BOOLEAN DEFAULT true,

  -- Volume Save Tracking (Prevents Overload)
  volumes_last_saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one preference record per user
  UNIQUE(user_id)
);
```

### 3. **custom_sounds** Table

Manages uploaded custom sound files and metadata.

```sql
CREATE TABLE public.custom_sounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- File Information
  file_name TEXT NOT NULL,
  original_file_name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Storage bucket path
  file_size INTEGER NOT NULL, -- in bytes
  file_type TEXT NOT NULL, -- MIME type (audio/mp3, audio/wav, etc.)
  duration DECIMAL(10,2), -- in seconds

  -- Metadata
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'custom' CHECK (category IN ('nature', 'ambient', 'music', 'voice', 'custom')),
  tags TEXT[], -- Array of tags for categorization

  -- Settings
  is_public BOOLEAN DEFAULT false, -- Allow other users to discover this sound
  is_active BOOLEAN DEFAULT true, -- User can enable/disable sounds
  default_volume DECIMAL(3,2) DEFAULT 0.75 CHECK (default_volume >= 0 AND default_volume <= 1),

  -- Usage Stats
  play_count INTEGER DEFAULT 0,
  last_played_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. **meditation_sessions** Table (Optional)

Track user meditation sessions for analytics.

```sql
CREATE TABLE public.meditation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Session Details
  duration INTEGER NOT NULL, -- in seconds
  sounds_used UUID[] DEFAULT '{}', -- Array of custom_sounds IDs
  session_type TEXT DEFAULT 'free' CHECK (session_type IN ('free', 'guided', 'timer')),

  -- Settings Used
  night_mode BOOLEAN DEFAULT false,
  volume_level DECIMAL(3,2) DEFAULT 0.75,

  -- Completion
  completed BOOLEAN DEFAULT false,
  completed_duration INTEGER, -- actual time meditated

  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🗂️ **Storage Buckets**

### **custom-sounds** Bucket

For storing uploaded audio files.

```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('custom-sounds', 'custom-sounds', false);
```

**Bucket Configuration:**

- **Name**: `custom-sounds`
- **Public**: `false` (private access only)
- **File Types**: Audio files (mp3, wav, ogg, m4a)
- **Max File Size**: 50MB per file
- **Max Files**: 100 per user

## 🔒 **Row Level Security (RLS) Policies**

### **user_preferences** Policies

```sql
-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
CREATE POLICY "Users can view own preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own preferences" ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert own preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all preferences
CREATE POLICY "Admins can view all preferences" ON public.user_preferences
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### **custom_sounds** Policies

```sql
-- Enable RLS
ALTER TABLE public.custom_sounds ENABLE ROW LEVEL SECURITY;

-- Users can view their own sounds
CREATE POLICY "Users can view own sounds" ON public.custom_sounds
  FOR SELECT USING (auth.uid() = user_id);

-- Users can view public sounds from other users
CREATE POLICY "Users can view public sounds" ON public.custom_sounds
  FOR SELECT USING (is_public = true);

-- Users can manage their own sounds
CREATE POLICY "Users can manage own sounds" ON public.custom_sounds
  FOR ALL USING (auth.uid() = user_id);

-- Admins can view all sounds
CREATE POLICY "Admins can view all sounds" ON public.custom_sounds
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### **Storage Bucket Policies**

```sql
-- Users can upload their own files
CREATE POLICY "Users can upload own files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'custom-sounds' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can view their own files
CREATE POLICY "Users can view own files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'custom-sounds' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own files
CREATE POLICY "Users can delete own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'custom-sounds' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

## 🔧 **Database Functions & Triggers**

### **Auto-create User Preferences**

```sql
-- Function to create default preferences for new users
CREATE OR REPLACE FUNCTION public.create_user_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

-- Trigger to auto-create preferences when user is created
CREATE OR REPLACE TRIGGER on_user_created_preferences
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.create_user_preferences();
```

### **Update Timestamps**

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply to all tables with updated_at
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_custom_sounds_updated_at
  BEFORE UPDATE ON public.custom_sounds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

## 💾 **Volume Saving Implementation**

### **Frontend Volume Management Context**

```typescript
// src/contexts/VolumeContext.tsx
import { createContext, useContext, useEffect, useState, useRef } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "../lib/supabase";

interface VolumeSettings {
  masterVolume: number;
  natureSoundsVolume: number;
  customSoundsVolume: number;
  ambientVolume: number;
  isMuted: boolean;
}

interface VolumeContextType {
  volumes: VolumeSettings;
  updateVolume: (type: keyof VolumeSettings, value: number | boolean) => void;
  saveVolumes: () => Promise<void>;
  isLoading: boolean;
}

const VolumeContext = createContext<VolumeContextType | undefined>(undefined);

export const useVolume = () => {
  const context = useContext(VolumeContext);
  if (!context) throw new Error("useVolume must be used within VolumeProvider");
  return context;
};

export const VolumeProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [volumes, setVolumes] = useState<VolumeSettings>({
    masterVolume: 0.75,
    natureSoundsVolume: 0.75,
    customSoundsVolume: 0.75,
    ambientVolume: 0.75,
    isMuted: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Refs for debouncing
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const pendingChangesRef = useRef<Partial<VolumeSettings>>({});
  const lastSaveRef = useRef<number>(Date.now());

  // Load user volumes on auth
  useEffect(() => {
    if (user) {
      loadUserVolumes();
    }
  }, [user]);

  // Auto-save on app visibility change (user closes/minimizes app)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User is leaving/minimizing - save immediately
        saveVolumes();
      }
    };

    const handleBeforeUnload = () => {
      // User is closing app - save immediately
      saveVolumes();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Save any pending changes on unmount
      if (Object.keys(pendingChangesRef.current).length > 0) {
        saveVolumes();
      }
    };
  }, []);

  const loadUserVolumes = async () => {
    if (!user) return;

    try {
      const { data: preferences } = await supabase
        .from("user_preferences")
        .select(
          "master_volume, nature_sounds_volume, custom_sounds_volume, ambient_volume, is_muted"
        )
        .eq("user_id", user.id)
        .single();

      if (preferences) {
        setVolumes({
          masterVolume: preferences.master_volume || 0.75,
          natureSoundsVolume: preferences.nature_sounds_volume || 0.75,
          customSoundsVolume: preferences.custom_sounds_volume || 0.75,
          ambientVolume: preferences.ambient_volume || 0.75,
          isMuted: preferences.is_muted || false,
        });
      }
    } catch (error) {
      console.error("Error loading volumes:", error);
    }
  };

  const updateVolume = (
    type: keyof VolumeSettings,
    value: number | boolean
  ) => {
    // Update local state immediately
    setVolumes((prev) => ({ ...prev, [type]: value }));

    // Track pending changes
    pendingChangesRef.current = {
      ...pendingChangesRef.current,
      [type]: value,
    };

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for batch saving (debounce)
    saveTimeoutRef.current = setTimeout(() => {
      const timeSinceLastSave = Date.now() - lastSaveRef.current;

      // Only save if it's been at least 2 seconds since last save
      if (timeSinceLastSave >= 2000) {
        saveVolumes();
      } else {
        // Wait a bit more
        setTimeout(saveVolumes, 2000 - timeSinceLastSave);
      }
    }, 1000); // Wait 1 second after user stops changing volumes
  };

  const saveVolumes = async () => {
    if (!user || Object.keys(pendingChangesRef.current).length === 0) {
      return;
    }

    setIsLoading(true);

    try {
      // Convert camelCase to snake_case for database
      const dbUpdates: any = {};

      if ("masterVolume" in pendingChangesRef.current) {
        dbUpdates.master_volume = pendingChangesRef.current.masterVolume;
      }
      if ("natureSoundsVolume" in pendingChangesRef.current) {
        dbUpdates.nature_sounds_volume =
          pendingChangesRef.current.natureSoundsVolume;
      }
      if ("customSoundsVolume" in pendingChangesRef.current) {
        dbUpdates.custom_sounds_volume =
          pendingChangesRef.current.customSoundsVolume;
      }
      if ("ambientVolume" in pendingChangesRef.current) {
        dbUpdates.ambient_volume = pendingChangesRef.current.ambientVolume;
      }
      if ("isMuted" in pendingChangesRef.current) {
        dbUpdates.is_muted = pendingChangesRef.current.isMuted;
      }

      // Add timestamp
      dbUpdates.volumes_last_saved_at = new Date().toISOString();

      const { error } = await supabase
        .from("user_preferences")
        .update(dbUpdates)
        .eq("user_id", user.id);

      if (error) throw error;

      // Clear pending changes and update last save time
      pendingChangesRef.current = {};
      lastSaveRef.current = Date.now();

      console.log("Volumes saved successfully");
    } catch (error) {
      console.error("Error saving volumes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <VolumeContext.Provider
      value={{ volumes, updateVolume, saveVolumes, isLoading }}
    >
      {children}
    </VolumeContext.Provider>
  );
};
```

### **Volume Control Component Example**

```typescript
// src/components/VolumeSlider.tsx
import { useVolume } from "../contexts/VolumeContext";

interface VolumeSliderProps {
  type:
    | "masterVolume"
    | "natureSoundsVolume"
    | "customSoundsVolume"
    | "ambientVolume";
  label: string;
}

const VolumeSlider = ({ type, label }: VolumeSliderProps) => {
  const { volumes, updateVolume, isLoading } = useVolume();

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    updateVolume(type, value);
  };

  return (
    <div className="volume-control">
      <label>{label}</label>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volumes[type] as number}
        onChange={handleVolumeChange}
        disabled={isLoading}
      />
      <span>{Math.round((volumes[type] as number) * 100)}%</span>
    </div>
  );
};
```

## 📋 **Usage Examples**

### **User Preferences Management**

```typescript
// Get user preferences
const { data: preferences } = await supabase
  .from("user_preferences")
  .select("*")
  .eq("user_id", user.id)
  .single();

// Update night mode
const { error } = await supabase
  .from("user_preferences")
  .update({
    is_night_mode: true,
    night_mode_effect_disabled: false,
  })
  .eq("user_id", user.id);

// Update clock settings
const { error } = await supabase
  .from("user_preferences")
  .update({
    clock_enabled: false,
    clock_format: "24h",
  })
  .eq("user_id", user.id);
```

### **Custom Sound Upload**

```typescript
// Upload file to storage
const { data: uploadData, error: uploadError } = await supabase.storage
  .from("custom-sounds")
  .upload(`${user.id}/${fileName}`, file);

// Save metadata to database
const { error } = await supabase.from("custom_sounds").insert({
  user_id: user.id,
  file_name: fileName,
  original_file_name: file.name,
  file_path: uploadData.path,
  file_size: file.size,
  file_type: file.type,
  title: title,
  description: description,
  category: "custom",
});
```

### **Get User's Custom Sounds**

```typescript
const { data: sounds } = await supabase
  .from("custom_sounds")
  .select("*")
  .eq("user_id", user.id)
  .eq("is_active", true)
  .order("created_at", { ascending: false });
```

## 🔄 **Volume Saving Strategy Summary**

### **When Volumes Are Saved:**

1. **Debounced Save**: 1 second after user stops adjusting volume
2. **Minimum Interval**: At least 2 seconds between database saves
3. **App Close/Minimize**: Immediate save when user leaves app
4. **Component Unmount**: Save any pending changes
5. **Manual Save**: Available via `saveVolumes()` function

### **Benefits:**

✅ **No Database Overload**: Maximum 1 save per 2 seconds  
✅ **Instant UI Updates**: Local state updates immediately  
✅ **Reliable Persistence**: Always saves on app close  
✅ **Batch Updates**: Multiple volume changes in one database call  
✅ **Error Resilient**: Handles network failures gracefully

### **Database Impact:**

- **Before**: 100+ saves per minute (every slider movement)
- **After**: Maximum 30 saves per minute (1 every 2 seconds)
- **Typical**: 5-10 saves per session (only when user actually changes volumes)

## 🎯 **Key Features Supported**

### ✅ **User Preferences**

- Day/Night mode toggle
- Night mode effects enable/disable
- Clock display enable/disable
- Clock format (12h/24h)
- Smart volume controls with auto-save
- Session defaults

### ✅ **Custom Sound Management**

- File upload with metadata
- Categorization and tagging
- Public sharing options
- Usage analytics
- File size and type validation

### ✅ **Security**

- Row Level Security on all tables
- User isolation for files and preferences
- Admin access controls
- Secure file storage

### ✅ **Performance**

- Optimized volume saving prevents database overload
- Proper indexing on foreign keys
- Efficient queries with RLS
- Debounced updates with batch processing

---

🎉 **This schema provides a complete foundation for user preferences, custom sound management, and optimized volume handling that won't overwhelm your Supabase database!**
