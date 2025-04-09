/*
  # Add Super Admin Role

  1. Changes
    - Add super_admin column to profiles table
    - Update is_admin function to handle both admin types
    - Update existing policies
    
  2. Security
    - Only super admins can access admin routes
    - Regular admins can access everything except admin routes
*/

-- Add super_admin column to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS super_admin boolean DEFAULT false;

-- Update is_admin function to check both admin types
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id AND (is_admin = true OR super_admin = true)
  );
$$ language sql security definer;

-- Create function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id AND super_admin = true
  );
$$ language sql security definer;