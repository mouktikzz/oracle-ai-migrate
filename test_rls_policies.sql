-- Test script to verify RLS policies are working correctly
-- Run this in your Supabase SQL Editor

-- First, let's check if we can see the table structure
SELECT 'Table Structure Check' as test_name;

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'conversion_comments'
ORDER BY ordinal_position;

-- Check RLS policies
SELECT 'RLS Policies Check' as test_name;

SELECT 
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'conversion_comments'
ORDER BY policyname;

-- Test inserting a comment (this should work if you're authenticated)
SELECT 'Testing Comment Insert' as test_name;

-- Try to insert a test comment
INSERT INTO public.conversion_comments (
    file_id,
    file_name,
    comment,
    is_public
) VALUES (
    'test-file-' || extract(epoch from now()),
    'test-conversion.sql',
    'This is a test comment to verify RLS policies',
    false
) RETURNING id, file_id, comment, created_at;

-- Check if the comment was inserted
SELECT 'Checking Inserted Comment' as test_name;

SELECT 
    id,
    file_id,
    file_name,
    comment,
    created_at,
    updated_at
FROM public.conversion_comments 
WHERE file_id LIKE 'test-file-%'
ORDER BY created_at DESC
LIMIT 5;

-- Clean up test data
SELECT 'Cleaning Up Test Data' as test_name;

DELETE FROM public.conversion_comments 
WHERE file_id LIKE 'test-file-%';

SELECT 'Test completed successfully!' as status; 