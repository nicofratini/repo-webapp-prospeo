/*
  # Agency Information Schema

  1. New Tables
    - `agency_info`
      - Basic agency information like name, contact details, etc.
    - `agency_history`
      - Historical information and milestones

  2. Security
    - Enable RLS
    - Add policies for admin access
*/

-- Create agency_info table
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

-- Create agency_history table
CREATE TABLE IF NOT EXISTS agency_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  founded_date date,
  history text,
  milestones jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add status field to profiles for invitation handling
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- Enable RLS
ALTER TABLE agency_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_history ENABLE ROW LEVEL SECURITY;

-- Create updated_at triggers
CREATE TRIGGER update_agency_info_updated_at
    BEFORE UPDATE ON agency_info
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agency_history_updated_at
    BEFORE UPDATE ON agency_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

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