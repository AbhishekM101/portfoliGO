import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Trophy, 
  Users, 
  Target, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Plus,
  Calendar,
  Award,
  Settings,
  RefreshCw,
  AlertCircle,
  Home,
  LineChart
} from "lucide-react";
import { AppNavigation } from "@/components/AppNavigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLeague } from "@/contexts/LeagueContext";
import { useRoster } from "@/contexts/RosterContext";
import { useToast } from "@/hooks/use-toast";
import { LeagueService } from "@/services/leagueService";
import { Stock } from "@/types/roster";

const LeagueDashboard = () => {
  const { leagueId } = useParams();
  const { user } = useAuth();
  const { userLeagues, refreshLeagues } = useLeague();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Use RosterContext for roster management
  const { 
    team, 
    roster, 
    availableStocks, 
    stats, 
    isLoading: rosterLoading, 
    error: rosterError, 
    addStockToRoster, 
    removeStockFromRoster 
  } = useRoster();
  
  const [league, setLeague] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (leagueId) {
      loadLeagueDetails();
    }
  }, [leagueId]);

  const loadLeagueDetails = async () => {
    try {
      setLoading(true);
      // Find the league from user's leagues
      const userLeague = userLeagues.find(l => l.id === leagueId);
      if (userLeague) {
        setLeague(userLeague);
      } else {
        setError("League not found or you don't have access to it");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load league details");
    } finally {
      setLoading(false);
    }
  };

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

  // Mock data for demonstration (matchups and standings)
  const mockMatchups = [
    { id: "1", opponent: "Team Alpha", week: 1, yourScore: 245.7, opponentScore: 238.2, status: "W", date: "2024-01-15" },
    { id: "2", opponent: "Team Beta", week: 2, yourScore: 0, opponentScore: 0, status: "upcoming", date: "2024-01-22" },
    { id: "3", opponent: "Team Gamma", week: 3, yourScore: 0, opponentScore: 0, status: "upcoming", date: "2024-01-29" },
  ];

  const mockStandings = [
    { rank: 1, team: "Your Team", wins: 1, losses: 0, pointsFor: 245.7, pointsAgainst: 238.2 },
    { rank: 2, team: "Team Alpha", wins: 0, losses: 1, pointsFor: 238.2, pointsAgainst: 245.7 },
    { rank: 3, team: "Team Beta", wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 },
    { rank: 4, team: "Team Gamma", wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 },
  ];

  // Functions to handle stock operations
  const handleAddStock = async (stock: Stock) => {
    try {
      await addStockToRoster(stock);
      toast({
        title: "Stock Added",
        description: `${stock.symbol} has been added to your roster.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add stock to roster.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveStock = async (stockId: string) => {
    try {
      await removeStockFromRoster(stockId);
      toast({
        title: "Stock Removed",
        description: "Stock has been removed from your roster.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove stock from roster.",
        variant: "destructive",
      });
    }
  };

  if (loading || rosterLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppNavigation />
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading league...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || rosterError || !league) {
    return (
      <div className="min-h-screen bg-background">
        <AppNavigation />
        <div className="max-w-6xl mx-auto p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || rosterError || "League not found"}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNavigation />
      
      <div className="max-w-6xl mx-auto p-6">
        {/* League Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{league.name}</h1>
              <p className="text-muted-foreground">{league.description || "Fantasy Stock League"}</p>
              {team && (
                <p className="text-sm text-muted-foreground mt-1">Team: {team.name}</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-sm">
                {league.status.replace('_', ' ').toUpperCase()}
              </Badge>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                League Settings
              </Button>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">League Members</p>
                    <p className="text-2xl font-bold">{league.member_count || 0}/{league.max_players}</p>
                  </div>
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Roster Size</p>
                    <p className="text-2xl font-bold">{league.roster_size}</p>
                  </div>
                  <Target className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Week</p>
                    <p className="text-2xl font-bold">2</p>
                  </div>
                  <Calendar className="h-8 w-8 text-success" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Your Rank</p>
                    <p className="text-2xl font-bold">#{stats?.rank || 'N/A'}</p>
                  </div>
                  <Trophy className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* League Dashboard Tabs */}
        <Tabs defaultValue="roster" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="roster">Roster</TabsTrigger>
            <TabsTrigger value="matchups">Matchups</TabsTrigger>
            <TabsTrigger value="standings">Standings</TabsTrigger>
            <TabsTrigger value="stocks">Stocks</TabsTrigger>
          </TabsList>

          {/* Roster Tab */}
          <TabsContent value="roster" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Your Roster</CardTitle>
                    <CardDescription>Your drafted portfolio with real-time ML scoring</CardDescription>
                  </div>
                  <Button onClick={() => {
                    // Scroll to stocks tab
                    const stocksTab = document.querySelector('[value="stocks"]') as HTMLElement;
                    if (stocksTab) stocksTab.click();
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Stocks
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {roster.length === 0 ? (
                  <div className="text-center py-12">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No stocks in your roster</h3>
                    <p className="text-muted-foreground mb-4">
                      Start building your fantasy stock portfolio by adding stocks.
                    </p>
                    <Button onClick={() => {
                      // Scroll to stocks tab
                      const stocksTab = document.querySelector('[value="stocks"]') as HTMLElement;
                      if (stocksTab) stocksTab.click();
                    }}>
                      Add Stocks
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {roster.map((stock) => (
                      <div 
                        key={stock.id}
                        className="flex items-center justify-between p-6 rounded-lg bg-gradient-card border border-border/50 hover:shadow-card transition-all duration-200"
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">PICK</div>
                            <div className="text-lg font-bold">{stock.draftPosition}</div>
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-bold">{stock.symbol}</h3>
                              <Badge variant="outline" className="text-xs">
                                {stock.sector}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{stock.company}</p>
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
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRemoveStock(stock.id)}
                            className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Matchups Tab */}
          <TabsContent value="matchups" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Matchups</CardTitle>
                <CardDescription>Your weekly matchups and results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockMatchups.map((matchup) => (
                    <div 
                      key={matchup.id}
                      className="flex items-center justify-between p-6 rounded-lg bg-gradient-card border border-border/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">WEEK</div>
                          <div className="text-lg font-bold">{matchup.week}</div>
                        </div>
                        
                        <div>
                          <h3 className="text-xl font-bold">vs {matchup.opponent}</h3>
                          <p className="text-sm text-muted-foreground">{matchup.date}</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {matchup.status === "upcoming" ? (
                          <Badge variant="outline">Upcoming</Badge>
                        ) : (
                          <div>
                            <div className="text-2xl font-bold mb-1">
                              {matchup.yourScore.toFixed(1)} - {matchup.opponentScore.toFixed(1)}
                            </div>
                            <Badge 
                              variant={matchup.status === "W" ? "default" : "destructive"}
                              className="bg-gradient-success"
                            >
                              {matchup.status === "W" ? "WIN" : "LOSS"}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Standings Tab */}
          <TabsContent value="standings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>League Standings</CardTitle>
                <CardDescription>Current league standings and statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockStandings.map((team) => (
                    <div 
                      key={team.rank}
                      className="flex items-center justify-between p-4 rounded-lg bg-gradient-card border border-border/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">RANK</div>
                          <div className="text-lg font-bold">{team.rank}</div>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-bold">{team.team}</h3>
                          <p className="text-sm text-muted-foreground">
                            {team.wins}-{team.losses} • PF: {team.pointsFor.toFixed(1)} • PA: {team.pointsAgainst.toFixed(1)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {team.rank <= 3 && (
                          <Award className="h-6 w-6 text-yellow-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stocks Tab */}
          <TabsContent value="stocks" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Available Stocks</CardTitle>
                    <CardDescription>Browse and add stocks to your roster</CardDescription>
                  </div>
                  <Button variant="outline" onClick={() => console.log("Refresh stocks")}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Stocks
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {availableStocks.map((stock) => (
                    <div 
                      key={stock.id}
                      className="flex items-center justify-between p-6 rounded-lg bg-gradient-card border border-border/50 hover:shadow-card transition-all duration-200"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
                          <span className="text-lg font-bold text-primary">
                            {stock.symbol.charAt(0)}
                          </span>
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold">{stock.symbol}</h3>
                            <Badge variant="outline" className="text-xs">
                              {stock.sector}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{stock.company}</p>
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
                          onClick={() => handleAddStock(stock)}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add to Roster
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LeagueDashboard;
