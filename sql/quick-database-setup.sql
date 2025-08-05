-- QUICK DATABASE SETUP FOR MESMER ADMIN DASHBOARD
-- Copy and paste these commands ONE BY ONE into your Supabase SQL Editor

-- 1. Create the public.users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_sign_in_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_role CHECK (role IN ('user', 'admin'))
);

-- 2. Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Create policies for access control
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update user roles" ON public.users
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Allow user creation" ON public.users
  FOR INSERT WITH CHECK (true);

-- 4. Create function to automatically add users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, email, role, created_at, last_sign_in_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    NEW.created_at,
    NEW.last_sign_in_at
  );
  RETURN NEW;
END;
$$;

-- 5. Create trigger to run the function
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;

-- 7. Add existing users (if any) - this will populate current users
INSERT INTO public.users (id, email, role, created_at, last_sign_in_at)
SELECT 
  id, 
  email, 
  'user' as role,
  created_at,
  last_sign_in_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 🎯 MAKE YOURSELF ADMIN (EDIT THIS LINE!)
-- ========================================
-- Replace 'your-email@example.com' with your actual email:
-- UPDATE public.users SET role = 'admin' WHERE email = 'your-email@example.com'; 