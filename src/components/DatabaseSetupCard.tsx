import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Database, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const DatabaseSetupCard: React.FC = () => {
  const { toast } = useToast();

  const copyMigrationSQL = () => {
    const sql = `-- Simplified League System Database Schema
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

CREATE POLICY "Users can insert league settings" ON league_settings
  FOR INSERT WITH CHECK (
    league_id IN (
      SELECT id FROM leagues WHERE created_by = auth.uid()
    )
  );`;

    navigator.clipboard.writeText(sql);
    toast({
      title: "SQL Copied!",
      description: "Migration SQL has been copied to your clipboard. Paste it in your Supabase SQL editor.",
    });
  };

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <Database className="h-5 w-5" />
          Database Setup Required
        </CardTitle>
        <CardDescription className="text-orange-700">
          You need to set up the database tables before you can create leagues.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            The league system requires database tables that haven't been created yet.
          </AlertDescription>
        </Alert>
        
        <div className="space-y-3">
          <h4 className="font-semibold text-orange-800">Quick Setup Steps:</h4>
          <ol className="list-decimal list-inside space-y-2 text-sm text-orange-700">
            <li>Go to your <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Supabase Dashboard</a></li>
            <li>Select your project and go to <strong>SQL Editor</strong></li>
            <li>Click <strong>"New Query"</strong></li>
            <li>Click the button below to copy the migration SQL</li>
            <li>Paste and run the SQL in the editor</li>
            <li>Refresh this page and try creating a league</li>
          </ol>
        </div>

        <Button onClick={copyMigrationSQL} className="w-full bg-orange-600 hover:bg-orange-700">
          <Copy className="h-4 w-4 mr-2" />
          Copy Migration SQL
        </Button>
        
        <div className="text-xs text-orange-600">
          <strong>Note:</strong> This will create the leagues, league_members, and league_settings tables with proper security policies.
        </div>
      </CardContent>
    </Card>
  );
};
