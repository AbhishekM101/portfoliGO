import React, { createContext, useContext, useState, useEffect } from 'react';
import { Stock, Team, RosterStats } from '@/types/roster';
import { useAuth } from '@/contexts/AuthContext';
import { useLeague } from '@/contexts/LeagueContext';
import { supabase } from '@/integrations/supabase/client';

interface RosterContextType {
  team: Team | null;
  roster: Stock[];
  availableStocks: Stock[];
  stats: RosterStats | null;
  isLoading: boolean;
  error: string | null;
  addStockToRoster: (stock: Stock) => Promise<void>;
  removeStockFromRoster: (stockId: string) => Promise<void>;
  refetch: () => Promise<void>;
  refreshAvailableStocks: () => Promise<void>;
}

const RosterContext = createContext<RosterContextType | undefined>(undefined);

export const useRoster = () => {
  const context = useContext(RosterContext);
  if (context === undefined) {
    throw new Error('useRoster must be used within a RosterProvider');
  }
  return context;
};

// Mock available stocks data
const mockAvailableStocks: Stock[] = [
  {
    id: "1",
    symbol: "AAPL",
    company: "Apple Inc.",
    sector: "Technology",
    totalScore: 87.5,
    growthScore: 85,
    valueScore: 78,
    riskScore: 65,
    change: 2.3,
    changePercent: 2.7,
    draftPosition: 0,
    price: 175.43,
    marketCap: 2.8e12,
    volume: 45000000,
    lastUpdated: "2024-01-15T10:30:00Z"
  },
  {
    id: "2",
    symbol: "MSFT",
    company: "Microsoft Corporation",
    sector: "Technology",
    totalScore: 91.2,
    growthScore: 88,
    valueScore: 82,
    riskScore: 70,
    change: -1.8,
    changePercent: -1.9,
    draftPosition: 0,
    price: 378.85,
    marketCap: 2.8e12,
    volume: 25000000,
    lastUpdated: "2024-01-15T10:30:00Z"
  },
  {
    id: "3",
    symbol: "GOOGL",
    company: "Alphabet Inc.",
    sector: "Technology",
    totalScore: 78.9,
    growthScore: 82,
    valueScore: 75,
    riskScore: 68,
    change: 0.0,
    changePercent: 0.0,
    draftPosition: 0,
    price: 142.56,
    marketCap: 1.8e12,
    volume: 18000000,
    lastUpdated: "2024-01-15T10:30:00Z"
  },
  {
    id: "4",
    symbol: "TSLA",
    company: "Tesla Inc.",
    sector: "Automotive",
    totalScore: 65.4,
    growthScore: 95,
    valueScore: 45,
    riskScore: 85,
    change: 12.7,
    changePercent: 8.2,
    draftPosition: 0,
    price: 245.67,
    marketCap: 780e9,
    volume: 85000000,
    lastUpdated: "2024-01-15T10:30:00Z"
  },
  {
    id: "5",
    symbol: "NVDA",
    company: "NVIDIA Corporation",
    sector: "Technology",
    totalScore: 93.1,
    growthScore: 95,
    valueScore: 88,
    riskScore: 75,
    change: 5.4,
    changePercent: 1.2,
    draftPosition: 0,
    price: 875.23,
    marketCap: 2.1e12,
    volume: 32000000,
    lastUpdated: "2024-01-15T10:30:00Z"
  },
  {
    id: "6",
    symbol: "AMZN",
    company: "Amazon.com Inc.",
    sector: "Consumer Discretionary",
    totalScore: 89.2,
    growthScore: 85,
    valueScore: 82,
    riskScore: 70,
    change: 1.5,
    changePercent: 0.9,
    draftPosition: 0,
    price: 155.89,
    marketCap: 1.6e12,
    volume: 28000000,
    lastUpdated: "2024-01-15T10:30:00Z"
  },
  {
    id: "7",
    symbol: "META",
    company: "Meta Platforms Inc.",
    sector: "Technology",
    totalScore: 76.8,
    growthScore: 88,
    valueScore: 70,
    riskScore: 65,
    change: -3.2,
    changePercent: -1.4,
    draftPosition: 0,
    price: 365.45,
    marketCap: 950e9,
    volume: 15000000,
    lastUpdated: "2024-01-15T10:30:00Z"
  },
  {
    id: "8",
    symbol: "NFLX",
    company: "Netflix Inc.",
    sector: "Communication Services",
    totalScore: 84.3,
    growthScore: 80,
    valueScore: 78,
    riskScore: 72,
    change: 2.1,
    changePercent: 0.5,
    draftPosition: 0,
    price: 485.67,
    marketCap: 220e9,
    volume: 12000000,
    lastUpdated: "2024-01-15T10:30:00Z"
  }
];

