/*
  # User-Agent Assignments Schema

  1. New Tables
    - `user_agents`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles.id)
      - `agent_id` (text, not null)
      - `created_at` (timestamp with timezone)
      - `updated_at` (timestamp with timezone)

  2. Security
    - Enable RLS on `user_agents` table
    - Add policies for:
      - Users can read their own assignments
      - Admins can read and manage all assignments
*/

-- Create user_agents table
CREATE TABLE IF NOT EXISTS user_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  agent_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(agent_id)
);

-- Enable Row Level Security
ALTER TABLE user_agents ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_user_agents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_agents_updated_at
    BEFORE UPDATE ON user_agents
    FOR EACH ROW
    EXECUTE FUNCTION update_user_agents_updated_at();

-- Create policies

-- Users can read their own assignments
CREATE POLICY "Users can read own assignments"
  ON user_agents
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    is_admin(auth.uid())
  );

-- Only admins can manage assignments
CREATE POLICY "Admins can manage assignments"
  ON user_agents
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));