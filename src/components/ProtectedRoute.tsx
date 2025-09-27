import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLeague } from '@/contexts/LeagueContext';
import { NoLeagueState } from '@/components/NoLeagueState';
import { AppNavigation } from '@/components/AppNavigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { hasLeagues, currentLeague, loading: leagueLoading } = useLeague();

  // Show loading while checking authentication and league status
  if (authLoading || leagueLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppNavigation />
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If user is not authenticated, redirect to login (handled by AuthContext)
  if (!user) {
    return null;
  }

  // If user is authenticated but not in any leagues, show no league state
  if (!hasLeagues) {
    return <NoLeagueState />;
  }

  // If user has leagues but no active league selected, redirect to league selection
  if (!currentLeague) {
    return <NoLeagueState />;
  }

  // User is authenticated and has an active league selected, show the protected content
  return <>{children}</>;
};