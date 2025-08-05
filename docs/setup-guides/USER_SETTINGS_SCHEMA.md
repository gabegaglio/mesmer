# User Settings Schema

A simplified settings table to store basic user preferences for theme, clock, and stars.

## Settings Table

```sql
CREATE TABLE public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Theme Settings
  theme_mode TEXT DEFAULT 'slate' CHECK (theme_mode IN ('slate', 'day', 'night', 'midnight')),

  -- Visual Effects
  stars_enabled BOOLEAN DEFAULT true,
  clock_enabled BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one settings record per user
  UNIQUE(user_id)
);
```

## Indexes

```sql
-- Index for fast user lookups
CREATE INDEX idx_user_settings_user_id ON public.user_settings(user_id);
```

## Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Users can only see and modify their own settings
CREATE POLICY "Users can view own settings" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings" ON public.user_settings
  FOR DELETE USING (auth.uid() = user_id);
```

## Functions

```sql
-- Function to automatically create settings for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create settings when a new user is created
CREATE TRIGGER on_auth_user_created_settings
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_settings();
```

## Usage

### Create/Update Settings

```typescript
const { data, error } = await supabase
  .from("user_settings")
  .upsert({
    user_id: user.id,
    theme_mode: "night",
    stars_enabled: true,
    clock_enabled: false,
  })
  .select()
  .single();
```

### Get User Settings

```typescript
const { data: settings, error } = await supabase
  .from("user_settings")
  .select("*")
  .eq("user_id", user.id)
  .single();
```
