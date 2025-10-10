-- Add accepted_at column to challenges table
ALTER TABLE public.challenges 
ADD COLUMN accepted_at timestamp with time zone;