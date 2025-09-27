import { Stock, Team, RosterStats } from '@/types/roster';

// API service for roster-related operations
// This will be implemented when backend integration is ready

export class RosterApiService {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  // Team operations
  async getTeam(teamId: string): Promise<Team> {
    // TODO: Implement API call
    throw new Error('API not implemented yet');
  }

  async createTeam(teamData: Partial<Team>): Promise<Team> {
    // TODO: Implement API call
    throw new Error('API not implemented yet');
  }

  async updateTeam(teamId: string, updates: Partial<Team>): Promise<Team> {
    // TODO: Implement API call
    throw new Error('API not implemented yet');
  }

  // Roster operations
  async getRoster(teamId: string): Promise<Stock[]> {
    // TODO: Implement API call
    throw new Error('API not implemented yet');
  }

  async addStockToRoster(teamId: string, stock: Stock): Promise<Stock> {
    // TODO: Implement API call
    throw new Error('API not implemented yet');
  }

  async removeStockFromRoster(teamId: string, stockId: string): Promise<void> {
    // TODO: Implement API call
    throw new Error('API not implemented yet');
  }

  async updateStockInRoster(teamId: string, stockId: string, updates: Partial<Stock>): Promise<Stock> {
    // TODO: Implement API call
    throw new Error('API not implemented yet');
  }

  // Stats operations
  async getRosterStats(teamId: string): Promise<RosterStats> {
    // TODO: Implement API call
    throw new Error('API not implemented yet');
  }

  // Stock data operations
  async getStockData(symbol: string): Promise<Stock> {
    // TODO: Implement API call
    throw new Error('API not implemented yet');
  }

  async searchStocks(query: string): Promise<Stock[]> {
    // TODO: Implement API call
    throw new Error('API not implemented yet');
  }

  async getAvailableStocks(): Promise<Stock[]> {
    // TODO: Implement API call
    throw new Error('API not implemented yet');
  }
}

// Export a singleton instance
export const rosterApi = new RosterApiService();
