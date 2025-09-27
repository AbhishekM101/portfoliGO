import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LeagueService, type LeagueWithMembers } from '@/services/leagueService';

interface LeagueContextType {
  currentLeague: LeagueWithMembers | null;
  userLeagues: LeagueWithMembers[];
  loading: boolean;
  setCurrentLeague: (league: LeagueWithMembers | null) => void;
  refreshLeagues: () => Promise<void>;
  hasLeagues: boolean;
}

const LeagueContext = createContext<LeagueContextType | undefined>(undefined);

export const useLeague = () => {
  const context = useContext(LeagueContext);
  if (context === undefined) {
    throw new Error('useLeague must be used within a LeagueProvider');
  }
  return context;
};

export const LeagueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentLeague, setCurrentLeague] = useState<LeagueWithMembers | null>(null);
  const [userLeagues, setUserLeagues] = useState<LeagueWithMembers[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUserLeagues = async () => {
    if (!user) {
      setUserLeagues([]);
      setCurrentLeague(null);
      setLoading(false);
      return;
    }

    try {
      const leagues = await LeagueService.getUserLeagues();
      setUserLeagues(leagues);
      
      // If no current league is set, set the first one as default
      if (!currentLeague && leagues.length > 0) {
        setCurrentLeague(leagues[0]);
      }
      
      // If current league is no longer in user's leagues, clear it
      if (currentLeague && !leagues.find(l => l.id === currentLeague.id)) {
        setCurrentLeague(leagues.length > 0 ? leagues[0] : null);
      }
    } catch (error) {
      console.error('Error loading user leagues:', error);
      setUserLeagues([]);
      setCurrentLeague(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshLeagues = async () => {
    setLoading(true);
    await loadUserLeagues();
  };

  useEffect(() => {
    loadUserLeagues();
  }, [user]);

  const hasLeagues = userLeagues.length > 0;

  const value = {
    currentLeague,
    userLeagues,
    loading,
    setCurrentLeague,
    refreshLeagues,
    hasLeagues,
  };

  return <LeagueContext.Provider value={value}>{children}</LeagueContext.Provider>;
};
