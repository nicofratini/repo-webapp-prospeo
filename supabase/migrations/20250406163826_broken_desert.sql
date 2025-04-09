/*
  # Knowledge Base Schema

  1. New Tables
    - `knowledge_base_documents`
      - `id` (text, primary key) - ElevenLabs document ID
      - `user_id` (uuid, references profiles.id)
      - `name` (text, not null)
      - `description` (text)
      - `size_bytes` (bigint)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `knowledge_base_documents` table
    - Add policies for:
      - Users can read their own documents
      - Admins can read all documents
      - Users can manage their own documents
      - Admins can manage all documents
*/

-- Create knowledge_base_documents table
CREATE TABLE IF NOT EXISTS knowledge_base_documents (
  id text PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  size_bytes bigint,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE knowledge_base_documents ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger
CREATE TRIGGER update_knowledge_base_documents_updated_at
    BEFORE UPDATE ON knowledge_base_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create policies

-- Users can read their own documents and admins can read all
CREATE POLICY "Users can read own knowledge base documents"
  ON knowledge_base_documents
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    is_admin(auth.uid())
  );

-- Users can insert their own documents
CREATE POLICY "Users can insert own knowledge base documents"
  ON knowledge_base_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
  );

-- Users can update their own documents and admins can update all
CREATE POLICY "Users can update own knowledge base documents"
  ON knowledge_base_documents
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    is_admin(auth.uid())
  )
  WITH CHECK (
    auth.uid() = user_id OR
    is_admin(auth.uid())
  );

-- Users can delete their own documents and admins can delete all
CREATE POLICY "Users can delete own knowledge base documents"
  ON knowledge_base_documents
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    is_admin(auth.uid())
  );

-- Create indexes
CREATE INDEX knowledge_base_documents_user_id_idx ON knowledge_base_documents(user_id);
CREATE INDEX knowledge_base_documents_created_at_idx ON knowledge_base_documents(created_at);