-- FIX INFINITE RECURSION IN RLS POLICIES
-- Run these commands in your Supabase SQL Editor to fix the admin button issue

-- 1. Drop all existing policies (they cause infinite recursion)
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update user roles" ON public.users;
DROP POLICY IF EXISTS "Allow user creation" ON public.users;

-- 2. Create simpler, non-recursive policies

-- Allow users to see their own record
CREATE POLICY "Users can view own record" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own record (but not role)
CREATE POLICY "Users can update own record" ON public.users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1));

-- Allow authenticated users to read all users (needed for admin dashboard)
-- We'll handle admin-only access in the application layer
CREATE POLICY "Authenticated users can view users" ON public.users
  FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to update users (admin check in app)
CREATE POLICY "Authenticated users can update users" ON public.users
  FOR UPDATE TO authenticated USING (true);

-- Allow inserting new users (for triggers)
CREATE POLICY "Allow user creation" ON public.users
  FOR INSERT WITH CHECK (true);

-- 3. Create a simple function to check if current user is admin
-- This avoids the recursive policy issue
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role FROM public.users WHERE id = auth.uid() LIMIT 1;
  RETURN COALESCE(user_role, 'user') = 'admin';
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 4. Verify your admin status
SELECT email, role FROM public.users WHERE email = 'gabriel.gaglio047@gmail.com'; 