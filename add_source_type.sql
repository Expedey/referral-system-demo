-- Create the source_type enum
CREATE TYPE public.source_type AS ENUM ('organic', 'team-invite');

-- Add source_type column to referrals table
ALTER TABLE public.referrals 
ADD COLUMN source_type public.source_type NOT NULL DEFAULT 'organic'; 