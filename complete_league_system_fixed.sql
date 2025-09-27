-- Complete League System Setup for Supabase
-- Run this entire script in your Supabase SQL Editor

-- Step 1: Drop existing tables and policies (if they exist)
DROP POLICY IF EXISTS "Users can view public leagues" ON leagues;
DROP POLICY IF EXISTS "Users can view leagues they're members of" ON leagues;
DROP POLICY IF EXISTS "Users can create leagues" ON leagues;
DROP POLICY IF EXISTS "Users can view members of their leagues" ON league_members;
DROP POLICY IF EXISTS "Users can join leagues" ON league_members;
DROP POLICY IF EXISTS "Users can leave leagues" ON league_members;
DROP POLICY IF EXISTS "Users can view settings of their leagues" ON league_settings;
DROP POLICY IF EXISTS "Users can insert league settings" ON league_settings;

DROP TABLE IF EXISTS league_settings CASCADE;
DROP TABLE IF EXISTS league_members CASCADE;
DROP TABLE IF EXISTS leagues CASCADE;

-- Step 2: Create leagues table
CREATE TABLE leagues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(10) UNIQUE NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  max_players INTEGER DEFAULT 10 CHECK (max_players >= 4 AND max_players <= 16),
  roster_size INTEGER DEFAULT 8 CHECK (roster_size >= 5 AND roster_size <= 12),
  status VARCHAR(20) DEFAULT 'draft_pending' CHECK (status IN ('draft_pending', 'draft_active', 'season_active', 'season_complete')),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create league_members table
CREATE TABLE league_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  team_name VARCHAR(50) NOT NULL,
  is_commissioner BOOLEAN DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(league_id, user_id)
);

-- Step 4: Create league_settings table
CREATE TABLE league_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE UNIQUE,
  risk_weight INTEGER DEFAULT 20 CHECK (risk_weight >= 10 AND risk_weight <= 80),
  growth_weight INTEGER DEFAULT 40 CHECK (growth_weight >= 10 AND risk_weight <= 80),
  value_weight INTEGER DEFAULT 40 CHECK (value_weight >= 10 AND value_weight <= 80),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT weights_sum_to_100 CHECK (risk_weight + growth_weight + value_weight = 100)
);

-- Step 5: Create indexes
CREATE INDEX idx_leagues_code ON leagues(code);
CREATE INDEX idx_leagues_created_by ON leagues(created_by);
CREATE INDEX idx_leagues_is_public ON leagues(is_public);
CREATE INDEX idx_league_members_league_id ON league_members(league_id);
CREATE INDEX idx_league_members_user_id ON league_members(user_id);

-- Step 6: Enable RLS
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_settings ENABLE ROW LEVEL SECURITY;

-- Step 7: Create FIXED RLS policies (NO RECURSION)
-- Allow everyone to see public leagues
CREATE POLICY "public_leagues_select" ON leagues 
FOR SELECT USING (is_public = true);

-- Allow league creators to see their own leagues
CREATE POLICY "league_creators_select" ON leagues 
FOR SELECT USING (created_by = auth.uid());

-- Allow league members to see leagues they're in
CREATE POLICY "league_members_can_view_their_leagues" ON leagues 
FOR SELECT USING (
  id IN (
    SELECT league_id FROM league_members WHERE user_id = auth.uid()
  )
);

-- Allow anyone to create leagues
CREATE POLICY "league_insert" ON leagues 
FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Allow league members to see their league memberships
CREATE POLICY "league_members_select" ON league_members 
FOR SELECT USING (user_id = auth.uid());

-- Allow league members to see other members in their leagues
CREATE POLICY "league_members_can_view_other_members" ON league_members 
FOR SELECT USING (
  league_id IN (
    SELECT league_id FROM league_members WHERE user_id = auth.uid()
  )
);

-- FIXED: Allow ANY authenticated user to join ANY league (not just public ones)
CREATE POLICY "anyone_can_join_any_league" ON league_members 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to leave leagues
CREATE POLICY "league_members_delete" ON league_members 
FOR DELETE USING (auth.uid() = user_id);

-- Allow league members to see settings
CREATE POLICY "league_settings_select" ON league_settings 
FOR SELECT USING (
  league_id IN (
    SELECT id FROM leagues WHERE created_by = auth.uid()
  )
);

-- Allow league creators to insert settings
CREATE POLICY "league_settings_insert" ON league_settings 
FOR INSERT WITH CHECK (
  league_id IN (
    SELECT id FROM leagues WHERE created_by = auth.uid()
  )
);

-- Step 8: Create function to automatically make league creators admins
CREATE OR REPLACE FUNCTION make_creator_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- When a league is created, automatically add the creator as an admin member
  -- Use a default team name that can be updated later
  INSERT INTO league_members (league_id, user_id, team_name, is_commissioner)
  VALUES (NEW.id, NEW.created_by, 'My Team', true);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Create trigger to automatically make creators admins
DROP TRIGGER IF EXISTS make_creator_admin_trigger ON leagues;
CREATE TRIGGER make_creator_admin_trigger
  AFTER INSERT ON leagues
  FOR EACH ROW
  EXECUTE FUNCTION make_creator_admin();

-- Step 10: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Step 11: Test the setup
INSERT INTO leagues (name, code, description, is_public, created_by) 
VALUES ('Test League', 'TEST123', 'A test league', true, auth.uid());

-- Step 12: Verify tables exist
SELECT 'Setup completed successfully!' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'league%';
