-- Create the referral_status enum type
CREATE TYPE public.referral_status AS ENUM ('pending', 'verified', 'cancelled');

-- Create the user_type enum type
CREATE TYPE public.user_type AS ENUM ('regular', 'corporate');

-- Create the users table
CREATE TABLE public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id),
    email text NOT NULL UNIQUE,
    username text,
    referral_code text NOT NULL UNIQUE,
    is_verified boolean NOT NULL DEFAULT FALSE,
    referral_count integer NOT NULL DEFAULT 0,
    last_referral_at timestamptz,
    user_type public.user_type NOT NULL DEFAULT 'regular',
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Create the referrals table
CREATE TABLE public.referrals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id uuid NOT NULL REFERENCES public.users(id),
    referred_user_id uuid REFERENCES public.users(id),
    referred_email text NOT NULL,
    referred_ip inet,
    status public.referral_status NOT NULL DEFAULT 'pending',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_users_referral_code ON public.users(referral_code);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_referred_email ON public.referrals(referred_email);
CREATE INDEX idx_referrals_status ON public.referrals(status);
CREATE INDEX idx_referrals_created_at ON public.referrals(created_at);

-- Create the leaderboard view
CREATE VIEW public.leaderboard AS
SELECT
    u.id,
    u.username,
    u.referral_code,
    u.referral_count as total_referrals,
    ROW_NUMBER() OVER (ORDER BY u.referral_count DESC, u.created_at ASC) as rank
FROM public.users u
ORDER BY u.referral_count DESC, u.created_at ASC;

-- Create a function to increment referral count
CREATE OR REPLACE FUNCTION increment_referral_count(user_id uuid)
RETURNS integer
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN (
        SELECT referral_count + 1 
        FROM public.users 
        WHERE id = user_id
    );
END;
$$;

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for referrals table
CREATE POLICY "Users can view referrals they made" ON public.referrals
    FOR SELECT USING (auth.uid() = referrer_id);

CREATE POLICY "Users can view referrals where they were referred" ON public.referrals
    FOR SELECT USING (auth.uid() = referred_user_id);

CREATE POLICY "Users can insert referrals" ON public.referrals
    FOR INSERT WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "System can update referrals" ON public.referrals
    FOR UPDATE USING (true);

-- Create RLS policies for leaderboard view
CREATE POLICY "Anyone can view leaderboard" ON public.leaderboard
    FOR SELECT USING (true);

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_referrals_updated_at 
    BEFORE UPDATE ON public.referrals 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Trigger function to handle pending -> verified transition
CREATE OR REPLACE FUNCTION public.handle_referral_verified()
RETURNS trigger AS $$
BEGIN
    -- Check if status is changing from pending to verified
    IF OLD.status = 'pending' AND NEW.status = 'verified' THEN
        -- Update the referrer's stats
        UPDATE public.users 
        SET 
            referral_count = referral_count + 1,
            last_referral_at = now()
        WHERE id = NEW.referrer_id;
    END IF;
    
    -- Always update the updated_at timestamp
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Attach the trigger to referrals.status updates
CREATE TRIGGER trg_referral_status_change
    AFTER UPDATE OF status ON public.referrals
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_referral_verified(); 