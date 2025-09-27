-- Quick Draft System Setup
-- Run this in your Supabase SQL Editor to fix the missing tables error

-- Step 1: Create draft_sessions table
CREATE TABLE IF NOT EXISTS draft_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'paused', 'completed')),
  current_pick INTEGER DEFAULT 1,
  current_team_index INTEGER DEFAULT 0,
  time_per_pick INTEGER DEFAULT 90,
  time_remaining INTEGER DEFAULT 90,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create draft_picks table
CREATE TABLE IF NOT EXISTS draft_picks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  draft_session_id UUID REFERENCES draft_sessions(id) ON DELETE CASCADE,
  pick_number INTEGER NOT NULL,
  team_id UUID REFERENCES league_members(id) ON DELETE CASCADE,
  stock_id VARCHAR(50) NOT NULL,
  stock_data JSONB NOT NULL,
  picked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(draft_session_id, pick_number)
);

-- Step 3: Create user_rosters table
CREATE TABLE IF NOT EXISTS user_rosters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stock_id VARCHAR(50) NOT NULL,
  stock_data JSONB NOT NULL,
  draft_position INTEGER NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(league_id, user_id, stock_id)
);

-- Step 4: Enable RLS
ALTER TABLE draft_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE draft_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rosters ENABLE ROW LEVEL SECURITY;

-- Step 5: Create basic RLS policies
CREATE POLICY "league_members_can_view_draft_sessions" ON draft_sessions
FOR SELECT USING (
  league_id IN (
    SELECT league_id FROM league_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "league_members_can_view_draft_picks" ON draft_picks
FOR SELECT USING (
  draft_session_id IN (
    SELECT id FROM draft_sessions 
    WHERE league_id IN (
      SELECT league_id FROM league_members WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "users_can_view_own_roster" ON user_rosters
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "users_can_manage_own_roster" ON user_rosters
FOR ALL USING (user_id = auth.uid());

-- Step 6: Grant permissions
GRANT ALL ON draft_sessions TO authenticated;
GRANT ALL ON draft_picks TO authenticated;
GRANT ALL ON user_rosters TO authenticated;

-- Step 7: Create function to start a draft session
CREATE OR REPLACE FUNCTION start_draft_session(league_uuid UUID)
RETURNS UUID AS $$
DECLARE
  session_id UUID;
  member_count INTEGER;
BEGIN
  -- Check if user is a member of the league
  IF NOT EXISTS (
    SELECT 1 FROM league_members 
    WHERE league_id = league_uuid AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'User is not a member of this league';
  END IF;
  
  -- Check if user is commissioner
  IF NOT EXISTS (
    SELECT 1 FROM league_members 
    WHERE league_id = league_uuid AND user_id = auth.uid() AND is_commissioner = true
  ) THEN
    RAISE EXCEPTION 'Only league commissioners can start drafts';
  END IF;
  
  -- Get member count
  SELECT COUNT(*) INTO member_count FROM league_members WHERE league_id = league_uuid;
  
  -- Check if league has enough members
  IF member_count < 2 THEN
    RAISE EXCEPTION 'League must have at least 2 members to start a draft';
  END IF;
  
  -- Create new draft session
  INSERT INTO draft_sessions (league_id, status, current_pick, current_team_index)
  VALUES (league_uuid, 'active', 1, 0)
  RETURNING id INTO session_id;
  
  -- Update league status
  UPDATE leagues SET status = 'draft_active' WHERE id = league_uuid;
  
  RETURN session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Create function to make a draft pick
CREATE OR REPLACE FUNCTION make_draft_pick(
  session_uuid UUID,
  stock_symbol VARCHAR(50),
  stock_data JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
  current_session RECORD;
  team_member RECORD;
  next_team_index INTEGER;
  total_teams INTEGER;
BEGIN
  -- Get current draft session
  SELECT ds.*, lm.id as current_team_id, lm.team_name
  INTO current_session
  FROM draft_sessions ds
  JOIN league_members lm ON ds.league_id = lm.league_id
  WHERE ds.id = session_uuid
  AND lm.user_id = auth.uid()
  AND ds.status = 'active';
  
  IF current_session IS NULL THEN
    RAISE EXCEPTION 'Invalid draft session or not your turn';
  END IF;
  
  -- Check if it's actually this user's turn
  SELECT * INTO team_member
  FROM league_members 
  WHERE league_id = current_session.league_id
  ORDER BY joined_at
  LIMIT 1 OFFSET current_session.current_team_index;
  
  IF team_member.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Not your turn to pick';
  END IF;
  
  -- Check if stock is already drafted
  IF EXISTS (
    SELECT 1 FROM draft_picks 
    WHERE draft_session_id = session_uuid 
    AND stock_data->>'symbol' = stock_symbol
  ) THEN
    RAISE EXCEPTION 'Stock already drafted';
  END IF;
  
  -- Check if user already has this stock
  IF EXISTS (
    SELECT 1 FROM user_rosters 
    WHERE league_id = current_session.league_id 
    AND user_id = auth.uid() 
    AND stock_data->>'symbol' = stock_symbol
  ) THEN
    RAISE EXCEPTION 'You already have this stock';
  END IF;
  
  -- Get total teams
  SELECT COUNT(*) INTO total_teams FROM league_members WHERE league_id = current_session.league_id;
  
  -- Calculate next team index
  next_team_index := (current_session.current_team_index + 1) % total_teams;
  
  -- Insert the draft pick
  INSERT INTO draft_picks (draft_session_id, pick_number, team_id, stock_id, stock_data)
  VALUES (session_uuid, current_session.current_pick, current_session.current_team_id, stock_symbol, stock_data);
  
  -- Add to user's roster
  INSERT INTO user_rosters (league_id, user_id, stock_id, stock_data, draft_position)
  VALUES (current_session.league_id, auth.uid(), stock_symbol, stock_data, current_session.current_pick);
  
  -- Update draft session
  UPDATE draft_sessions 
  SET 
    current_pick = current_pick + 1,
    current_team_index = next_team_index,
    time_remaining = time_per_pick,
    updated_at = NOW()
  WHERE id = session_uuid;
  
  -- Check if draft is complete (assuming 5 rounds)
  IF current_session.current_pick >= (total_teams * 5) THEN
    UPDATE draft_sessions 
    SET status = 'completed', completed_at = NOW()
    WHERE id = session_uuid;
    
    UPDATE leagues SET status = 'season_active' WHERE id = current_session.league_id;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Grant function permissions
GRANT EXECUTE ON FUNCTION start_draft_session(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION make_draft_pick(UUID, VARCHAR, JSONB) TO authenticated;

-- Step 10: Test the setup
SELECT 'Draft system setup completed successfully!' as status;
