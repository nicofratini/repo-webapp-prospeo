/*
  # Fix Agency Tables and Policies

  1. Changes
    - Fix agency_info table and policies
    - Fix agency_history table and policies
    - Update RLS policies for better access control
*/

-- Fix agency_history table
ALTER TABLE agency_history 
  DROP COLUMN IF EXISTS founded_date,
  ADD COLUMN founded_date timestamptz;

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage agency info" ON agency_info;
DROP POLICY IF EXISTS "Users can read agency info" ON agency_info;
DROP POLICY IF EXISTS "Admins can manage agency history" ON agency_history;
DROP POLICY IF EXISTS "Users can read agency history" ON agency_history;

-- Create new policies for agency_info
CREATE POLICY "Admins can manage agency info"
  ON agency_info
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Users can read agency info"
  ON agency_info
  FOR SELECT
  TO authenticated
  USING (true);

-- Create new policies for agency_history
CREATE POLICY "Admins can manage agency history"
  ON agency_history
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Users can read agency history"
  ON agency_history
  FOR SELECT
  TO authenticated
  USING (true);

-- Create function to initialize agency data
CREATE OR REPLACE FUNCTION initialize_agency_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create default agency info if it doesn't exist
  INSERT INTO agency_info (name, email)
  SELECT '', ''
  WHERE NOT EXISTS (SELECT 1 FROM agency_info);

  -- Create default agency history if it doesn't exist
  INSERT INTO agency_history (history, milestones)
  SELECT '', '[]'::jsonb
  WHERE NOT EXISTS (SELECT 1 FROM agency_history);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION initialize_agency_data() TO authenticated;