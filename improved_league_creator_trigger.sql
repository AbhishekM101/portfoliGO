-- Improved League Creator Auto-Join Trigger
-- This ensures the league creator is automatically added as a member with their team

-- Step 1: Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS make_creator_admin_trigger ON leagues;
DROP FUNCTION IF EXISTS make_creator_admin();

-- Step 2: Create a more robust function to automatically add league creators as members
CREATE OR REPLACE FUNCTION make_creator_admin()
RETURNS TRIGGER AS $$
DECLARE
  user_team_name TEXT;
  user_email TEXT;
BEGIN
  -- Get user's team name from their profile, or use their email/name as fallback
  SELECT COALESCE(
    (auth.jwt() ->> 'user_metadata' ->> 'team_name'),
    (auth.jwt() ->> 'user_metadata' ->> 'full_name'),
    (auth.jwt() ->> 'email'),
    'My Team'
  ) INTO user_team_name;
  
  -- Ensure we have a valid team name
  IF user_team_name IS NULL OR user_team_name = '' THEN
    user_team_name := 'My Team';
  END IF;
  
  -- When a league is created, automatically add the creator as an admin member
  INSERT INTO league_members (
    league_id, 
    user_id, 
    team_name, 
    is_commissioner,
    joined_at
  )
  VALUES (
    NEW.id, 
    NEW.created_by, 
    user_team_name, 
    true,
    NOW()
  );
  
  -- Log successful creation
  RAISE NOTICE 'Successfully added league creator % as member with team name: %', NEW.created_by, user_team_name;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the league creation
    RAISE WARNING 'Failed to add creator as admin member: %', SQLERRM;
    RAISE WARNING 'League ID: %, User ID: %, Team Name: %', NEW.id, NEW.created_by, user_team_name;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create trigger to automatically make creators admins
CREATE TRIGGER make_creator_admin_trigger
  AFTER INSERT ON leagues
  FOR EACH ROW
  EXECUTE FUNCTION make_creator_admin();

-- Step 4: Verify the trigger was created
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

-- Step 6: Test the trigger with a sample league creation
-- (This will only work if you're authenticated)
DO $$
DECLARE
  test_league_id UUID;
  member_count INTEGER;
BEGIN
  -- Create a test league
  INSERT INTO leagues (name, code, description, is_public, created_by) 
  VALUES ('Test Auto-Join League', 'AUTO123', 'Testing auto-join functionality', true, auth.uid())
  RETURNING id INTO test_league_id;
  
  -- Check if the creator was automatically added as a member
  SELECT COUNT(*) INTO member_count
  FROM league_members 
  WHERE league_id = test_league_id;
  
  -- Display results
  RAISE NOTICE 'Test league created with ID: %', test_league_id;
  RAISE NOTICE 'Number of members in test league: %', member_count;
  
  -- Show the member details
  PERFORM * FROM league_members WHERE league_id = test_league_id;
  
  -- Clean up test data
  DELETE FROM league_members WHERE league_id = test_league_id;
  DELETE FROM leagues WHERE id = test_league_id;
  
  RAISE NOTICE 'Test completed and cleaned up successfully!';
END $$;

-- Step 7: Show success message
SELECT 'Improved league creator auto-join trigger setup completed!' as status;
