-- Database Setup for Mesmer App with Role-Based Authentication
-- Run these commands in your Supabase SQL editor

-- 1. Create users table in public schema
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_sign_in_at TIMESTAMP WITH TIME ZONE,
  
  -- Ensure role is either 'user' or 'admin'
  CONSTRAINT valid_role CHECK (role IN ('user', 'admin'))
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies

-- Policy: Users can view their own data
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Policy: Users can update their own data (except role)
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND 
    role = (SELECT role FROM public.users WHERE id = auth.uid())
  );

-- Policy: Admins can view all users
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Admins can update user roles
CREATE POLICY "Admins can update user roles" ON public.users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Allow inserting new users (for triggers)
CREATE POLICY "Allow user creation" ON public.users
  FOR INSERT WITH CHECK (true);

-- 4. Create function to handle new user creation
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

-- 5. Create trigger to automatically create user record
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Create function to handle user updates
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.users
  SET 
    email = NEW.email,
    last_sign_in_at = NEW.last_sign_in_at,
    updated_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

-- 7. Create trigger to update user data
CREATE OR REPLACE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

-- 8. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;

-- 9. Create an admin user (replace with your email)
-- First, you need to sign up with this email through your app
-- Then run this to make yourself admin:
-- UPDATE public.users SET role = 'admin' WHERE email = 'your-admin-email@example.com';

-- 10. Optional: Create indexes for better performance
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_created_at ON public.users(created_at);

-- 11. Optional: Create a view for admin dashboard statistics
CREATE OR REPLACE VIEW public.user_stats AS
SELECT 
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE role = 'admin') as admin_count,
  COUNT(*) FILTER (WHERE role = 'user') as user_count,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as new_users_week,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_users_month
FROM public.users;

-- Grant access to the view
GRANT SELECT ON public.user_stats TO authenticated;

-- Instructions:
-- 1. Copy and paste these commands one by one into your Supabase SQL editor
-- 2. Run them in order
-- 3. After setting up, sign up through your app
-- 4. Then run: UPDATE public.users SET role = 'admin' WHERE email = 'your-email@example.com';
-- 5. Your admin dashboard should now work! 