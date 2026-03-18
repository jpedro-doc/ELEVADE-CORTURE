-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'companies' AND policyname = 'allow_all_companies'
  ) THEN
    CREATE POLICY allow_all_companies ON companies FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Add service_date to ordens_servico
ALTER TABLE ordens_servico ADD COLUMN IF NOT EXISTS service_date DATE;

-- Add company_id to ordens_servico
ALTER TABLE ordens_servico ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
