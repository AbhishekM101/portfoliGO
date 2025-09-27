import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Database, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const DatabaseConnectionDebugger: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'error'>('testing');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [tablesStatus, setTablesStatus] = useState<{[key: string]: boolean}>({});
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    setConnectionStatus('testing');
    setErrorMessage('');
    setTablesStatus({});
    setDebugInfo('');

    try {
      // Test 1: Basic Supabase connection
      console.log('Testing Supabase connection...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.log('Auth error (expected if not logged in):', authError);
      }
      
      setDebugInfo(`Auth test completed. User: ${user ? 'Logged in' : 'Not logged in'}`);

      // Test 2: Try to access leagues table
      console.log('Testing leagues table...');
      const { data: leaguesData, error: leaguesError } = await supabase
        .from('leagues')
        .select('id')
        .limit(1);

      if (leaguesError) {
        console.log('Leagues table error:', leaguesError);
        if (leaguesError.message.includes('relation') || leaguesError.message.includes('does not exist')) {
          setTablesStatus(prev => ({ ...prev, leagues: false }));
          setDebugInfo(prev => prev + ' | Leagues: Table does not exist');
          throw new Error('Leagues table does not exist');
        } else {
          // Any other error (including RLS) means table exists
          setTablesStatus(prev => ({ ...prev, leagues: true }));
          setDebugInfo(prev => prev + ' | Leagues: Table exists, access restricted by RLS');
        }
      } else {
        setTablesStatus(prev => ({ ...prev, leagues: true }));
        setDebugInfo(prev => prev + ' | Leagues: Accessible');
      }

      // Test 3: Try to access league_members table
      console.log('Testing league_members table...');
      const { data: membersData, error: membersError } = await supabase
        .from('league_members')
        .select('id')
        .limit(1);

      if (membersError) {
        console.log('League_members table error:', membersError);
        if (membersError.message.includes('relation') || membersError.message.includes('does not exist')) {
          setTablesStatus(prev => ({ ...prev, league_members: false }));
          setDebugInfo(prev => prev + ' | League_members: Table does not exist');
        } else {
          // Any other error means table exists
          setTablesStatus(prev => ({ ...prev, league_members: true }));
          setDebugInfo(prev => prev + ' | League_members: Table exists, access restricted by RLS');
        }
      } else {
        setTablesStatus(prev => ({ ...prev, league_members: true }));
        setDebugInfo(prev => prev + ' | League_members: Accessible');
      }

      // Test 4: Try to access league_settings table
      console.log('Testing league_settings table...');
      const { data: settingsData, error: settingsError } = await supabase
        .from('league_settings')
        .select('id')
        .limit(1);

      if (settingsError) {
        console.log('League_settings table error:', settingsError);
        if (settingsError.message.includes('relation') || settingsError.message.includes('does not exist')) {
          setTablesStatus(prev => ({ ...prev, league_settings: false }));
          setDebugInfo(prev => prev + ' | League_settings: Table does not exist');
        } else {
          // Any other error means table exists
          setTablesStatus(prev => ({ ...prev, league_settings: true }));
          setDebugInfo(prev => prev + ' | League_settings: Table exists, access restricted by RLS');
        }
      } else {
        setTablesStatus(prev => ({ ...prev, league_settings: true }));
        setDebugInfo(prev => prev + ' | League_settings: Accessible');
      }

      setConnectionStatus('connected');

    } catch (error: any) {
      console.error('Connection test failed:', error);
      setConnectionStatus('error');
      setErrorMessage(error.message);
    }
  };

  const allTablesExist = Object.values(tablesStatus).every(exists => exists);
  const anyTablesExist = Object.values(tablesStatus).some(exists => exists);

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Connection Debugger
        </CardTitle>
        <CardDescription>
          Testing connection to your Supabase database
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center gap-2">
          {connectionStatus === 'testing' && <Loader2 className="h-4 w-4 animate-spin" />}
          {connectionStatus === 'connected' && <CheckCircle className="h-4 w-4 text-green-500" />}
          {connectionStatus === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
          
          <span className="font-medium">
            {connectionStatus === 'testing' && 'Testing connection...'}
            {connectionStatus === 'connected' && 'Connection successful'}
            {connectionStatus === 'error' && 'Connection failed'}
          </span>
        </div>

        {/* Debug Info */}
        {debugInfo && (
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm font-mono">{debugInfo}</p>
          </div>
        )}

        {/* Error Message */}
        {connectionStatus === 'error' && (
          <Alert variant="destructive">
            <AlertDescription>
              <strong>Error:</strong> {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Tables Status */}
        {connectionStatus === 'connected' && (
          <div className="space-y-2">
            <h4 className="font-medium">Table Status:</h4>
            {Object.entries(tablesStatus).map(([table, exists]) => (
              <div key={table} className="flex items-center gap-2">
                {exists ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="font-mono text-sm">{table}</span>
                <span className="text-sm text-muted-foreground">
                  {exists ? 'exists' : 'missing'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {connectionStatus === 'connected' && (
          <Alert>
            <AlertDescription>
              <strong>Summary:</strong> {
                allTablesExist 
                  ? 'All tables exist and are accessible' 
                  : anyTablesExist 
                    ? 'Some tables exist, some may be missing' 
                    : 'No tables found - you need to run the SQL migration'
              }
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={testConnection} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Test Again
          </Button>
        </div>

        {/* Supabase Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div><strong>Project URL:</strong> https://bgdiccnlhefqtzgygfaz.supabase.co</div>
          <div><strong>Key:</strong> eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</div>
        </div>
      </CardContent>
    </Card>
  );
};