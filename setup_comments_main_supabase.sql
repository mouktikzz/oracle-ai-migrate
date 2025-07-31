-- SQL script to create conversion_comments table in MAIN Supabase project
-- Run this in your MAIN Supabase SQL Editor

-- Create the conversion_comments table
CREATE TABLE IF NOT EXISTS public.conversion_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    file_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    comment TEXT NOT NULL,
    conversion_id TEXT,
    is_public BOOLEAN DEFAULT false
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversion_comments_user_id ON public.conversion_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_conversion_comments_file_id ON public.conversion_comments(file_id);
CREATE INDEX IF NOT EXISTS idx_conversion_comments_conversion_id ON public.conversion_comments(conversion_id);
CREATE INDEX IF NOT EXISTS idx_conversion_comments_created_at ON public.conversion_comments(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.conversion_comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy for users to see their own comments
CREATE POLICY "Users can view their own comments" ON public.conversion_comments
    FOR SELECT USING (auth.uid() = user_id);

-- Policy for users to insert their own comments
CREATE POLICY "Users can insert their own comments" ON public.conversion_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own comments
CREATE POLICY "Users can update their own comments" ON public.conversion_comments
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy for users to delete their own comments
CREATE POLICY "Users can delete their own comments" ON public.conversion_comments
    FOR DELETE USING (auth.uid() = user_id);

-- Set replica identity for realtime
ALTER TABLE public.conversion_comments REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversion_comments;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_conversion_comments_updated_at 
    BEFORE UPDATE ON public.conversion_comments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON public.conversion_comments TO authenticated;
GRANT ALL ON public.conversion_comments TO service_role;

-- Verify the setup
SELECT 'Table created successfully' as status; 