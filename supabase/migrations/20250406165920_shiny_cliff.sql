/*
  # Knowledge Base Assignments Schema

  1. New Tables
    - `agent_knowledge_base`
      - `id` (uuid, primary key)
      - `agent_id` (text, not null)
      - `document_id` (text, references knowledge_base_documents)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for:
      - Users can read assignments for their agents
      - Users can manage assignments for their agents
      - Admins can manage all assignments
*/

-- Create agent_knowledge_base table
CREATE TABLE IF NOT EXISTS agent_knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id text NOT NULL,
  document_id text REFERENCES knowledge_base_documents(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(agent_id, document_id)
);

-- Enable Row Level Security
ALTER TABLE agent_knowledge_base ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger
CREATE TRIGGER update_agent_knowledge_base_updated_at
    BEFORE UPDATE ON agent_knowledge_base
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create policies

-- Users can read assignments for their agents
CREATE POLICY "Users can read agent knowledge base assignments"
  ON agent_knowledge_base
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_agents ua
      WHERE ua.agent_id = agent_knowledge_base.agent_id
      AND ua.user_id = auth.uid()
    ) OR is_admin(auth.uid())
  );

-- Users can insert assignments for their agents
CREATE POLICY "Users can insert agent knowledge base assignments"
  ON agent_knowledge_base
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_agents ua
      WHERE ua.agent_id = agent_knowledge_base.agent_id
      AND ua.user_id = auth.uid()
    ) OR is_admin(auth.uid())
  );

-- Users can delete assignments for their agents
CREATE POLICY "Users can delete agent knowledge base assignments"
  ON agent_knowledge_base
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_agents ua
      WHERE ua.agent_id = agent_knowledge_base.agent_id
      AND ua.user_id = auth.uid()
    ) OR is_admin(auth.uid())
  );

-- Create indexes
CREATE INDEX agent_knowledge_base_agent_id_idx ON agent_knowledge_base(agent_id);
CREATE INDEX agent_knowledge_base_document_id_idx ON agent_knowledge_base(document_id);