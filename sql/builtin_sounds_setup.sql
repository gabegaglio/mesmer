-- Create public storage bucket for built-in sounds
INSERT INTO storage.buckets (id, name, public) VALUES ('builtin-sounds', 'builtin-sounds', true)
ON CONFLICT (id) DO NOTHING;

-- Create table for built-in sound metadata (optional but recommended)
CREATE TABLE IF NOT EXISTS builtin_sounds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(50) UNIQUE NOT NULL, -- Unique identifier like 'rain', 'ocean', etc.
  name VARCHAR(100) NOT NULL,
  file_path TEXT NOT NULL, -- Path in Supabase Storage
  file_size BIGINT NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  duration INTEGER, -- Duration in seconds
  category VARCHAR(20) NOT NULL CHECK (category IN ('Nature', 'Focus', 'Urban')),
  description TEXT,
  icon_key VARCHAR(50), -- Reference to icon (rain, ocean, etc.)
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS builtin_sounds_category_idx ON builtin_sounds(category);
CREATE INDEX IF NOT EXISTS builtin_sounds_sort_order_idx ON builtin_sounds(sort_order);
CREATE INDEX IF NOT EXISTS builtin_sounds_is_active_idx ON builtin_sounds(is_active);

-- Enable RLS (but allow public read access)
ALTER TABLE builtin_sounds ENABLE ROW LEVEL SECURITY;

-- Public read access to built-in sounds
CREATE POLICY "Public read access to built-in sounds" ON builtin_sounds
  FOR SELECT USING (is_active = true);

-- Only allow admin/system to insert/update (you'll need to implement admin check)
CREATE POLICY "Admin can manage built-in sounds" ON builtin_sounds
  FOR ALL USING (false); -- Replace with admin check when you implement it

-- Public access to built-in sounds storage
CREATE POLICY "Public access to built-in sounds storage" ON storage.objects
  FOR SELECT USING (bucket_id = 'builtin-sounds');

-- Insert your current built-in sounds metadata
INSERT INTO builtin_sounds (key, name, file_path, file_size, file_type, category, description, icon_key, sort_order) VALUES 
  ('rain', 'Rain', 'nature/rain.mp3', 0, 'audio/mpeg', 'Nature', 'Gentle rainfall sounds', 'rain', 1),
  ('ocean', 'Ocean', 'nature/ocean.mp3', 0, 'audio/mpeg', 'Nature', 'Ocean waves and surf', 'ocean', 2),
  ('fire', 'Fire', 'nature/fire.mp3', 0, 'audio/mpeg', 'Nature', 'Crackling fireplace', 'fire', 3),
  ('wind', 'Wind', 'nature/wind.mp3', 0, 'audio/mpeg', 'Nature', 'Gentle wind through trees', 'wind', 4),
  ('crickets', 'Crickets', 'nature/crickets.mp3', 0, 'audio/mpeg', 'Nature', 'Evening cricket sounds', 'crickets', 5),
  ('white', 'White Noise', 'focus/white.mp3', 0, 'audio/mpeg', 'Focus', 'Pure white noise for concentration', 'star', 6),
  ('pink', 'Pink Noise', 'focus/pink.mp3', 0, 'audio/mpeg', 'Focus', 'Pink noise for better sleep', 'star', 7),
  ('brown', 'Brown Noise', 'focus/brown.mp3', 0, 'audio/mpeg', 'Focus', 'Deep brown noise', 'star', 8),
  ('cafe', 'Cafe', 'urban/cafe.mp3', 0, 'audio/mpeg', 'Urban', 'Coffee shop ambience', 'coffee', 9),
  ('chimes', 'Chimes', 'urban/chimes.mp3', 0, 'audio/mpeg', 'Urban', 'Gentle wind chimes', 'chimes', 10)
ON CONFLICT (key) DO NOTHING; 