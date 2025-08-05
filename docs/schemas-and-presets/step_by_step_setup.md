# Step-by-Step Database Setup

If you're getting errors with the full SQL script, try running these commands one at a time in the Supabase SQL Editor.

## Step 1: Create the user_settings table

```sql
CREATE TABLE public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  theme_mode TEXT DEFAULT 'slate',
  stars_enabled BOOLEAN DEFAULT true,
  clock_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Step 2: Add constraints (run separately)

```sql
ALTER TABLE public.user_settings
ADD CONSTRAINT unique_user_id UNIQUE (user_id);
```

```sql
ALTER TABLE public.user_settings
ADD CONSTRAINT valid_theme_mode
CHECK (theme_mode IN ('slate', 'day', 'night', 'midnight'));
```

## Step 3: Create index

```sql
CREATE INDEX idx_user_settings_user_id ON public.user_settings(user_id);
```

## Step 4: Enable Row Level Security

```sql
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
```

## Step 5: Create policies (one at a time)

```sql
CREATE POLICY "Users can view own settings" ON public.user_settings
  FOR SELECT USING (auth.uid()::text = user_id::text);
```

```sql
CREATE POLICY "Users can insert own settings" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
```

```sql
CREATE POLICY "Users can update own settings" ON public.user_settings
  FOR UPDATE USING (auth.uid()::text = user_id::text);
```

```sql
CREATE POLICY "Users can delete own settings" ON public.user_settings
  FOR DELETE USING (auth.uid()::text = user_id::text);
```

## Alternative: Manual Table Creation

If SQL commands aren't working, you can create the table manually:

1. Go to **Table Editor** in Supabase
2. Click **"Create a new table"**
3. Name it: `user_settings`
4. Add these columns:
   - `id` (uuid, primary key, default: gen_random_uuid())
   - `user_id` (uuid, not null)
   - `theme_mode` (text, default: 'slate')
   - `stars_enabled` (bool, default: true)
   - `clock_enabled` (bool, default: true)
   - `created_at` (timestamptz, default: now())
   - `updated_at` (timestamptz, default: now())
5. Enable RLS in the table settings
6. Add the policies from Step 5 above
