-- Create the waves table
CREATE TABLE public.waves (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    start_position integer NOT NULL,
    end_position integer NOT NULL,
    is_active boolean NOT NULL DEFAULT false,
    activated_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    
    -- Ensure no overlapping position ranges
    CONSTRAINT waves_position_range_check CHECK (start_position <= end_position)
);

-- Create indexes for better performance
CREATE INDEX idx_waves_is_active ON public.waves(is_active);
CREATE INDEX idx_waves_position_range ON public.waves(start_position, end_position);

-- Enable RLS
ALTER TABLE public.waves ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for waves table (admin only access)
CREATE POLICY "Only admins can manage waves" ON public.waves
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_waves_updated_at 
    BEFORE UPDATE ON public.waves 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add wave_id and access_granted columns to users table
ALTER TABLE public.users 
ADD COLUMN wave_id uuid REFERENCES public.waves(id),
ADD COLUMN access_granted boolean NOT NULL DEFAULT false;

-- Create indexes for better performance
CREATE INDEX idx_users_wave_id ON public.users(wave_id);
CREATE INDEX idx_users_access_granted ON public.users(access_granted);

-- Function to assign users to waves based on their waitlist position
CREATE OR REPLACE FUNCTION assign_users_to_waves()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    user_record RECORD;
    wave_record RECORD;
    assigned_count integer := 0;
BEGIN
    -- Loop through all users who don't have a wave assigned yet
    FOR user_record IN 
        SELECT u.id, u.referral_count, l.rank as waitlist_position
        FROM public.users u
        LEFT JOIN public.leaderboard l ON u.id = l.id
        WHERE u.wave_id IS NULL
        ORDER BY l.rank ASC NULLS LAST, u.created_at ASC
    LOOP
        -- Find the appropriate wave for this user's position
        SELECT w.* INTO wave_record
        FROM public.waves w
        WHERE w.start_position <= user_record.waitlist_position 
          AND w.end_position >= user_record.waitlist_position
        ORDER BY w.start_position ASC
        LIMIT 1;
        
        -- Assign user to wave if found
        IF wave_record.id IS NOT NULL THEN
            UPDATE public.users 
            SET wave_id = wave_record.id
            WHERE id = user_record.id;
            
            assigned_count := assigned_count + 1;
        END IF;
    END LOOP;
    
    RETURN assigned_count;
END;
$$;

-- Function to activate a wave and grant access to all users in that wave
CREATE OR REPLACE FUNCTION activate_wave(wave_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
    wave_exists boolean;
    users_updated integer;
BEGIN
    -- Check if wave exists
    SELECT EXISTS(SELECT 1 FROM public.waves WHERE id = wave_uuid) INTO wave_exists;
    
    IF NOT wave_exists THEN
        RAISE EXCEPTION 'Wave with ID % does not exist', wave_uuid;
    END IF;
    
    -- Update wave to active
    UPDATE public.waves 
    SET 
        is_active = true,
        activated_at = now(),
        updated_at = now()
    WHERE id = wave_uuid;
    
    -- Grant access to all users in this wave
    UPDATE public.users 
    SET access_granted = true
    WHERE wave_id = wave_uuid;
    
    GET DIAGNOSTICS users_updated = ROW_COUNT;
    
    -- Log the activation
    RAISE NOTICE 'Activated wave % and granted access to % users', wave_uuid, users_updated;
    
    RETURN true;
END;
$$;

-- Function to deactivate a wave and revoke access from all users in that wave
CREATE OR REPLACE FUNCTION deactivate_wave(wave_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
    wave_exists boolean;
    users_updated integer;
BEGIN
    -- Check if wave exists
    SELECT EXISTS(SELECT 1 FROM public.waves WHERE id = wave_uuid) INTO wave_exists;
    
    IF NOT wave_exists THEN
        RAISE EXCEPTION 'Wave with ID % does not exist', wave_uuid;
    END IF;
    
    -- Update wave to inactive
    UPDATE public.waves 
    SET 
        is_active = false,
        activated_at = NULL,
        updated_at = now()
    WHERE id = wave_uuid;
    
    -- Revoke access from all users in this wave
    UPDATE public.users 
    SET access_granted = false
    WHERE wave_id = wave_uuid;
    
    GET DIAGNOSTICS users_updated = ROW_COUNT;
    
    -- Log the deactivation
    RAISE NOTICE 'Deactivated wave % and revoked access from % users', wave_uuid, users_updated;
    
    RETURN true;
END;
$$; 