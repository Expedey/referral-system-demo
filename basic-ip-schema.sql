-- Basic IP fraud check schema additions
-- Run this after your existing database-schema.sql

-- Add index on referred_ip for faster IP-based queries
CREATE INDEX IF NOT EXISTS idx_referrals_referred_ip ON public.referrals(referred_ip);

-- Add index on created_at for time-based IP queries
CREATE INDEX IF NOT EXISTS idx_referrals_ip_created_at ON public.referrals(referred_ip, created_at);

-- Optional: Add a simple view for IP-based referral analytics
CREATE OR REPLACE VIEW public.ip_referral_stats AS
SELECT 
    referred_ip,
    COUNT(*) as total_referrals,
    COUNT(CASE WHEN status = 'verified' THEN 1 END) as verified_referrals,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_referrals,
    MIN(created_at) as first_referral,
    MAX(created_at) as last_referral
FROM public.referrals 
WHERE referred_ip IS NOT NULL
GROUP BY referred_ip
ORDER BY total_referrals DESC;

-- Enable RLS on the new view
ALTER VIEW public.ip_referral_stats ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for the view (admin only)
CREATE POLICY "Admin can view IP referral stats" ON public.ip_referral_stats
    FOR SELECT USING (auth.role() = 'authenticated'); 