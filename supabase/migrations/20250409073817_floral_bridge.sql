/*
  # Role System Refactoring

  1. Changes
    - Add new role column to profiles table
    - Migrate existing admin flags to role values
    - Create role checking function with hierarchy
    - Update RLS policies to use new role system
    
  2. Security
    - Maintain existing security while transitioning
    - Ensure no security gaps during migration
    - Add proper role hierarchy checks
*/

-- 1. Add new role column with default value
ALTER TABLE public.profiles 
ADD COLUMN role TEXT NOT NULL DEFAULT 'user';

-- 2. Migrate existing admin data to roles
-- First set super_admin roles (highest priority)
UPDATE public.profiles
SET role = 'super_admin'
WHERE super_admin = true;

-- Then set admin roles (but not for super_admins)
UPDATE public.profiles
SET role = 'admin'
WHERE is_admin = true 
AND super_admin IS NOT TRUE;

-- 3. Create role checking function with hierarchy
CREATE OR REPLACE FUNCTION public.check_user_role(p_user_id UUID, p_required_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_role TEXT;
  v_role_hierarchy TEXT[] := ARRAY['user', 'admin', 'super_admin'];
  v_user_role_index INT;
  v_required_role_index INT;
BEGIN
  -- Get user's role
  SELECT role INTO v_user_role 
  FROM public.profiles 
  WHERE id = p_user_id;

  -- Return false if no profile found
  IF v_user_role IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Get hierarchy positions
  v_user_role_index := array_position(v_role_hierarchy, v_user_role);
  v_required_role_index := array_position(v_role_hierarchy, p_required_role);

  -- Return false if invalid roles
  IF v_user_role_index IS NULL OR v_required_role_index IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check if user's role is high enough in hierarchy
  RETURN v_user_role_index >= v_required_role_index;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 4. Update RLS policies for all affected tables

-- Profiles table
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile creation on signup" ON public.profiles;
DROP POLICY IF EXISTS "Function can create pending profiles" ON public.profiles;

CREATE POLICY "Profiles - Users can read own profile"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id OR 
    check_user_role(auth.uid(), 'admin')
  );

CREATE POLICY "Profiles - Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Profiles - Allow creation on signup"
  ON public.profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() = id OR
    (status = 'pending' AND check_user_role(auth.uid(), 'admin'))
  );

-- Properties table
DROP POLICY IF EXISTS "Creators and admins can read properties" ON public.properties;
DROP POLICY IF EXISTS "Users can insert own properties" ON public.properties;
DROP POLICY IF EXISTS "Creators and admins can update properties" ON public.properties;
DROP POLICY IF EXISTS "Creators and admins can delete properties" ON public.properties;

CREATE POLICY "Properties - Users can read own properties"
  ON public.properties
  FOR SELECT
  USING (
    auth.uid() = user_id OR 
    check_user_role(auth.uid(), 'admin')
  );

CREATE POLICY "Properties - Users can insert own properties"
  ON public.properties
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Properties - Users can update own properties"
  ON public.properties
  FOR UPDATE
  USING (
    auth.uid() = user_id OR 
    check_user_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    auth.uid() = user_id OR 
    check_user_role(auth.uid(), 'admin')
  );

CREATE POLICY "Properties - Users can delete own properties"
  ON public.properties
  FOR DELETE
  USING (
    auth.uid() = user_id OR 
    check_user_role(auth.uid(), 'admin')
  );

-- Agency Info table
DROP POLICY IF EXISTS "Admins can manage agency info" ON public.agency_info;
DROP POLICY IF EXISTS "Users can read agency info" ON public.agency_info;

CREATE POLICY "Agency Info - Admin management"
  ON public.agency_info
  FOR ALL
  USING (check_user_role(auth.uid(), 'admin'))
  WITH CHECK (check_user_role(auth.uid(), 'admin'));

CREATE POLICY "Agency Info - User read access"
  ON public.agency_info
  FOR SELECT
  USING (true);

