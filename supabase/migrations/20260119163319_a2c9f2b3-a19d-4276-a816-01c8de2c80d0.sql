-- Add demo usage tracking columns to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN has_tried_demo boolean DEFAULT false,
ADD COLUMN demo_loaded_at timestamp with time zone;