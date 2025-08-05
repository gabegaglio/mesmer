-- Fix preset_sounds table schema
-- This script will ensure the table has the correct structure and foreign keys

-- First, check if the table exists and see its current structure
DO $$
BEGIN
  -- Check if preset_sounds table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'preset_sounds') THEN
    RAISE NOTICE 'preset_sounds table already exists, checking structure...';
  ELSE
    RAISE NOTICE 'preset_sounds table does not exist, will create it...';
  END IF;
END $$;

-- Drop and recreate the preset_sounds table with correct structure
DROP TABLE IF EXISTS public.preset_sounds CASCADE;

-- Create the preset_sounds table with all proper constraints
CREATE TABLE public.preset_sounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preset_id UUID NOT NULL,
  sound_id UUID,
  sound_key TEXT,
  volume NUMERIC(5,2) NOT NULL DEFAULT 1.0 CHECK (volume >= 0 AND volume <= 1),
  is_muted BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key constraint for preset_id
  CONSTRAINT fk_preset_sounds_preset_id 
    FOREIGN KEY (preset_id) 
    REFERENCES public.sound_presets(id) 
    ON DELETE CASCADE,
  
  -- Foreign key constraint for custom sounds
  CONSTRAINT fk_preset_sounds_sound_id 
    FOREIGN KEY (sound_id) 
    REFERENCES public.sounds(id) 
    ON DELETE CASCADE,
  
  -- Ensure either sound_id (custom) OR sound_key (built-in) is provided
  CONSTRAINT check_sound_reference 
    CHECK (
      (sound_id IS NOT NULL AND sound_key IS NULL) OR 
      (sound_id IS NULL AND sound_key IS NOT NULL)
    ),
  
  -- Ensure unique combination of preset_id with either sound_id or sound_key
  CONSTRAINT unique_preset_sound_id 
    UNIQUE (preset_id, sound_id),
  CONSTRAINT unique_preset_sound_key 
    UNIQUE (preset_id, sound_key)
);

-- Create indexes for performance
CREATE INDEX idx_preset_sounds_preset_id ON public.preset_sounds(preset_id);
CREATE INDEX idx_preset_sounds_sound_id ON public.preset_sounds(sound_id);
CREATE INDEX idx_preset_sounds_sound_key ON public.preset_sounds(sound_key);

-- Enable RLS
ALTER TABLE public.preset_sounds ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own preset sounds" ON public.preset_sounds
  FOR SELECT USING (
    preset_id IN (
      SELECT id FROM public.sound_presets WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own preset sounds" ON public.preset_sounds
  FOR INSERT WITH CHECK (
    preset_id IN (
      SELECT id FROM public.sound_presets WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own preset sounds" ON public.preset_sounds
  FOR UPDATE USING (
    preset_id IN (
      SELECT id FROM public.sound_presets WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own preset sounds" ON public.preset_sounds
  FOR DELETE USING (
    preset_id IN (
      SELECT id FROM public.sound_presets WHERE user_id = auth.uid()
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.preset_sounds TO authenticated;

-- Verify the table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'preset_sounds'
ORDER BY ordinal_position;

-- Verify foreign key constraints
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'preset_sounds'
  AND tc.table_schema = 'public';

SELECT 'preset_sounds table structure fixed successfully!' as status; 