-- Admin Database Schema for Referral System

-- Create admin roles enum
CREATE TYPE public.admin_role AS ENUM ('super_admin', 'admin', 'moderator');

-- Create the admins table
CREATE TABLE public.admins (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL UNIQUE,
    role public.admin_role NOT NULL DEFAULT 'admin',
    is_active boolean NOT NULL DEFAULT TRUE,
    invited_by uuid REFERENCES public.admins(id),
    invited_at timestamptz NOT NULL DEFAULT now(),
    accepted_at timestamptz,
    last_login_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create admin invitations table for pending invitations
CREATE TABLE public.admin_invitations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL,
    token text NOT NULL UNIQUE,
    role public.admin_role NOT NULL DEFAULT 'admin',
    invited_by uuid NOT NULL REFERENCES public.admins(id),
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);



-- Create indexes for better performance
CREATE INDEX idx_admins_email ON public.admins(email);
CREATE INDEX idx_admins_role ON public.admins(role);
CREATE INDEX idx_admins_is_active ON public.admins(is_active);
CREATE INDEX idx_admin_invitations_email ON public.admin_invitations(email);
CREATE INDEX idx_admin_invitations_token ON public.admin_invitations(token);
CREATE INDEX idx_admin_invitations_expires_at ON public.admin_invitations(expires_at);


-- Enable Row Level Security (RLS)
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_invitations ENABLE ROW LEVEL SECURITY;

-- Haven't implemented these yet
-- Create RLS policies for admins table
CREATE POLICY "Admins can view all admins" ON public.admins
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE email = auth.jwt() ->> 'email' 
            AND is_active = true
        )
    );

CREATE POLICY "Super admins can manage admins" ON public.admins
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE email = auth.jwt() ->> 'email' 
            AND role = 'super_admin' 
            AND is_active = true
        )
    );

-- Create RLS policies for admin_invitations table
CREATE POLICY "Admins can view invitations" ON public.admin_invitations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE email = auth.jwt() ->> 'email' 
            AND is_active = true
        )
    );

CREATE POLICY "Super admins can manage invitations" ON public.admin_invitations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE email = auth.jwt() ->> 'email' 
            AND role = 'super_admin' 
            AND is_active = true
        )
    );

-- Haven't implemented these yet


-- Create trigger to update the updated_at timestamp for admins
CREATE TRIGGER update_admins_updated_at 
    BEFORE UPDATE ON public.admins 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to clean up expired invitations
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM public.admin_invitations 
    WHERE expires_at < now();
END;
$$;

-- Create a scheduled job to clean up expired invitations (if using pg_cron)
-- SELECT cron.schedule('cleanup-expired-invitations', '0 2 * * *', 'SELECT cleanup_expired_invitations();');

-- Insert initial super admin (you'll need to replace with actual email)
-- INSERT INTO public.admins (email, role) VALUES ('your-email@example.com', 'super_admin'); 