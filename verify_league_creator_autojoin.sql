-- Verify League Creator Auto-Join Functionality
-- Run this to check if the trigger is working correctly

-- Step 1: Check if the trigger exists and is active
SELECT 
  trigger_name, 
  event_manipulation, 
  action_timing,
  action_statement,
  trigger_schema
FROM information_schema.triggers 
WHERE trigger_name = 'make_creator_admin_trigger'
AND trigger_schema = 'public';

-- Step 2: Check if the function exists
SELECT 
  routine_name, 
  routine_type,
  data_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'make_creator_admin'
AND routine_schema = 'public';

-- Step 3: Check existing leagues and their member counts
SELECT 
  l.id,
  l.name,
  l.code,
  l.created_by,
  l.created_at,
  COUNT(lm.id) as member_count,
  STRING_AGG(lm.team_name, ', ') as team_names
FROM leagues l
LEFT JOIN league_members lm ON l.id = lm.league_id
GROUP BY l.id, l.name, l.code, l.created_by, l.created_at
ORDER BY l.created_at DESC
LIMIT 10;

-- Step 4: Check if any leagues exist without their creators as members
SELECT 
  l.id,
  l.name,
  l.code,
  l.created_by,
  'MISSING CREATOR' as issue
FROM leagues l
LEFT JOIN league_members lm ON l.id = lm.league_id AND lm.user_id = l.created_by
WHERE lm.id IS NULL;

-- Step 5: Show recent league members to verify auto-join is working
SELECT 
  lm.id,
  lm.league_id,
  lm.user_id,
  lm.team_name,
  lm.is_commissioner,
  lm.joined_at,
  l.name as league_name,
  l.created_by
FROM league_members lm
JOIN leagues l ON lm.league_id = l.id
WHERE lm.user_id = l.created_by  -- Show only creators
ORDER BY lm.joined_at DESC
LIMIT 10;

-- Step 6: Summary
SELECT 
  'Verification completed! Check the results above.' as status,
  'If you see leagues without their creators as members, the trigger may not be working.' as note;
