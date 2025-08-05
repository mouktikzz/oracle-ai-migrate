-- Create conversion_comments table for user comments on conversion results
CREATE TABLE IF NOT EXISTS public.conversion_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_id UUID,
  file_name TEXT NOT NULL,
  comment TEXT NOT NULL,
  conversion_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.conversion_comments ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversion_comments_file_id ON public.conversion_comments(file_id);
CREATE INDEX IF NOT EXISTS idx_conversion_comments_file_name ON public.conversion_comments(file_name);
CREATE INDEX IF NOT EXISTS idx_conversion_comments_user_id ON public.conversion_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_conversion_comments_created_at ON public.conversion_comments(created_at);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_conversion_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_conversion_comments_updated_at') THEN
        CREATE TRIGGER update_conversion_comments_updated_at
          BEFORE UPDATE ON public.conversion_comments
          FOR EACH ROW
          EXECUTE FUNCTION public.update_conversion_comments_updated_at();
    END IF;
END $$; 