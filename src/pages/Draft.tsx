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
  Users, 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  CheckCircle,
  AlertCircle,
  Play,
  RotateCcw
} from "lucide-react";
import { useLeague } from "@/contexts/LeagueContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRoster } from "@/contexts/RosterContext";
import { Stock } from "@/types/roster";
import { useToast } from "@/hooks/use-toast";

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
  const { availableStocks, addStockToRoster, removeStockFromRoster, roster } = useRoster();
  const { toast } = useToast();
  
  // Check if we're in view mode (draft has been completed)
  const [isViewMode, setIsViewMode] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [teams, setTeams] = useState(getMockTeams(user?.user_metadata?.team_name || "Your Team"));
  const [currentPick, setCurrentPick] = useState(1);
  const [selectedTeamIndex, setSelectedTeamIndex] = useState(0); // Team the user is currently drafting for
  const [draftStatus, setDraftStatus] = useState<'waiting' | 'active' | 'completed'>('waiting');
  const [draftedStocks, setDraftedStocks] = useState<Stock[]>([]);
  const [draftPicks, setDraftPicks] = useState<{pick: number, team: string, stock: Stock}[]>([]);
  const [teamPicks, setTeamPicks] = useState<{[teamId: string]: Stock[]}>({});
  
  // Find the current league
  const currentLeague = userLeagues.find(league => league.id === leagueId);
  
  // Check if draft has been completed for this league
  useEffect(() => {
    if (leagueId) {
      const draftCompleted = localStorage.getItem(`draft_completed_${leagueId}`);
      if (draftCompleted === 'true') {
        setIsViewMode(true);
        setDraftStatus('completed');
      }
    }
  }, [leagueId]);
  
  
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

  const filteredStocks = availableStocks.filter(stock => {
    const matchesSearch = stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         stock.company.toLowerCase().includes(searchQuery.toLowerCase());
    
    // If draft is completed, show all stocks (they'll be available in Players tab)
    if (draftStatus === 'completed') {
      return matchesSearch;
    }
    
    // During active draft, only show undrafted stocks
    const notDrafted = !draftedStocks.some(drafted => drafted.id === stock.id);
    const notInRoster = !roster.some(rosterStock => rosterStock.id === stock.id);
    return matchesSearch && notDrafted && notInRoster;
  });

  const handleDraftStock = async (stock: Stock) => {
    try {
      // If drafting for the user's team (first team), add to their roster
      if (selectedTeamIndex === 0) { // First team is always the current user
        await addStockToRoster(stock);
        
        toast({
          title: "Stock Drafted!",
          description: `${stock.symbol} has been added to your roster.`,
        });
      } else {
        toast({
          title: "Stock Drafted!",
          description: `${stock.symbol} has been drafted for ${teams[selectedTeamIndex].name}.`,
        });
      }
      
      const pickData = {
        pick: currentPick,
        team: teams[selectedTeamIndex].name,
        stock: stock
      };
      
      setDraftedStocks(prev => [...prev, stock]);
      setDraftPicks(prev => [...prev, pickData]);
      
      // Update team picks tracking
      const newTeamPicks = {
        ...teamPicks,
        [teams[selectedTeamIndex].id]: [
          ...(teamPicks[teams[selectedTeamIndex].id] || []),
          stock
        ]
      };
      setTeamPicks(newTeamPicks);
      
      // Save to localStorage for Matchup component
      localStorage.setItem('draft_team_picks', JSON.stringify(newTeamPicks));
      
      setCurrentPick(prev => prev + 1);
    } catch (error) {
      toast({
        title: "Draft Error",
        description: error instanceof Error ? error.message : "Failed to draft stock. Please try again.",
        variant: "destructive",
      });
    }
  };

  const startDraft = () => {
    setDraftStatus('active');
  };

  const endDraft = () => {
    setDraftStatus('completed');
    setIsViewMode(true);
    
    // Mark draft as completed in localStorage
    if (leagueId) {
      localStorage.setItem(`draft_completed_${leagueId}`, 'true');
    }
    
    toast({
      title: "Draft Completed!",
      description: "The draft has been finalized. Undrafted stocks are now available in the Players tab.",
    });
  };

  const resetDraft = async () => {
    try {
      // Clear the user's roster by removing all stocks
      for (const stock of roster) {
        await removeStockFromRoster(stock.id);
      }
      
      setDraftStatus('waiting');
      setCurrentPick(1);
      setSelectedTeamIndex(0);
      setDraftedStocks([]);
      setDraftPicks([]);
      setTeamPicks({});
      setIsViewMode(false);
      
      // Clear draft completion flag
      if (leagueId) {
        localStorage.removeItem(`draft_completed_${leagueId}`);
      }
      
      // Clear team picks from localStorage
      localStorage.removeItem('draft_team_picks');
      
      toast({
        title: "Draft Reset",
        description: "The draft has been reset and your roster has been cleared.",
      });
    } catch (error) {
      toast({
        title: "Reset Error",
        description: "Failed to reset draft. Please try again.",
        variant: "destructive",
      });
    }
  };


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
                <h1 className="text-2xl font-bold">{currentLeague.name} {isViewMode ? 'Draft Results' : 'Draft'}</h1>
                <p className="text-muted-foreground">
                  {isViewMode ? 'View Draft Results' : `Draft Mode • Pick ${currentPick} of ${teams.length * 5}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant={isViewMode ? 'secondary' : draftStatus === 'active' ? 'default' : draftStatus === 'completed' ? 'secondary' : 'outline'}>
                {isViewMode ? 'VIEW' : draftStatus === 'active' ? 'ACTIVE' : draftStatus === 'completed' ? 'COMPLETED' : 'WAITING'}
              </Badge>
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
                      {isViewMode && 'Viewing completed draft results'}
                      {!isViewMode && draftStatus === 'waiting' && 'Ready to start the draft'}
                      {!isViewMode && draftStatus === 'active' && 'Select a team and draft stocks for them'}
                      {!isViewMode && draftStatus === 'completed' && 'Draft has been completed'}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {!isViewMode && draftStatus === 'waiting' && (
                      <Button onClick={startDraft} className="bg-green-600 hover:bg-green-700">
                        <Play className="h-4 w-4 mr-2" />
                        Start Draft
                      </Button>
                    )}
                    {!isViewMode && draftStatus === 'active' && (
                      <Button onClick={endDraft} className="bg-blue-600 hover:bg-blue-700">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        End Draft
                      </Button>
                    )}
                    {!isViewMode && (
                      <Button onClick={resetDraft} variant="outline">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {(draftStatus === 'active' || isViewMode) && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        {isViewMode ? 'Team Selection:' : 'Select Team to Draft For:'}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {teams.map((team, index) => (
                          <Button
                            key={team.id}
                            variant={selectedTeamIndex === index ? "default" : "outline"}
                            onClick={() => !isViewMode && setSelectedTeamIndex(index)}
                            disabled={isViewMode}
                            className="justify-start"
                          >
                            <Users className="h-4 w-4 mr-2" />
                            {team.name}
                            {index === 0 && <span className="ml-2 text-xs">(You)</span>}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <Alert className="border-primary bg-primary/5">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>{isViewMode ? 'Viewing' : 'Drafting for'} {teams[selectedTeamIndex].name}</strong>
                        {isViewMode ? (
                          <span className="block mt-1 text-muted-foreground">View draft results for this team</span>
                        ) : selectedTeamIndex === 0 ? (
                          <span className="block mt-1 text-primary font-medium">Stocks will be added to your roster</span>
                        ) : (
                          <span className="block mt-1 text-muted-foreground">Stocks will be tracked for this team</span>
                        )}
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
                {draftStatus === 'completed' && (
                  <div className="mt-4">
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        <strong>Draft Complete!</strong> All picks have been made. The draft is finished.
                      </AlertDescription>
                    </Alert>
                  </div>
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
                      {draftStatus === 'completed' 
                        ? `${filteredStocks.length} stocks available in Players tab` 
                        : `${filteredStocks.length} stocks available to draft`}
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
                          onClick={() => !isViewMode && handleDraftStock(stock)}
                          disabled={draftStatus !== 'active' || isViewMode}
                          className="w-full"
                        >
                          {isViewMode ? 'View Only' :
                           draftStatus === 'waiting' ? 'Draft Not Started' : 
                           draftStatus === 'completed' ? 'Draft Completed' : 
                           'Draft for ' + teams[selectedTeamIndex].name}
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
                  Current pick: {currentPick} of {teams.length * 5}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {teams.map((team, index) => (
                    <div 
                      key={team.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        index === selectedTeamIndex && draftStatus === 'active' 
                          ? 'bg-primary/10 border-primary border' 
                          : 'bg-muted/50'
                      } ${index === 0 ? 'ring-2 ring-blue-200' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold">{index + 1}</span>
                        </div>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {team.name}
                            {index === 0 && (
                              <Badge variant="secondary" className="text-xs">You</Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">{team.owner}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-mono">
                          {(teamPicks[team.id] || []).length}/5
                        </div>
                        {index === selectedTeamIndex && draftStatus === 'active' && (
                          <div className="flex items-center gap-1 text-primary text-xs">
                            <Users className="h-3 w-3" />
                            Selected
                          </div>
                        )}
                        {(teamPicks[team.id] || []).length === 5 && (
                          <div className="flex items-center gap-1 text-green-600 text-xs">
                            <CheckCircle className="h-3 w-3" />
                            Complete
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
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
                    {draftPicks.slice(-5).reverse().map((pick, index) => (
                      <div key={`${pick.pick}-${pick.stock.id}`} className="flex items-center justify-between p-2 rounded bg-muted/50">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gradient-to-br from-primary/20 to-accent/20 rounded flex items-center justify-center">
                            <span className="text-xs font-bold">{pick.stock.symbol.charAt(0)}</span>
                          </div>
                          <div>
                            <div className="font-medium text-sm">{pick.stock.symbol}</div>
                            <div className="text-xs text-muted-foreground">{pick.team}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold">{pick.stock.totalScore.toFixed(1)}</div>
                          <div className="text-xs text-muted-foreground">Pick {pick.pick}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Draft Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Draft Progress</CardTitle>
                <CardDescription>
                  {draftPicks.length} of {teams.length * 5} picks completed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Progress value={(draftPicks.length / (teams.length * 5)) * 100} className="h-3" />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Completed</div>
                      <div className="font-bold">{draftPicks.length}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Remaining</div>
                      <div className="font-bold">{(teams.length * 5) - draftPicks.length}</div>
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
