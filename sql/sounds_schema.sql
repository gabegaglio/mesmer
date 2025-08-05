-- Create sounds table for storing sound metadata
CREATE TABLE IF NOT EXISTS sounds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  file_path TEXT NOT NULL, -- Path in Supabase Storage
  file_size BIGINT NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  duration INTEGER, -- Duration in seconds
  category VARCHAR(20) NOT NULL CHECK (category IN ('Nature', 'Focus', 'Urban', 'Custom')),
  description TEXT,
  icon_path TEXT, -- Optional custom icon path
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS sounds_user_id_idx ON sounds(user_id);
CREATE INDEX IF NOT EXISTS sounds_category_idx ON sounds(category);
CREATE INDEX IF NOT EXISTS sounds_is_active_idx ON sounds(is_active);

-- Enable Row Level Security
ALTER TABLE sounds ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can insert their own sounds" ON sounds
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own sounds" ON sounds
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own sounds" ON sounds
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sounds" ON sounds
  FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket for audio files
INSERT INTO storage.buckets (id, name, public) VALUES ('sounds', 'sounds', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for sounds bucket
CREATE POLICY "Users can upload their own sounds" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'sounds' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own sounds" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'sounds' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own sounds" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'sounds' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own sounds" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'sounds' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_sounds_updated_at 
  BEFORE UPDATE ON sounds 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column(); 