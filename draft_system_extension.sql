-- Draft System Extension for Multi-User Drafting
-- Run this in your Supabase SQL Editor after the main league system

-- Step 1: Create draft_sessions table to track active drafts
CREATE TABLE IF NOT EXISTS draft_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'paused', 'completed')),
  current_pick INTEGER DEFAULT 1,
  current_team_index INTEGER DEFAULT 0,
  time_per_pick INTEGER DEFAULT 90, -- seconds
  time_remaining INTEGER DEFAULT 90,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create draft_picks table to track all draft selections
CREATE TABLE IF NOT EXISTS draft_picks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  draft_session_id UUID REFERENCES draft_sessions(id) ON DELETE CASCADE,
  pick_number INTEGER NOT NULL,
  team_id UUID REFERENCES league_members(id) ON DELETE CASCADE,
  stock_id VARCHAR(50) NOT NULL, -- Stock symbol or ID
  stock_data JSONB NOT NULL, -- Full stock information
  picked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(draft_session_id, pick_number)
);

-- Step 3: Create user_rosters table to track each user's drafted stocks
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

-- Step 4: Create indexes for performance
CREATE INDEX idx_draft_sessions_league_id ON draft_sessions(league_id);
CREATE INDEX idx_draft_sessions_status ON draft_sessions(status);
CREATE INDEX idx_draft_picks_session_id ON draft_picks(draft_session_id);
CREATE INDEX idx_draft_picks_team_id ON draft_picks(team_id);
CREATE INDEX idx_user_rosters_league_user ON user_rosters(league_id, user_id);
CREATE INDEX idx_user_rosters_league_stock ON user_rosters(league_id, stock_id);

-- Step 5: Enable RLS on new tables
ALTER TABLE draft_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE draft_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rosters ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies for draft_sessions
CREATE POLICY "league_members_can_view_draft_sessions" ON draft_sessions
FOR SELECT USING (
  league_id IN (
    SELECT league_id FROM league_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "league_commissioners_can_manage_draft_sessions" ON draft_sessions
FOR ALL USING (
  league_id IN (
    SELECT l.id FROM leagues l
    JOIN league_members lm ON l.id = lm.league_id
    WHERE lm.user_id = auth.uid() AND lm.is_commissioner = true
  )
);

-- Step 7: Create RLS policies for draft_picks
CREATE POLICY "league_members_can_view_draft_picks" ON draft_picks
FOR SELECT USING (
  draft_session_id IN (
    SELECT id FROM draft_sessions 
    WHERE league_id IN (
      SELECT league_id FROM league_members WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "league_members_can_insert_draft_picks" ON draft_picks
FOR INSERT WITH CHECK (
  draft_session_id IN (
    SELECT id FROM draft_sessions 
    WHERE league_id IN (
      SELECT league_id FROM league_members WHERE user_id = auth.uid()
    )
  )
);

-- Step 8: Create RLS policies for user_rosters
CREATE POLICY "users_can_view_own_roster" ON user_rosters
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "users_can_manage_own_roster" ON user_rosters
FOR ALL USING (user_id = auth.uid());

CREATE POLICY "league_members_can_view_other_rosters" ON user_rosters
FOR SELECT USING (
  league_id IN (
    SELECT league_id FROM league_members WHERE user_id = auth.uid()
  )
);

-- Step 9: Create function to start a draft session
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

-- Step 10: Create function to make a draft pick
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

-- Step 11: Grant permissions
GRANT ALL ON draft_sessions TO authenticated;
GRANT ALL ON draft_picks TO authenticated;
GRANT ALL ON user_rosters TO authenticated;
GRANT EXECUTE ON FUNCTION start_draft_session(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION make_draft_pick(UUID, VARCHAR, JSONB) TO authenticated;

-- Step 12: Test the setup
SELECT 'Draft system extension completed successfully!' as status;
