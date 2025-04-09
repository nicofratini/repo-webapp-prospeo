/*
  # Agency Tables Configuration

  1. Changes
    - Ensure agency_info and agency_history tables exist
    - Add conditional checks to avoid duplicate objects
    - Ensure proper RLS policies exist
*/

-- Create agency_info table if it doesn't exist yet
CREATE TABLE IF NOT EXISTS agency_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  website text,
  address text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create agency_history table if it doesn't exist yet
CREATE TABLE IF NOT EXISTS agency_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  founded_date timestamptz,
  history text,
  milestones jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add status field to profiles for invitation handling
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- Enable RLS if not already enabled
ALTER TABLE agency_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_history ENABLE ROW LEVEL SECURITY;

-- Create triggers only if they don't already exist
DO $$
BEGIN
    -- Check if the trigger exists before creating it
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_agency_info_updated_at'
    ) THEN
        -- Create the trigger
        CREATE TRIGGER update_agency_info_updated_at
            BEFORE UPDATE ON agency_info
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Check if the trigger exists before creating it
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_agency_history_updated_at'
    ) THEN
        -- Create the trigger
        CREATE TRIGGER update_agency_history_updated_at
            BEFORE UPDATE ON agency_history
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

-- Drop policies if they exist (to avoid duplicate policy errors)
DROP POLICY IF EXISTS "Admins can manage agency info" ON agency_info;
DROP POLICY IF EXISTS "Users can read agency info" ON agency_info;
DROP POLICY IF EXISTS "Admins can manage agency history" ON agency_history;
DROP POLICY IF EXISTS "Users can read agency history" ON agency_history;

-- Create policies

-- Only admins can manage agency info
CREATE POLICY "Admins can manage agency info"
  ON agency_info
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- All authenticated users can read agency info
CREATE POLICY "Users can read agency info"
  ON agency_info
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can manage agency history
CREATE POLICY "Admins can manage agency history"
  ON agency_history
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- All authenticated users can read agency history
CREATE POLICY "Users can read agency history"
  ON agency_history
  FOR SELECT
  TO authenticated
  USING (true);

-- Ensure function exists to initialize agency data if it doesn't already
CREATE OR REPLACE FUNCTION initialize_agency_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  agency_count integer;
  history_count integer;
BEGIN
  -- Check if agency info exists
  SELECT COUNT(*) INTO agency_count FROM agency_info;
  
  -- Create default agency info if it doesn't exist
  IF agency_count = 0 THEN
    INSERT INTO agency_info (name, email) VALUES ('', '');
  END IF;

  -- Check if agency history exists
  SELECT COUNT(*) INTO history_count FROM agency_history;
  
  -- Create default agency history if it doesn't exist
  IF history_count = 0 THEN
    INSERT INTO agency_history (history, milestones) VALUES ('', '[]'::jsonb);
  END IF;
END;
$$;

-- Ensure execution permissions
GRANT EXECUTE ON FUNCTION initialize_agency_data() TO authenticated;