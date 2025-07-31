-- Fix for admin panel only showing current user
-- Run this SQL in your Supabase SQL Editor to allow admins to view all users

-- First, drop the problematic policies if they exist
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete all profiles" ON public.profiles;

-- Create a function to check if current user is admin (avoids circular reference)
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = auth.uid();
  
  RETURN user_role IN ('admin', 'moderator');
END;
$$;

-- Policy for admins to view all profiles (using the function)
CREATE POLICY "Admins can view all profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (
    public.is_current_user_admin() OR auth.uid() = id
  );

-- Policy for admins to update all profiles (using the function)
CREATE POLICY "Admins can update all profiles" 
  ON public.profiles 
  FOR UPDATE 
  USING (
    public.is_current_user_admin() OR auth.uid() = id
  );

-- Policy for admins to delete all profiles (using the function)
CREATE POLICY "Admins can delete all profiles" 
  ON public.profiles 
  FOR DELETE 
  USING (
    public.is_current_user_admin()
  );

-- Verify the policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'profiles' 
AND policyname LIKE '%admin%'; 