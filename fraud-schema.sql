-- Fraud Records Table
-- Add this to your existing database schema

CREATE TABLE IF NOT EXISTS public.fraud_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  user_email TEXT NOT NULL,
  referred_from TEXT,
  fraud_flag BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_fraud_records_ip ON public.fraud_records(ip_address);
CREATE INDEX IF NOT EXISTS idx_fraud_records_email ON public.fraud_records(user_email);
CREATE INDEX IF NOT EXISTS idx_fraud_records_created ON public.fraud_records(created_at);

-- RLS policies for fraud records
CREATE POLICY "Admin can view fraud records" ON public.fraud_records
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "System can insert fraud records" ON public.fraud_records
  FOR INSERT WITH CHECK (true);

-- Update trigger for fraud records
CREATE OR REPLACE FUNCTION update_fraud_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_fraud_records_updated_at
  BEFORE UPDATE ON public.fraud_records
  FOR EACH ROW
  EXECUTE FUNCTION update_fraud_records_updated_at(); 