-- Add classification fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS classification_fixed_id text,
ADD COLUMN IF NOT EXISTS classification_name text;