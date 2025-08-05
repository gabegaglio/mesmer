# Sound Presets Database Setup - Step by Step

If you encounter any issues running the full `sound_presets_schema.sql` script, you can run these commands step by step in your Supabase SQL Editor.

## ⚠️ Prerequisites

Make sure you have:

- A Supabase project set up
- The `public.users` table already created (from your existing auth setup)
- Access to the SQL Editor in your Supabase dashboard

## 📋 Step-by-Step Instructions

### Step 1: Create the `sounds` table

```sql
CREATE TABLE public.sounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  duration DECIMAL(10,2),
  category TEXT DEFAULT 'Custom' CHECK (category IN ('Nature', 'Focus', 'Urban', 'Custom')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Step 2: Create the `sound_presets` table

```sql
CREATE TABLE public.sound_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Step 3: Create the `preset_sounds` table

```sql
CREATE TABLE public.preset_sounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preset_id UUID NOT NULL REFERENCES public.sound_presets(id) ON DELETE CASCADE,
  sound_id UUID,
  sound_key TEXT,
  volume NUMERIC(3,2) NOT NULL DEFAULT 1.0 CHECK (volume >= 0 AND volume <= 1),
  is_muted BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,

  CHECK (
    (sound_id IS NOT NULL AND sound_key IS NULL) OR
    (sound_id IS NULL AND sound_key IS NOT NULL)
  ),

  -- Ensure unique combination of preset_id with either sound_id or sound_key
  UNIQUE (preset_id, sound_id),
  UNIQUE (preset_id, sound_key)
);
```

### Step 4: Add foreign key constraint

```sql
ALTER TABLE public.preset_sounds
ADD CONSTRAINT fk_preset_sounds_sound_id
FOREIGN KEY (sound_id) REFERENCES public.sounds(id) ON DELETE CASCADE;
```

### Step 5: Create indexes for performance

```sql
-- Sounds table indexes
CREATE INDEX idx_sounds_user_id ON public.sounds(user_id);
CREATE INDEX idx_sounds_category ON public.sounds(category);
CREATE INDEX idx_sounds_active ON public.sounds(is_active);

-- Sound presets table indexes
CREATE INDEX idx_sound_presets_user_id ON public.sound_presets(user_id);
CREATE INDEX idx_sound_presets_favorite ON public.sound_presets(is_favorite);

-- Preset sounds table indexes
CREATE INDEX idx_preset_sounds_preset_id ON public.preset_sounds(preset_id);
CREATE INDEX idx_preset_sounds_sound_id ON public.preset_sounds(sound_id);
CREATE INDEX idx_preset_sounds_sound_key ON public.preset_sounds(sound_key);
```

### Step 6: Create storage bucket

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-sounds',
  'user-sounds',
  false,
  52428800,
  ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a']
);
```

### Step 7: Enable Row Level Security

```sql
ALTER TABLE public.sounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sound_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preset_sounds ENABLE ROW LEVEL SECURITY;
```

### Step 8: Create RLS policies for `sounds` table

```sql
CREATE POLICY "Users can view own sounds" ON public.sounds
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sounds" ON public.sounds
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sounds" ON public.sounds
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sounds" ON public.sounds
  FOR DELETE USING (auth.uid() = user_id);
```

### Step 9: Create RLS policies for `sound_presets` table

```sql
CREATE POLICY "Users can view own presets" ON public.sound_presets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own presets" ON public.sound_presets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own presets" ON public.sound_presets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own presets" ON public.sound_presets
  FOR DELETE USING (auth.uid() = user_id);
```

### Step 10: Create RLS policies for `preset_sounds` table

```sql
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
```

### Step 11: Create storage bucket policies

```sql
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

CREATE POLICY "Users can update own sounds" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'user-sounds' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own sounds" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'user-sounds' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

### Step 12: Create helper functions and triggers

```sql
-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_sounds_updated_at
  BEFORE UPDATE ON public.sounds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sound_presets_updated_at
  BEFORE UPDATE ON public.sound_presets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

### Step 13: Grant permissions

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sounds TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sound_presets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.preset_sounds TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
```

### Step 14: Verify setup

```sql
-- Check tables were created
SELECT
  schemaname,
  tablename,
  tableowner,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('sounds', 'sound_presets', 'preset_sounds')
ORDER BY tablename;

-- Check storage bucket
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'user-sounds';
```

## 🔧 Troubleshooting

### Issue: "relation auth.users does not exist"

If you get this error, it means your auth setup is incomplete. Run:

```sql
-- Check if users table exists
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'users';
```

If the `public.users` table doesn't exist, you need to run your existing user setup script first.

### Issue: "permission denied for schema storage"

This means storage policies aren't set up correctly. Make sure you're running these commands as a database owner or admin.

### Issue: Storage bucket creation fails

If the storage bucket creation fails, you can create it manually:

1. Go to Storage in your Supabase dashboard
2. Click "Create a new bucket"
3. Name: `user-sounds`
4. Public: **unchecked**
5. File size limit: 50MB
6. Allowed MIME types: `audio/mpeg`, `audio/wav`, `audio/ogg`, `audio/mp4`, `audio/x-m4a`

## ✅ Success Verification

After completing all steps, you should have:

- ✅ 3 new tables: `sounds`, `sound_presets`, `preset_sounds`
- ✅ All tables with proper indexes
- ✅ Row Level Security enabled and policies configured
- ✅ Storage bucket `user-sounds` created
- ✅ Helper functions and triggers for timestamp updates
- ✅ Proper permissions granted

You're now ready to move to Phase 2 of the implementation!
