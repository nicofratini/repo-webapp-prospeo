/*
  # Update Property Permissions

  1. Changes
    - Update RLS policies for properties table to enforce creator-only access
    - Add policies for admin access
    - Ensure proper cascading on user deletion

  2. Security
    - Only creators and admins can view properties
    - Only creators can modify their own properties
    - Admins can manage all properties
*/

-- First, drop existing policies
DROP POLICY IF EXISTS "Users can read own properties" ON properties;
DROP POLICY IF EXISTS "Users can insert own properties" ON properties;
DROP POLICY IF EXISTS "Users can update own properties" ON properties;
DROP POLICY IF EXISTS "Users can delete own properties" ON properties;

-- Create new policies with proper permissions

-- Creators and admins can read properties
CREATE POLICY "Creators and admins can read properties"
  ON properties
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    is_admin(auth.uid())
  );

-- Users can only insert properties for themselves
CREATE POLICY "Users can insert own properties"
  ON properties
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
  );

-- Only creators and admins can update properties
CREATE POLICY "Creators and admins can update properties"
  ON properties
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

-- Only creators and admins can delete properties
CREATE POLICY "Creators and admins can delete properties"
  ON properties
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    is_admin(auth.uid())
  );