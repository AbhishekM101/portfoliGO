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

    try {
      const { data, error } = await supabase
        .from('leagues')
        .select(`
          *,
          members:league_members(*),
          settings:league_settings(*)
        `)
        .eq('members.user_id', user.id);

      if (error) {
        // If tables don't exist, return empty array
        if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
          return [];
        }
        throw error;
      }

      return data.map((league: any) => ({
        ...league,
        member_count: league.members ? league.members.length : 0
      }));
    } catch (error: any) {
      // If tables don't exist, return empty array
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        return [];
      }
      throw error;
    }
  }

  // Get public leagues that user can join
  static async getPublicLeagues(): Promise<League[]> {
    try {
      const { data, error } = await supabase
        .from('leagues')
        .select('*')
        .eq('is_public', true)
        .eq('status', 'draft_pending')
        .order('created_at', { ascending: false });

      if (error) {
        // If tables don't exist, return empty array
        if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
          return [];
        }
        // If RLS is blocking access, return empty array (tables exist but no public leagues visible)
        if (error.message.includes('permission denied') || error.message.includes('JWT')) {
          return [];
        }
        throw error;
      }
      return data;
    } catch (error: any) {
      // If tables don't exist, return empty array
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        return [];
      }
      // If RLS is blocking access, return empty array
      if (error.message.includes('permission denied') || error.message.includes('JWT')) {
        return [];
      }
      throw error;
    }
  }

  // Get league by code
  static async getLeagueByCode(code: string): Promise<LeagueWithMembers | null> {
    try {
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
        // If tables don't exist, return null
        if (error.message.includes('relation') || error.message.includes('does not exist')) {
          return null;
        }
        throw error;
      }

      return {
        ...(data as any),
        member_count: (data as any).members ? (data as any).members.length : 0
      };
    } catch (error: any) {
      // If tables don't exist, return null
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        return null;
      }
      throw error;
    }
  }

  // Create a new league
  static async createLeague(leagueData: CreateLeagueData): Promise<LeagueWithMembers> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    try {
      // Generate unique league code
      const code = await this.generateUniqueLeagueCode();

      const leagueInsert: LeagueInsert = {
        name: leagueData.name,
        code: code,
        description: leagueData.description,
        is_public: leagueData.is_public,
        max_players: leagueData.max_players,
        roster_size: leagueData.roster_size,
        created_by: user.id
      };

      const { data: league, error: leagueError } = await supabase
        .from('leagues')
        .insert(leagueInsert as any)
        .select()
        .single();

      if (leagueError) {
        if (leagueError.message.includes('relation') || leagueError.message.includes('does not exist')) {
          throw new Error('Database tables not found. Please run the SQL migration in your Supabase dashboard first.');
        }
        throw leagueError;
      }

      // Create league settings
      const { error: settingsError } = await supabase
        .from('league_settings')
        .insert({
          league_id: (league as any).id,
          risk_weight: leagueData.risk_weight,
          growth_weight: leagueData.growth_weight,
          value_weight: leagueData.value_weight
        } as any);

      if (settingsError) {
        if (settingsError.message.includes('relation') || settingsError.message.includes('does not exist')) {
          throw new Error('Database tables not found. Please run the SQL migration in your Supabase dashboard first.');
        }
        throw settingsError;
      }

      // Add creator as admin member
      const { error: memberError } = await supabase
        .from('league_members')
        .insert({
          league_id: (league as any).id,
          user_id: user.id,
          team_name: 'My Team',
          is_commissioner: true
        } as any);

      if (memberError) {
        console.error('Error adding creator as admin:', memberError);
      }

      // Get the complete league data
      const completeLeague = await this.getLeagueByCode((league as any).code);
      if (!completeLeague) throw new Error('Failed to retrieve created league');

      return completeLeague;
    } catch (error: any) {
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        throw new Error('Database tables not found. Please run the SQL migration in your Supabase dashboard first.');
      }
      throw error;
    }
  }

  // Generate a unique league code
  private static async generateUniqueLeagueCode(): Promise<string> {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code: string;
    let exists = true;

    // Try up to 10 times to generate a unique code
    for (let attempts = 0; attempts < 10; attempts++) {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }

      // Check if code already exists
      const { data } = await supabase
        .from('leagues')
        .select('code')
        .eq('code', code)
        .single();

      if (!data) {
        exists = false;
        break;
      }
    }

    if (exists) {
      throw new Error('Unable to generate unique league code. Please try again.');
    }

    return code!;
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
      .insert(memberInsert as any)
      .select()
      .single();

    if (error) {
      console.error('Error joining league:', error);
      throw error;
    }
    
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
    settings: { 
      name?: string;
      description?: string;
      is_public?: boolean;
      max_players?: number;
      roster_size?: number;
      risk_weight?: number; 
      growth_weight?: number; 
      value_weight?: number;
    }
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

    if (!member || !(member as any).is_commissioner) {
      throw new Error('Only commissioners can update league settings');
    }

    // Update league basic info
    const leagueUpdate: any = {};
    if (settings.name !== undefined) leagueUpdate.name = settings.name;
    if (settings.description !== undefined) leagueUpdate.description = settings.description;
    if (settings.is_public !== undefined) leagueUpdate.is_public = settings.is_public;
    if (settings.max_players !== undefined) leagueUpdate.max_players = settings.max_players;
    if (settings.roster_size !== undefined) leagueUpdate.roster_size = settings.roster_size;

    if (Object.keys(leagueUpdate).length > 0) {
      const { error: leagueError } = await (supabase as any)
        .from('leagues')
        .update(leagueUpdate)
        .eq('id', leagueId);

      if (leagueError) {
        console.error('League update error:', leagueError);
        throw leagueError;
      }
    }

    // Update league settings - create if doesn't exist
    const settingsUpdate: any = {};
    if (settings.risk_weight !== undefined) settingsUpdate.risk_weight = settings.risk_weight;
    if (settings.growth_weight !== undefined) settingsUpdate.growth_weight = settings.growth_weight;
    if (settings.value_weight !== undefined) settingsUpdate.value_weight = settings.value_weight;

    if (Object.keys(settingsUpdate).length > 0) {
      // First try to update existing settings
      const { error: settingsError } = await (supabase as any)
        .from('league_settings')
        .update(settingsUpdate)
        .eq('league_id', leagueId);

      // If no settings exist, create them
      if (settingsError && settingsError.code === 'PGRST116') {
        const { error: insertError } = await (supabase as any)
          .from('league_settings')
          .insert({
            league_id: leagueId,
            risk_weight: settings.risk_weight || 0.3,
            growth_weight: settings.growth_weight || 0.4,
            value_weight: settings.value_weight || 0.3
          });

        if (insertError) {
          console.error('Settings insert error:', insertError);
          throw insertError;
        }
      } else if (settingsError) {
        console.error('Settings update error:', settingsError);
        throw settingsError;
      }
    }
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
