-- Add admin policies for profiles table to allow admins to view and manage all users
-- This allows admins to see all users in the admin panel

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