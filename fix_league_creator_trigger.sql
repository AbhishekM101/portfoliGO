-- Fix League Creator Auto-Join Trigger
-- Run this in your Supabase SQL Editor to ensure league creators are automatically added as members

-- Step 1: Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS make_creator_admin_trigger ON leagues;
DROP FUNCTION IF EXISTS make_creator_admin();

-- Step 2: Create improved function to automatically make league creators admins
CREATE OR REPLACE FUNCTION make_creator_admin()
RETURNS TRIGGER AS $$
DECLARE
  user_team_name TEXT;
BEGIN
  -- Get user's team name from their profile, or use a default
  SELECT COALESCE(
    (auth.jwt() ->> 'user_metadata' ->> 'team_name'),
    'My Team'
  ) INTO user_team_name;
  
  -- When a league is created, automatically add the creator as an admin member
  INSERT INTO league_members (league_id, user_id, team_name, is_commissioner)
  VALUES (NEW.id, NEW.created_by, user_team_name, true);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the league creation
    RAISE WARNING 'Failed to add creator as admin member: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create trigger to automatically make creators admins
CREATE TRIGGER make_creator_admin_trigger
  AFTER INSERT ON leagues
  FOR EACH ROW
  EXECUTE FUNCTION make_creator_admin();

-- Step 4: Test the trigger by checking if it exists
SELECT 
  trigger_name, 
  event_manipulation, 
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'make_creator_admin_trigger';

-- Step 5: Verify the function exists
SELECT 
  routine_name, 
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name = 'make_creator_admin';

-- Step 6: Show success message
SELECT 'League creator auto-join trigger setup completed!' as status;