export const RosterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { currentLeague } = useLeague();
  const [team, setTeam] = useState<Team | null>(null);
  const [roster, setRoster] = useState<Stock[]>([]);
  const [availableStocks, setAvailableStocks] = useState<Stock[]>(mockAvailableStocks);
  const [stats, setStats] = useState<RosterStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock team data for development
  const mockTeam: Team = {
    id: "team-1",
    name: "Rohan's Rowdy Team",
    ownerId: user?.id || "user-1",
    leagueId: currentLeague?.id || "league-1",
    totalScore: 0,
    averageScore: 0,
    record: { wins: 0, losses: 0, ties: 0 },
    rank: 1,
    roster: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const fetchRoster = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch available stocks from Supabase
      const { data: stocksData, error: stocksError } = await supabase
        .from('stocks')
        .select('*')
        .order('total_score', { ascending: false });
      
      if (stocksError) {
        throw new Error(`Failed to fetch stocks: ${stocksError.message}`);
      }
      
      // Convert Supabase data to Stock format
      const stocks: Stock[] = (stocksData || []).map((stock: any) => ({
        id: stock.id,
        symbol: stock.symbol,
        company: stock.company,
        sector: stock.sector,
        totalScore: stock.total_score,
        growthScore: stock.growth_score,
        valueScore: stock.value_score,
        riskScore: stock.risk_score,
        change: stock.change,
        changePercent: stock.change_percent,
        draftPosition: stock.draft_position,
        price: stock.price,
        marketCap: stock.market_cap,
        volume: stock.volume,
        lastUpdated: stock.last_updated
      }));
      
      // Filter out stocks that are already in roster
      const rosterSymbols = roster.map(stock => stock.symbol);
      const availableStocksFiltered = stocks.filter(stock => !rosterSymbols.includes(stock.symbol));
      
      setAvailableStocks(availableStocksFiltered);
      setTeam(mockTeam);
      
      // Calculate stats based on current roster
      if (roster.length > 0) {
        const totalScore = roster.reduce((sum, stock) => sum + stock.totalScore, 0);
        const averageScore = totalScore / roster.length;
        
        setStats({
          rosterSize: roster.length,
          totalScore,
          averageScore,
          thisWeekChange: 0, // TODO: Calculate from actual data
          record: { wins: 0, losses: 0, ties: 0 }, // TODO: Calculate from actual data
          rank: 1, // TODO: Calculate from actual data
          leaguePosition: 1 // TODO: Calculate from actual data
        });
      } else {
        setStats(null);
      }
      
    } catch (err) {
      console.error('Error fetching roster data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch roster data');
      // Fallback to mock data if Supabase fails
      setAvailableStocks(mockAvailableStocks);
      setTeam(mockTeam);
    } finally {
      setIsLoading(false);
    }
  };

  const addStockToRoster = async (stock: Stock) => {
    try {
      // Check if roster is full (assuming max 10 stocks)
      const MAX_ROSTER_SIZE = 10;
      if (roster.length >= MAX_ROSTER_SIZE) {
        throw new Error('Roster is full. Remove a stock before adding a new one.');
      }

      // Check if stock is already in roster
      if (roster.some(s => s.id === stock.id)) {
        throw new Error('Stock is already in your roster.');
      }

      // Add stock to roster
      const newStock = {
        ...stock,
        draftPosition: roster.length + 1 // Assign next draft position
      };
      
      const newRoster = [...roster, newStock];
      setRoster(newRoster);

      // Remove stock from available stocks
      setAvailableStocks(prev => prev.filter(s => s.id !== stock.id));

      // Update team with new roster
      const updatedTeam = {
        ...mockTeam,
        roster: newRoster,
        updatedAt: new Date().toISOString()
      };
      setTeam(updatedTeam);

      // Recalculate stats
      const totalScore = newRoster.reduce((sum, stock) => sum + stock.totalScore, 0);
      const averageScore = totalScore / newRoster.length;
      
      setStats({
        rosterSize: newRoster.length,
        totalScore,
        averageScore,
        thisWeekChange: 0,
        record: { wins: 0, losses: 0, ties: 0 },
        rank: 1,
        leaguePosition: 1
      });

      // TODO: Implement actual API call
      // await rosterApi.addStockToRoster(teamId, newStock);
      
    } catch (err) {
      throw err;
    }
  };

  const removeStockFromRoster = async (stockId: string) => {
    try {
      // Find the stock being removed
      const stockToRemove = roster.find(stock => stock.id === stockId);
      if (!stockToRemove) {
        throw new Error('Stock not found in roster.');
      }

      const newRoster = roster.filter(stock => stock.id !== stockId);
      setRoster(newRoster);

      // Add stock back to available stocks (without draft position)
      const stockToAddBack = {
        ...stockToRemove,
        draftPosition: 0
      };
      setAvailableStocks(prev => [...prev, stockToAddBack]);

      // Update team with new roster
      const updatedTeam = {
        ...mockTeam,
        roster: newRoster,
        updatedAt: new Date().toISOString()
      };
      setTeam(updatedTeam);

      // Recalculate stats
      if (newRoster.length > 0) {
        const totalScore = newRoster.reduce((sum, stock) => sum + stock.totalScore, 0);
        const averageScore = totalScore / newRoster.length;
        
        setStats({
          rosterSize: newRoster.length,
          totalScore,
          averageScore,
          thisWeekChange: 0,
          record: { wins: 0, losses: 0, ties: 0 },
          rank: 1,
          leaguePosition: 1
        });
      } else {
        setStats(null);
      }

      // TODO: Implement actual API call
      // await rosterApi.removeStockFromRoster(teamId, stockId);
      
    } catch (err) {
      throw err;
    }
  };

  const refetch = async () => {
    await fetchRoster();
  };

  const refreshAvailableStocks = async () => {
    try {
      // Fetch latest stocks from Supabase
      const { data: stocksData, error: stocksError } = await supabase
        .from('stocks')
        .select('*')
        .order('total_score', { ascending: false });
      
      if (stocksError) {
        throw new Error(`Failed to fetch stocks: ${stocksError.message}`);
      }
      
      // Convert Supabase data to Stock format
      const stocks: Stock[] = (stocksData || []).map((stock: any) => ({
        id: stock.id,
        symbol: stock.symbol,
        company: stock.company,
        sector: stock.sector,
        totalScore: stock.total_score,
        growthScore: stock.growth_score,
        valueScore: stock.value_score,
        riskScore: stock.risk_score,
        change: stock.change,
        changePercent: stock.change_percent,
        draftPosition: stock.draft_position,
        price: stock.price,
        marketCap: stock.market_cap,
        volume: stock.volume,
        lastUpdated: stock.last_updated
      }));
      
      // Filter out stocks that are already in roster
      const rosterSymbols = roster.map(stock => stock.symbol);
      const availableStocksFiltered = stocks.filter(stock => !rosterSymbols.includes(stock.symbol));
      
      setAvailableStocks(availableStocksFiltered);
    } catch (err) {
      console.error('Error refreshing available stocks:', err);
    }
  };

  useEffect(() => {
    fetchRoster();
  }, [user, currentLeague]);

  const value = {
    team,
    roster,
    availableStocks,
    stats,
    isLoading,
    error,
    addStockToRoster,
    removeStockFromRoster,
    refetch,
    refreshAvailableStocks,
  };

  return <RosterContext.Provider value={value}>{children}</RosterContext.Provider>;
};
