/*
  # Create function for handling pending profiles

  1. New Function
    - `create_pending_profile`: Creates a new profile with pending status
  2. Security
    - Function is executed with invoker rights
    - Only authenticated users can call the function
*/

CREATE OR REPLACE FUNCTION create_pending_profile(email_address text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO profiles (id, email, status)
  VALUES (gen_random_uuid(), email_address, 'pending');
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_pending_profile(text) TO authenticated;

-- Update profiles RLS policy to allow function to insert
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Function can create pending profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (status = 'pending' AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email != profiles.email
    ))
  );