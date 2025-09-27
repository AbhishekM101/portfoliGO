import { supabase } from '@/integrations/supabase/client';
import { Stock } from '@/types/roster';

export interface DraftSession {
  id: string;
  league_id: string;
  status: 'waiting' | 'active' | 'paused' | 'completed';
  current_pick: number;
  current_team_index: number;
  time_per_pick: number;
  time_remaining: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DraftPick {
  id: string;
  draft_session_id: string;
  pick_number: number;
  team_id: string;
  stock_id: string;
  stock_data: Stock;
  picked_at: string;
}

export interface UserRoster {
  id: string;
  league_id: string;
  user_id: string;
  stock_id: string;
  stock_data: Stock;
  draft_position: number;
  added_at: string;
}

export interface TeamMember {
  id: string;
  league_id: string;
  user_id: string;
  team_name: string;
  is_commissioner: boolean;
  joined_at: string;
}

export class DraftService {
  // Start a new draft session
  static async startDraft(leagueId: string): Promise<DraftSession> {
    const { data, error } = await supabase.rpc('start_draft_session', {
      league_uuid: leagueId
    });

    if (error) {
      throw new Error(`Failed to start draft: ${error.message}`);
    }

    return data;
  }

  // Make a draft pick
  static async makeDraftPick(
    sessionId: string, 
    stockSymbol: string, 
    stockData: Stock
  ): Promise<boolean> {
    const { data, error } = await supabase.rpc('make_draft_pick', {
      session_uuid: sessionId,
      stock_symbol: stockSymbol,
      stock_data: stockData
    });

    if (error) {
      throw new Error(`Failed to make draft pick: ${error.message}`);
    }

    return data;
  }

  // Get current draft session for a league
  static async getDraftSession(leagueId: string): Promise<DraftSession | null> {
    const { data, error } = await supabase
      .from('draft_sessions')
      .select('*')
      .eq('league_id', leagueId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      throw new Error(`Failed to get draft session: ${error.message}`);
    }

    return data;
  }

  // Get all draft picks for a session
  static async getDraftPicks(sessionId: string): Promise<DraftPick[]> {
    const { data, error } = await supabase
      .from('draft_picks')
      .select(`
        *,
        team:league_members!draft_picks_team_id_fkey(team_name, user_id)
      `)
      .eq('draft_session_id', sessionId)
      .order('pick_number', { ascending: true });

    if (error) {
      throw new Error(`Failed to get draft picks: ${error.message}`);
    }

    return data || [];
  }

  // Get user's roster for a league
  static async getUserRoster(leagueId: string, userId?: string): Promise<UserRoster[]> {
    const { data: { user } } = await supabase.auth.getUser();
    const targetUserId = userId || user?.id;

    if (!targetUserId) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('user_rosters')
      .select('*')
      .eq('league_id', leagueId)
      .eq('user_id', targetUserId)
      .order('draft_position', { ascending: true });

    if (error) {
      throw new Error(`Failed to get user roster: ${error.message}`);
    }

    return data || [];
  }

  // Get all league members
  static async getLeagueMembers(leagueId: string): Promise<TeamMember[]> {
    const { data, error } = await supabase
      .from('league_members')
      .select('*')
      .eq('league_id', leagueId)
      .order('joined_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to get league members: ${error.message}`);
    }

    return data || [];
  }

  // Subscribe to draft session updates
  static subscribeToDraftSession(
    leagueId: string, 
    onUpdate: (session: DraftSession | null) => void
  ) {
    return supabase
      .channel(`draft-session-${leagueId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'draft_sessions',
          filter: `league_id=eq.${leagueId}`
        },
        async () => {
          const session = await this.getDraftSession(leagueId);
          onUpdate(session);
        }
      )
      .subscribe();
  }

  // Subscribe to draft picks updates
  static subscribeToDraftPicks(
    sessionId: string,
    onUpdate: (picks: DraftPick[]) => void
  ) {
    return supabase
      .channel(`draft-picks-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'draft_picks',
          filter: `draft_session_id=eq.${sessionId}`
        },
        async () => {
          const picks = await this.getDraftPicks(sessionId);
          onUpdate(picks);
        }
      )
      .subscribe();
  }

  // Subscribe to user roster updates
  static subscribeToUserRoster(
    leagueId: string,
    userId: string,
    onUpdate: (roster: UserRoster[]) => void
  ) {
    return supabase
      .channel(`user-roster-${leagueId}-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_rosters',
          filter: `league_id=eq.${leagueId},user_id=eq.${userId}`
        },
        async () => {
          const roster = await this.getUserRoster(leagueId, userId);
          onUpdate(roster);
        }
      )
      .subscribe();
  }

  // Pause/Resume draft session
  static async updateDraftStatus(
    sessionId: string, 
    status: 'active' | 'paused'
  ): Promise<void> {
    const { error } = await supabase
      .from('draft_sessions')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) {
      throw new Error(`Failed to update draft status: ${error.message}`);
    }
  }

  // Reset draft session
  static async resetDraftSession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('draft_sessions')
      .update({
        status: 'waiting',
        current_pick: 1,
        current_team_index: 0,
        time_remaining: 90,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) {
      throw new Error(`Failed to reset draft session: ${error.message}`);
    }
  }
}
