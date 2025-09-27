import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Database, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const SupabaseConnectionTest: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'error'>('testing');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [tablesExist, setTablesExist] = useState<boolean>(false);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      setConnectionStatus('testing');
      
      // Test basic connection
      const { data, error } = await supabase.from('auth.users').select('count').limit(1);
      
      if (error) {
        // This is expected since we're not authenticated, but it means connection works
        if (error.message.includes('permission denied') || error.message.includes('JWT')) {
          setConnectionStatus('connected');
          checkTables();
        } else {
          throw error;
        }
      } else {
        setConnectionStatus('connected');
        checkTables();
      }
    } catch (error: any) {
      setConnectionStatus('error');
      setErrorMessage(error.message);
    }
  };

  const checkTables = async () => {
    try {
      // Try to query the leagues table with a simple count
      const { data, error } = await supabase.from('leagues').select('id').limit(1);
      
      if (error) {
        if (error.message.includes('relation') || error.message.includes('does not exist')) {
          setTablesExist(false);
        } else if (error.message.includes('permission denied') || error.message.includes('JWT')) {
          // Table exists but RLS is blocking access - this is expected for unauthenticated users
          setTablesExist(true);
        } else {
          throw error;
        }
      } else {
        setTablesExist(true);
      }
    } catch (error: any) {
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        setTablesExist(false);
      } else if (error.message.includes('permission denied') || error.message.includes('JWT')) {
        // Table exists but RLS is blocking access
        setTablesExist(true);
      } else {
        console.error('Error checking tables:', error);
        setTablesExist(false);
      }
    }
  };

  const createTables = async () => {
    try {
      setConnectionStatus('testing');
      
      // Create leagues table
      const { error: leaguesError } = await supabase.rpc('exec_sql', {
        sql: `
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
        `
      });

      if (leaguesError) {
        throw leaguesError;
      }

      // Create league_members table
      const { error: membersError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS league_members (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            team_name VARCHAR(50) NOT NULL,
            is_commissioner BOOLEAN DEFAULT false,
            joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(league_id, user_id)
          );
        `
      });

      if (membersError) {
        throw membersError;
      }

      // Create league_settings table
      const { error: settingsError } = await supabase.rpc('exec_sql', {
        sql: `
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
        `
      });

      if (settingsError) {
        throw settingsError;
      }

      setConnectionStatus('connected');
      setTablesExist(true);
      
    } catch (error: any) {
      setConnectionStatus('error');
      setErrorMessage(error.message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Supabase Connection Test
        </CardTitle>
        <CardDescription>
          Testing connection to your Supabase database
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          {connectionStatus === 'testing' && <Loader2 className="h-4 w-4 animate-spin" />}
          {connectionStatus === 'connected' && <CheckCircle className="h-4 w-4 text-green-500" />}
          {connectionStatus === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
          
          <span className="font-medium">
            {connectionStatus === 'testing' && 'Testing connection...'}
            {connectionStatus === 'connected' && 'Connected to Supabase'}
            {connectionStatus === 'error' && 'Connection failed'}
          </span>
        </div>

        {connectionStatus === 'connected' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {tablesExist ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-orange-500" />
              )}
              <span>
                {tablesExist ? 'Database tables exist' : 'Database tables missing'}
              </span>
            </div>
            
            {!tablesExist && (
              <Alert>
                <AlertDescription>
                  The league tables don't exist yet. You need to create them in your Supabase dashboard.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {connectionStatus === 'error' && (
          <Alert variant="destructive">
            <AlertDescription>
              <strong>Connection Error:</strong> {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button onClick={testConnection} variant="outline" size="sm">
            Test Connection
          </Button>
          {connectionStatus === 'connected' && !tablesExist && (
            <Button onClick={createTables} size="sm">
              Create Tables
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          <strong>Project URL:</strong> https://bgdiccnlhefqtzgygfaz.supabase.co
        </div>
      </CardContent>
    </Card>
  );
};
