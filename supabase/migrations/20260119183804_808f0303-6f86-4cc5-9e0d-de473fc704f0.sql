-- Add has_analyzed flag to track if user has completed at least one analysis
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS has_analyzed BOOLEAN DEFAULT false;