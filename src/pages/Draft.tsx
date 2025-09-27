import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowLeft, 
  Search, 
  Clock, 
  Users, 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  RotateCcw
} from "lucide-react";
import { useLeague } from "@/contexts/LeagueContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRoster } from "@/contexts/RosterContext";
import { Stock } from "@/types/roster";
import { useToast } from "@/hooks/use-toast";
import { DraftService, DraftSession, DraftPick, UserRoster, TeamMember } from "@/services/draftService";

// Mock teams for draft order

// Mock teams for draft order - in a real implementation, this would come from the league data
const getMockTeams = (userTeamName: string) => [
  { id: "1", name: userTeamName, owner: "You", picks: [] },
  { id: "2", name: "Growth Gurus", owner: "Jane Smith", picks: [] },
  { id: "3", name: "Value Vault", owner: "Mike Johnson", picks: [] },
  { id: "4", name: "Risk Raiders", owner: "Sarah Wilson", picks: [] }
];

const Draft = () => {
  const { leagueId } = useParams();
  const navigate = useNavigate();
  const { userLeagues } = useLeague();
  const { user } = useAuth();
  const { availableStocks } = useRoster();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [draftSession, setDraftSession] = useState<DraftSession | null>(null);
  const [draftPicks, setDraftPicks] = useState<DraftPick[]>([]);
  const [userRoster, setUserRoster] = useState<UserRoster[]>([]);
  const [leagueMembers, setLeagueMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Find the current league
  const currentLeague = userLeagues.find(league => league.id === leagueId);
  
  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      if (!leagueId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Load draft session
        const session = await DraftService.getDraftSession(leagueId);
        setDraftSession(session);
        
        // Load league members
        const members = await DraftService.getLeagueMembers(leagueId);
        setLeagueMembers(members);
        
        // Load user roster
        const roster = await DraftService.getUserRoster(leagueId);
        setUserRoster(roster);
        
        // Load draft picks if session exists
        if (session) {
          const picks = await DraftService.getDraftPicks(session.id);
          setDraftPicks(picks);
        }
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load draft data');
        toast({
          title: "Error",
          description: "Failed to load draft data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadInitialData();
  }, [leagueId, toast]);
  
  // Set up real-time subscriptions
  useEffect(() => {
    if (!leagueId || !user?.id) return;
    
    const subscriptions: any[] = [];
    
    // Subscribe to draft session updates
    const sessionSubscription = DraftService.subscribeToDraftSession(
      leagueId,
      (session) => {
        setDraftSession(session);
        if (session) {
          // Load picks when session updates
          DraftService.getDraftPicks(session.id).then(setDraftPicks);
        }
      }
    );
    subscriptions.push(sessionSubscription);
    
    // Subscribe to user roster updates
    const rosterSubscription = DraftService.subscribeToUserRoster(
      leagueId,
      user.id,
      setUserRoster
    );
    subscriptions.push(rosterSubscription);
    
    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, [leagueId, user?.id]);
  
  if (!currentLeague) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto p-6">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">League Not Found</h1>
            <p className="text-muted-foreground mb-4">
              The league you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button onClick={() => navigate('/home')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return "text-green-500";
    if (change < 0) return "text-red-500";
    return "text-gray-500";
  };

  // Get current user's team info
  const currentUserTeam = leagueMembers.find(member => member.user_id === user?.id);
  const isCurrentUserTurn = draftSession && 
    leagueMembers[draftSession.current_team_index]?.user_id === user?.id;
  
  // Filter available stocks
  const filteredStocks = availableStocks.filter(stock => {
    const matchesSearch = stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         stock.company.toLowerCase().includes(searchQuery.toLowerCase());
    const notDrafted = !draftPicks.some(pick => pick.stock_data.symbol === stock.symbol);
    const notInRoster = !userRoster.some(rosterStock => rosterStock.stock_data.symbol === stock.symbol);
    return matchesSearch && notDrafted && notInRoster;
  });

  const handleDraftStock = async (stock: Stock) => {
    if (!draftSession) {
      toast({
        title: "No Active Draft",
        description: "There is no active draft session.",
        variant: "destructive",
      });
      return;
    }
    
    if (!isCurrentUserTurn) {
      toast({
        title: "Not Your Turn",
        description: "It's not your turn to pick.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await DraftService.makeDraftPick(draftSession.id, stock.symbol, stock);
      
      toast({
        title: "Stock Drafted!",
        description: `${stock.symbol} has been added to your roster.`,
      });
    } catch (error) {
      toast({
        title: "Draft Error",
        description: error instanceof Error ? error.message : "Failed to draft stock. Please try again.",
        variant: "destructive",
      });
    }
  };

  const startDraft = async () => {
    if (!leagueId) return;
    
    try {
      await DraftService.startDraft(leagueId);
      toast({
        title: "Draft Started!",
        description: "The draft has been started successfully.",
      });
    } catch (error) {
      toast({
        title: "Error Starting Draft",
        description: error instanceof Error ? error.message : "Failed to start draft.",
        variant: "destructive",
      });
    }
  };

  const pauseDraft = async () => {
    if (!draftSession) return;
    
    try {
      await DraftService.updateDraftStatus(draftSession.id, 'paused');
      toast({
        title: "Draft Paused",
        description: "The draft has been paused.",
      });
    } catch (error) {
      toast({
        title: "Error Pausing Draft",
        description: error instanceof Error ? error.message : "Failed to pause draft.",
        variant: "destructive",
      });
    }
  };

  const resumeDraft = async () => {
    if (!draftSession) return;
    
    try {
      await DraftService.updateDraftStatus(draftSession.id, 'active');
      toast({
        title: "Draft Resumed",
        description: "The draft has been resumed.",
      });
    } catch (error) {
      toast({
        title: "Error Resuming Draft",
        description: error instanceof Error ? error.message : "Failed to resume draft.",
        variant: "destructive",
      });
    }
  };

  const resetDraft = async () => {
    if (!draftSession) return;
    
    try {
      await DraftService.resetDraftSession(draftSession.id);
      toast({
        title: "Draft Reset",
        description: "The draft has been reset.",
      });
    } catch (error) {
      toast({
        title: "Error Resetting Draft",
        description: error instanceof Error ? error.message : "Failed to reset draft.",
        variant: "destructive",
      });
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Loading Draft...</h3>
            <p className="text-muted-foreground">Setting up the draft session</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto p-6">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Draft</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Draft Header */}
      <div className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate(`/league/${leagueId}`)}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to League
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{currentLeague.name} Draft</h1>
                <p className="text-muted-foreground">
                  {draftSession ? (
                    <>Live Draft • Round {Math.ceil(draftSession.current_pick / leagueMembers.length)} • Pick {draftSession.current_pick}</>
                  ) : (
                    'No active draft session'
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant={draftSession?.status === 'active' ? 'default' : 'secondary'}>
                {draftSession?.status === 'active' ? 'LIVE' : draftSession?.status === 'paused' ? 'PAUSED' : 'WAITING'}
              </Badge>
              {draftSession && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="font-mono">{draftSession.time_remaining}s</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Draft Board - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Draft Controls */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Draft Controls</CardTitle>
                    <CardDescription>
                      {!draftSession && 'Ready to start the draft'}
                      {draftSession?.status === 'active' && (
                        <>Pick {draftSession.current_pick} - {leagueMembers[draftSession.current_team_index]?.team_name} is on the clock</>
                      )}
                      {draftSession?.status === 'paused' && 'Draft is paused'}
                      {draftSession?.status === 'completed' && 'Draft completed successfully'}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {!draftSession && (
                      <Button onClick={startDraft} className="bg-green-600 hover:bg-green-700">
                        <Play className="h-4 w-4 mr-2" />
                        Start Draft
                      </Button>
                    )}
                    {draftSession?.status === 'active' && (
                      <Button onClick={pauseDraft} variant="outline">
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </Button>
                    )}
                    {draftSession?.status === 'paused' && (
                      <Button onClick={resumeDraft} className="bg-green-600 hover:bg-green-700">
                        <Play className="h-4 w-4 mr-2" />
                        Resume
                      </Button>
                    )}
                    {draftSession && (
                      <Button onClick={resetDraft} variant="outline">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {draftSession?.status === 'active' && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{leagueMembers[draftSession.current_team_index]?.team_name}</strong> is on the clock with {draftSession.time_remaining} seconds remaining.
                    </AlertDescription>
                  </Alert>
                )}
                {draftSession?.status === 'completed' && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <strong>Draft Complete!</strong> All picks have been made. The draft is finished.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Available Players */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Available Players</CardTitle>
                <CardDescription>
                  {filteredStocks.length} stocks available to draft • Your roster: {userRoster.length} stocks
                </CardDescription>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search stocks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredStocks.map((stock) => (
                    <div 
                      key={stock.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-gradient-card border border-border/50 hover:shadow-card transition-all duration-200"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
                          <span className="text-lg font-bold text-primary">
                            {stock.symbol.charAt(0)}
                          </span>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold">{stock.symbol}</h3>
                            <Badge variant="outline" className="text-xs">
                              {stock.sector}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              #{stock.draftPosition}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{stock.company}</p>
                          
                          {/* Score Breakdown */}
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Growth</div>
                              <div className="flex items-center gap-2">
                                <Progress value={stock.growthScore} className="h-2 flex-1" />
                                <span className="text-xs font-mono w-8">{stock.growthScore}</span>
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Value</div>
                              <div className="flex items-center gap-2">
                                <Progress value={stock.valueScore} className="h-2 flex-1" />
                                <span className="text-xs font-mono w-8">{stock.valueScore}</span>
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Risk</div>
                              <div className="flex items-center gap-2">
                                <Progress value={stock.riskScore} className="h-2 flex-1" />
                                <span className="text-xs font-mono w-8">{stock.riskScore}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-3xl font-bold mb-2">
                          {stock.totalScore.toFixed(1)}
                        </div>
                        <div className={`flex items-center gap-1 justify-end ${getChangeColor(stock.change)} mb-4`}>
                          {getChangeIcon(stock.change)}
                          <span className="font-mono text-sm">
                            {stock.change > 0 ? '+' : ''}{stock.change.toFixed(1)} 
                            ({stock.changePercent > 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                          </span>
                        </div>
                        <Button 
                          onClick={() => handleDraftStock(stock)}
                          disabled={!draftSession || draftSession.status !== 'active' || !isCurrentUserTurn}
                          className="w-full"
                        >
                          {!draftSession ? 'No Draft' : 
                           draftSession.status !== 'active' ? 'Draft Paused' :
                           !isCurrentUserTurn ? 'Not Your Turn' : 'Draft'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Draft Board - Right Column */}
          <div className="space-y-6">
            {/* Draft Order */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Draft Order</CardTitle>
                <CardDescription>
                  Current pick: {draftSession?.current_pick || 0} of {leagueMembers.length * 5}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {leagueMembers.map((member, index) => {
                    const memberPicks = draftPicks.filter(pick => pick.team_id === member.id);
                    const isCurrentTeam = draftSession && index === draftSession.current_team_index;
                    const isUserTeam = member.user_id === user?.id;
                    
                    return (
                      <div 
                        key={member.id}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          isCurrentTeam && draftSession?.status === 'active' 
                            ? 'bg-primary/10 border-primary border' 
                            : 'bg-muted/50'
                        } ${isUserTeam ? 'ring-2 ring-blue-200' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold">{index + 1}</span>
                          </div>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {member.team_name}
                              {isUserTeam && (
                                <Badge variant="secondary" className="text-xs">You</Badge>
                              )}
                              {member.is_commissioner && (
                                <Badge variant="default" className="text-xs">Admin</Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {member.user_id === user?.id ? 'You' : 'Member'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-mono">{memberPicks.length}/5</div>
                          {isCurrentTeam && draftSession?.status === 'active' && (
                            <div className="flex items-center gap-1 text-primary text-xs">
                              <Clock className="h-3 w-3" />
                              On Clock
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Recent Picks */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Picks</CardTitle>
                <CardDescription>
                  Latest draft selections
                </CardDescription>
              </CardHeader>
              <CardContent>
                {draftPicks.length === 0 ? (
                  <div className="text-center py-8">
                    <Trophy className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No picks yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {draftPicks.slice(-5).reverse().map((pick) => {
                      const teamMember = leagueMembers.find(member => member.id === pick.team_id);
                      return (
                        <div key={`${pick.pick_number}-${pick.stock_id}`} className="flex items-center justify-between p-2 rounded bg-muted/50">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gradient-to-br from-primary/20 to-accent/20 rounded flex items-center justify-center">
                              <span className="text-xs font-bold">{pick.stock_data.symbol.charAt(0)}</span>
                            </div>
                            <div>
                              <div className="font-medium text-sm">{pick.stock_data.symbol}</div>
                              <div className="text-xs text-muted-foreground">{teamMember?.team_name || 'Unknown Team'}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold">{pick.stock_data.totalScore.toFixed(1)}</div>
                            <div className="text-xs text-muted-foreground">Pick {pick.pick_number}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Draft Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Draft Progress</CardTitle>
                <CardDescription>
                  {draftPicks.length} of {leagueMembers.length * 5} picks completed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Progress value={(draftPicks.length / (leagueMembers.length * 5)) * 100} className="h-3" />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Completed</div>
                      <div className="font-bold">{draftPicks.length}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Remaining</div>
                      <div className="font-bold">{(leagueMembers.length * 5) - draftPicks.length}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Draft;