-- Agency History table
DROP POLICY IF EXISTS "Admins can manage agency history" ON public.agency_history;
DROP POLICY IF EXISTS "Users can read agency history" ON public.agency_history;

CREATE POLICY "Agency History - Admin management"
  ON public.agency_history
  FOR ALL
  USING (check_user_role(auth.uid(), 'admin'))
  WITH CHECK (check_user_role(auth.uid(), 'admin'));

CREATE POLICY "Agency History - User read access"
  ON public.agency_history
  FOR SELECT
  USING (true);

-- User Agents table
DROP POLICY IF EXISTS "Users can read own assignments" ON public.user_agents;
DROP POLICY IF EXISTS "Admins can manage assignments" ON public.user_agents;

CREATE POLICY "User Agents - Read own assignments"
  ON public.user_agents
  FOR SELECT
  USING (
    auth.uid() = user_id OR 
    check_user_role(auth.uid(), 'admin')
  );

CREATE POLICY "User Agents - Admin management"
  ON public.user_agents
  FOR ALL
  USING (check_user_role(auth.uid(), 'admin'))
  WITH CHECK (check_user_role(auth.uid(), 'admin'));

-- Knowledge Base Documents table
DROP POLICY IF EXISTS "Users can read own knowledge base documents" ON public.knowledge_base_documents;
DROP POLICY IF EXISTS "Users can insert own knowledge base documents" ON public.knowledge_base_documents;
DROP POLICY IF EXISTS "Users can update own knowledge base documents" ON public.knowledge_base_documents;
DROP POLICY IF EXISTS "Users can delete own knowledge base documents" ON public.knowledge_base_documents;

CREATE POLICY "Knowledge Base - Read documents"
  ON public.knowledge_base_documents
  FOR SELECT
  USING (
    auth.uid() = user_id OR 
    check_user_role(auth.uid(), 'admin')
  );

CREATE POLICY "Knowledge Base - Insert documents"
  ON public.knowledge_base_documents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Knowledge Base - Update documents"
  ON public.knowledge_base_documents
  FOR UPDATE
  USING (
    auth.uid() = user_id OR 
    check_user_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    auth.uid() = user_id OR 
    check_user_role(auth.uid(), 'admin')
  );

CREATE POLICY "Knowledge Base - Delete documents"
  ON public.knowledge_base_documents
  FOR DELETE
  USING (
    auth.uid() = user_id OR 
    check_user_role(auth.uid(), 'admin')
  );

-- Agent Knowledge Base table
DROP POLICY IF EXISTS "Users can read agent knowledge base assignments" ON public.agent_knowledge_base;
DROP POLICY IF EXISTS "Users can insert agent knowledge base assignments" ON public.agent_knowledge_base;
DROP POLICY IF EXISTS "Users can delete agent knowledge base assignments" ON public.agent_knowledge_base;

CREATE POLICY "Agent Knowledge Base - Read assignments"
  ON public.agent_knowledge_base
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_agents ua
      WHERE ua.agent_id = agent_knowledge_base.agent_id
      AND ua.user_id = auth.uid()
    ) OR check_user_role(auth.uid(), 'admin')
  );

CREATE POLICY "Agent Knowledge Base - Insert assignments"
  ON public.agent_knowledge_base
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_agents ua
      WHERE ua.agent_id = agent_knowledge_base.agent_id
      AND ua.user_id = auth.uid()
    ) OR check_user_role(auth.uid(), 'admin')
  );

CREATE POLICY "Agent Knowledge Base - Delete assignments"
  ON public.agent_knowledge_base
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_agents ua
      WHERE ua.agent_id = agent_knowledge_base.agent_id
      AND ua.user_id = auth.uid()
    ) OR check_user_role(auth.uid(), 'admin')
  );

-- 5. Mark old columns as deprecated
COMMENT ON COLUMN public.profiles.is_admin IS 'Deprecated: Use "role" column instead. To be removed in a future migration.';
COMMENT ON COLUMN public.profiles.super_admin IS 'Deprecated: Use "role" column instead. To be removed in a future migration.';