-- Sound Presets Database Schema for Mesmer
-- This creates all tables and policies needed for the sound presets system

-- ============================================================================
-- 1. CREATE TABLES
-- ============================================================================

-- 1.1 User uploaded sounds metadata
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

-- 1.2 User saved preset combinations
CREATE TABLE public.sound_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.3 Links presets to sounds with individual volume levels (Join Table)
CREATE TABLE public.preset_sounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  
  -- Ensure unique combination of preset_id with either sound_id or sound_key
  UNIQUE (preset_id, sound_id),
  UNIQUE (preset_id, sound_key)
);

-- ============================================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for sounds table
CREATE INDEX idx_sounds_user_id ON public.sounds(user_id);
CREATE INDEX idx_sounds_category ON public.sounds(category);
CREATE INDEX idx_sounds_active ON public.sounds(is_active);

-- Index for sound_presets table
CREATE INDEX idx_sound_presets_user_id ON public.sound_presets(user_id);
CREATE INDEX idx_sound_presets_favorite ON public.sound_presets(is_favorite);

-- Index for preset_sounds table
CREATE INDEX idx_preset_sounds_preset_id ON public.preset_sounds(preset_id);
CREATE INDEX idx_preset_sounds_sound_id ON public.preset_sounds(sound_id);
CREATE INDEX idx_preset_sounds_sound_key ON public.preset_sounds(sound_key);

-- ============================================================================
-- 3. ADD FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Foreign key for custom sounds in preset_sounds
ALTER TABLE public.preset_sounds 
ADD CONSTRAINT fk_preset_sounds_sound_id 
FOREIGN KEY (sound_id) REFERENCES public.sounds(id) ON DELETE CASCADE;

-- ============================================================================
-- 4. CREATE STORAGE BUCKET
-- ============================================================================

-- Create storage bucket for user sounds
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-sounds', 
  'user-sounds', 
  false, 
  52428800, -- 50MB limit
  ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a']
);

-- ============================================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.sounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sound_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preset_sounds ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. CREATE RLS POLICIES FOR SOUNDS TABLE
-- ============================================================================

-- Users can view their own sounds
CREATE POLICY "Users can view own sounds" ON public.sounds
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own sounds
CREATE POLICY "Users can insert own sounds" ON public.sounds
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own sounds
CREATE POLICY "Users can update own sounds" ON public.sounds
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own sounds
CREATE POLICY "Users can delete own sounds" ON public.sounds
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 7. CREATE RLS POLICIES FOR SOUND_PRESETS TABLE
-- ============================================================================

-- Users can view their own presets
CREATE POLICY "Users can view own presets" ON public.sound_presets
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own presets
CREATE POLICY "Users can insert own presets" ON public.sound_presets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own presets
CREATE POLICY "Users can update own presets" ON public.sound_presets
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own presets
CREATE POLICY "Users can delete own presets" ON public.sound_presets
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 8. CREATE RLS POLICIES FOR PRESET_SOUNDS TABLE
-- ============================================================================

-- Users can view preset sounds for their own presets
CREATE POLICY "Users can view own preset sounds" ON public.preset_sounds
  FOR SELECT USING (
    preset_id IN (
      SELECT id FROM public.sound_presets WHERE user_id = auth.uid()
    )
  );

-- Users can insert preset sounds for their own presets
CREATE POLICY "Users can insert own preset sounds" ON public.preset_sounds
  FOR INSERT WITH CHECK (
    preset_id IN (
      SELECT id FROM public.sound_presets WHERE user_id = auth.uid()
    )
  );

-- Users can update preset sounds for their own presets
CREATE POLICY "Users can update own preset sounds" ON public.preset_sounds
  FOR UPDATE USING (
    preset_id IN (
      SELECT id FROM public.sound_presets WHERE user_id = auth.uid()
    )
  );

-- Users can delete preset sounds for their own presets
CREATE POLICY "Users can delete own preset sounds" ON public.preset_sounds
  FOR DELETE USING (
    preset_id IN (
      SELECT id FROM public.sound_presets WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- 9. CREATE STORAGE BUCKET POLICIES
-- ============================================================================

-- Users can upload sounds to their own folder
CREATE POLICY "Users can upload own sounds" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'user-sounds' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can view sounds in their own folder
CREATE POLICY "Users can view own sounds" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'user-sounds' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can update sounds in their own folder
CREATE POLICY "Users can update own sounds" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'user-sounds' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete sounds in their own folder
CREATE POLICY "Users can delete own sounds" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'user-sounds' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================================
-- 10. CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_sounds_updated_at
  BEFORE UPDATE ON public.sounds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sound_presets_updated_at
  BEFORE UPDATE ON public.sound_presets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 11. GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sounds TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sound_presets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.preset_sounds TO authenticated;

-- Grant usage on sequences (for UUID generation)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- SCHEMA SETUP COMPLETE
-- ============================================================================

-- Verify tables were created successfully
SELECT 
  schemaname,
  tablename,
  tableowner,
  tablespace,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('sounds', 'sound_presets', 'preset_sounds')
ORDER BY tablename;

-- Verify storage bucket was created
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id = 'user-sounds'; 