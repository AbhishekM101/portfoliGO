-- League System Database Schema
-- Run these SQL commands in your Supabase SQL editor

-- Create leagues table
CREATE TABLE IF NOT EXISTS leagues (
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

-- Create league_members table
CREATE TABLE IF NOT EXISTS league_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  team_name VARCHAR(50) NOT NULL,
  is_commissioner BOOLEAN DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(league_id, user_id)
);

-- Create league_settings table for scoring weights
CREATE TABLE IF NOT EXISTS league_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE UNIQUE,
  risk_weight INTEGER DEFAULT 20 CHECK (risk_weight >= 10 AND risk_weight <= 80),
  growth_weight INTEGER DEFAULT 40 CHECK (growth_weight >= 10 AND growth_weight <= 80),
  value_weight INTEGER DEFAULT 40 CHECK (value_weight >= 10 AND value_weight <= 80),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT weights_sum_to_100 CHECK (risk_weight + growth_weight + value_weight = 100)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leagues_code ON leagues(code);
CREATE INDEX IF NOT EXISTS idx_leagues_created_by ON leagues(created_by);
CREATE INDEX IF NOT EXISTS idx_leagues_is_public ON leagues(is_public);
CREATE INDEX IF NOT EXISTS idx_league_members_league_id ON league_members(league_id);
CREATE INDEX IF NOT EXISTS idx_league_members_user_id ON league_members(user_id);

-- Create function to generate unique league codes
CREATE OR REPLACE FUNCTION generate_league_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a 6-character code with letters and numbers
    code := upper(substring(md5(random()::text) from 1 for 6));
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM leagues WHERE leagues.code = code) INTO exists;
    -- If code doesn't exist, return it
    IF NOT exists THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create function to automatically create league settings when a league is created
CREATE OR REPLACE FUNCTION create_league_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO league_settings (league_id, risk_weight, growth_weight, value_weight)
  VALUES (NEW.id, 20, 40, 40);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create league settings
CREATE TRIGGER trigger_create_league_settings
  AFTER INSERT ON leagues
  FOR EACH ROW
  EXECUTE FUNCTION create_league_settings();

-- Create function to automatically add creator as league member
CREATE OR REPLACE FUNCTION add_creator_as_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO league_members (league_id, user_id, team_name, is_commissioner)
  VALUES (NEW.id, NEW.created_by, 'Commissioner', true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically add creator as member
CREATE TRIGGER trigger_add_creator_as_member
  AFTER INSERT ON leagues
  FOR EACH ROW
  EXECUTE FUNCTION add_creator_as_member();

-- Enable Row Level Security (RLS)
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for leagues
CREATE POLICY "Users can view public leagues" ON leagues
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view leagues they're members of" ON leagues
  FOR SELECT USING (
    id IN (
      SELECT league_id FROM league_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create leagues" ON leagues
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Commissioners can update their leagues" ON leagues
  FOR UPDATE USING (
    created_by = auth.uid() OR
    id IN (
      SELECT league_id FROM league_members 
      WHERE user_id = auth.uid() AND is_commissioner = true
    )
  );

-- Create RLS policies for league_members
CREATE POLICY "Users can view members of their leagues" ON league_members
  FOR SELECT USING (
    league_id IN (
      SELECT league_id FROM league_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join leagues" ON league_members
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    league_id IN (
      SELECT id FROM leagues WHERE is_public = true
    )
  );

CREATE POLICY "Users can leave leagues" ON league_members
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for league_settings
CREATE POLICY "Users can view settings of their leagues" ON league_settings
  FOR SELECT USING (
    league_id IN (
      SELECT league_id FROM league_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Commissioners can update league settings" ON league_settings
  FOR UPDATE USING (
    league_id IN (
      SELECT league_id FROM league_members 
      WHERE user_id = auth.uid() AND is_commissioner = true
    )
  );
