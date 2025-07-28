-- Add ai_generated_code column to unreviewed_files table
ALTER TABLE public.unreviewed_files 
ADD COLUMN ai_generated_code TEXT;

-- Add performance_metrics column to unreviewed_files table if it doesn't exist
ALTER TABLE public.unreviewed_files 
ADD COLUMN performance_metrics JSONB; 