/*
  # Enable Multiple Agent Assignments

  1. Changes
    - Remove unique constraint on agent_id in user_agents table
    - Add composite unique constraint on user_id and agent_id
    
  2. Security
    - Maintain existing RLS policies
*/

-- Remove the existing unique constraint on agent_id
ALTER TABLE user_agents DROP CONSTRAINT IF EXISTS user_agents_agent_id_key;

-- Add a composite unique constraint to prevent duplicate assignments
ALTER TABLE user_agents 
ADD CONSTRAINT user_agents_user_agent_unique 
UNIQUE (user_id, agent_id);