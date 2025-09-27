-- Test League Creator Auto-Join Trigger
-- Run this to verify the trigger is working correctly

-- Step 1: Check if trigger exists
SELECT 
  trigger_name, 
  event_manipulation, 
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'make_creator_admin_trigger';

-- Step 2: Check if function exists
SELECT 
  routine_name, 
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name = 'make_creator_admin';

-- Step 3: Test the trigger by creating a test league
-- (This will only work if you're authenticated)
INSERT INTO leagues (name, code, description, is_public, created_by) 
VALUES ('Test League for Trigger', 'TEST123', 'Testing auto-join trigger', true, auth.uid())
RETURNING id, name, created_by;

-- Step 4: Check if the creator was automatically added as a member
SELECT 
  lm.id,
  lm.league_id,
  lm.user_id,
  lm.team_name,
  lm.is_commissioner,
  lm.joined_at,
  l.name as league_name
FROM league_members lm
JOIN leagues l ON lm.league_id = l.id
WHERE l.name = 'Test League for Trigger'
AND lm.user_id = auth.uid();

-- Step 5: Clean up test data (optional)
-- DELETE FROM league_members WHERE league_id IN (SELECT id FROM leagues WHERE name = 'Test League for Trigger');
-- DELETE FROM leagues WHERE name = 'Test League for Trigger';

SELECT 'Trigger test completed! Check the results above.' as status;
