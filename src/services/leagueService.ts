import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type League = Database['public']['Tables']['leagues']['Row'];
type LeagueInsert = Database['public']['Tables']['leagues']['Insert'];
type LeagueMember = Database['public']['Tables']['league_members']['Row'];
type LeagueMemberInsert = Database['public']['Tables']['league_members']['Insert'];
type LeagueSettings = Database['public']['Tables']['league_settings']['Row'];

export interface LeagueWithMembers extends League {
  members: LeagueMember[];
  settings: LeagueSettings;
  member_count: number;
}

export interface CreateLeagueData {
  name: string;
  description?: string;
  is_public: boolean;
  max_players: number;
  roster_size: number;
  risk_weight: number;
  growth_weight: number;
  value_weight: number;
}

export interface JoinLeagueData {
  code: string;
  team_name: string;
}

export class LeagueService {
  // Get all leagues the user is a member of
  static async getUserLeagues(): Promise<LeagueWithMembers[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('leagues')
      .select(`
        *,
        members:league_members(*),
        settings:league_settings(*)
      `)
      .eq('members.user_id', user.id);

    if (error) throw error;

    return data.map(league => ({
      ...league,
      member_count: league.members.length
    }));
  }

  // Get public leagues that user can join
  static async getPublicLeagues(): Promise<League[]> {
    const { data, error } = await supabase
      .from('leagues')
      .select('*')
      .eq('is_public', true)
      .eq('status', 'draft_pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Get league by code
  static async getLeagueByCode(code: string): Promise<LeagueWithMembers | null> {
    const { data, error } = await supabase
      .from('leagues')
      .select(`
        *,
        members:league_members(*),
        settings:league_settings(*)
      `)
      .eq('code', code.toUpperCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      throw error;
    }

    return {
      ...data,
      member_count: data.members.length
    };
  }

  // Create a new league
  static async createLeague(leagueData: CreateLeagueData): Promise<LeagueWithMembers> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Generate unique league code
    const { data: codeData, error: codeError } = await supabase
      .rpc('generate_league_code');

    if (codeError) throw codeError;

    const leagueInsert: LeagueInsert = {
      name: leagueData.name,
      code: codeData,
      description: leagueData.description,
      is_public: leagueData.is_public,
      max_players: leagueData.max_players,
      roster_size: leagueData.roster_size,
      created_by: user.id
    };

    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .insert(leagueInsert)
      .select()
      .single();

    if (leagueError) throw leagueError;

    // Update league settings
    const { error: settingsError } = await supabase
      .from('league_settings')
      .update({
        risk_weight: leagueData.risk_weight,
        growth_weight: leagueData.growth_weight,
        value_weight: leagueData.value_weight
      })
      .eq('league_id', league.id);

    if (settingsError) throw settingsError;

    // Get the complete league data
    const completeLeague = await this.getLeagueByCode(league.code);
    if (!completeLeague) throw new Error('Failed to retrieve created league');

    return completeLeague;
  }

  // Join a league by code
  static async joinLeague(joinData: JoinLeagueData): Promise<LeagueMember> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get league by code
    const league = await this.getLeagueByCode(joinData.code);
    if (!league) throw new Error('League not found');

    // Check if league is full
    if (league.member_count >= league.max_players) {
      throw new Error('League is full');
    }

    // Check if user is already a member
    const isAlreadyMember = league.members.some(member => member.user_id === user.id);
    if (isAlreadyMember) {
      throw new Error('You are already a member of this league');
    }

    // Add user to league
    const memberInsert: LeagueMemberInsert = {
      league_id: league.id,
      user_id: user.id,
      team_name: joinData.team_name
    };

    const { data: member, error } = await supabase
      .from('league_members')
      .insert(memberInsert)
      .select()
      .single();

    if (error) throw error;
    return member;
  }

  // Leave a league
  static async leaveLeague(leagueId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('league_members')
      .delete()
      .eq('league_id', leagueId)
      .eq('user_id', user.id);

    if (error) throw error;
  }

  // Update league settings (commissioner only)
  static async updateLeagueSettings(
    leagueId: string, 
    settings: { risk_weight: number; growth_weight: number; value_weight: number }
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Check if user is commissioner
    const { data: member } = await supabase
      .from('league_members')
      .select('is_commissioner')
      .eq('league_id', leagueId)
      .eq('user_id', user.id)
      .single();

    if (!member?.is_commissioner) {
      throw new Error('Only commissioners can update league settings');
    }

    const { error } = await supabase
      .from('league_settings')
      .update(settings)
      .eq('league_id', leagueId);

    if (error) throw error;
  }

  // Get league standings (placeholder for future implementation)
  static async getLeagueStandings(leagueId: string): Promise<any[]> {
    // This would be implemented when we add the scoring system
    // For now, return mock data
    return [
      { rank: 1, team: "Bull Market Bulls", owner: "You", record: "0-0-0", points: 0.0 },
      { rank: 2, team: "Bear Slayers", owner: "Alex Chen", record: "0-0-0", points: 0.0 },
      { rank: 3, team: "Diamond Hands", owner: "Sarah Kim", record: "0-0-0", points: 0.0 },
      { rank: 4, team: "Moon Shooters", owner: "Mike Johnson", record: "0-0-0", points: 0.0 },
    ];
  }
}
