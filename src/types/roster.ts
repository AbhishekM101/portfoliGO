// Roster and stock data types for the fantasy stocks application

export interface Stock {
  id: string;
  symbol: string;
  company: string;
  sector: string;
  totalScore: number;
  growthScore: number;
  valueScore: number;
  riskScore: number;
  change: number;
  changePercent: number;
  draftPosition: number;
  price?: number;
  marketCap?: number;
  volume?: number;
  lastUpdated?: string;
}

export interface Team {
  id: string;
  name: string;
  ownerId: string;
  leagueId: string;
  totalScore: number;
  averageScore: number;
  record: {
    wins: number;
    losses: number;
    ties: number;
  };
  rank: number;
  roster: Stock[];
  createdAt: string;
  updatedAt: string;
}

export interface RosterStats {
  rosterSize: number;
  totalScore: number;
  averageScore: number;
  thisWeekChange: number;
  record: {
    wins: number;
    losses: number;
    ties: number;
  };
  rank: number;
  leaguePosition: number;
}

export interface League {
  id: string;
  name: string;
  description?: string;
  maxTeams: number;
  currentTeams: number;
  draftDate: string;
  seasonStart: string;
  seasonEnd: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  teamName: string;
  createdAt: string;
  updatedAt: string;
}
