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
import { Stock } from "@/types/roster";

// Mock draft data
const mockDraftableStocks: Stock[] = [
  {
    id: "1",
    symbol: "AAPL",
    company: "Apple Inc.",
    sector: "Technology",
    totalScore: 87.5,
    growthScore: 92,
    valueScore: 78,
    riskScore: 85,
    change: 62.2,
    changePercent: 2.7,
    draftPosition: 1,
    price: 175.43,
    marketCap: 2800000000000,
    volume: 45000000
  },
  {
    id: "2",
    symbol: "TSLA",
    company: "Tesla Inc.",
    sector: "Automotive",
    totalScore: 65.4,
    growthScore: 88,
    valueScore: 45,
    riskScore: 78,
    change: 48.7,
    changePercent: 8.2,
    draftPosition: 2,
    price: 245.67,
    marketCap: 780000000000,
    volume: 35000000
  },
  {
    id: "3",
    symbol: "NVDA",
    company: "NVIDIA Corporation",
    sector: "Technology",
    totalScore: 93.1,
    growthScore: 95,
    valueScore: 88,
    riskScore: 90,
    change: 2.0,
    changePercent: 1.2,
    draftPosition: 3,
    price: 420.15,
    marketCap: 1000000000000,
    volume: 25000000
  },
  {
    id: "4",
    symbol: "AMZN",
    company: "Amazon.com Inc.",
    sector: "Consumer Discretionary",
    totalScore: 89.2,
    growthScore: 85,
    valueScore: 92,
    riskScore: 88,
    change: 15.3,
    changePercent: 0.9,
    draftPosition: 4,
    price: 145.32,
    marketCap: 1500000000000,
    volume: 40000000
  },
  {
    id: "5",
    symbol: "META",
    company: "Meta Platforms Inc.",
    sector: "Technology",
    totalScore: 76.8,
    growthScore: 82,
    valueScore: 70,
    riskScore: 78,
    change: 8.7,
    changePercent: -1.4,
    draftPosition: 5,
    price: 320.45,
    marketCap: 850000000000,
    volume: 20000000
  }
];

const mockTeams = [
  { id: "1", name: "Tech Titans", owner: "John Doe", picks: [] },
  { id: "2", name: "Growth Gurus", owner: "Jane Smith", picks: [] },
  { id: "3", name: "Value Vault", owner: "Mike Johnson", picks: [] },
  { id: "4", name: "Risk Raiders", owner: "Sarah Wilson", picks: [] }
];

const Draft = () => {
  const { leagueId } = useParams();
  const navigate = useNavigate();
  const { userLeagues } = useLeague();
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [draftableStocks] = useState(mockDraftableStocks);
  const [teams] = useState(mockTeams);
  const [currentPick, setCurrentPick] = useState(1);
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);
  const [draftStatus, setDraftStatus] = useState<'waiting' | 'active' | 'paused' | 'completed'>('waiting');
  const [timeRemaining, setTimeRemaining] = useState(90); // 90 seconds per pick
  const [draftedStocks, setDraftedStocks] = useState<Stock[]>([]);
  const [draftPicks, setDraftPicks] = useState<{pick: number, team: string, stock: Stock}[]>([]);
  
  // Find the current league
  const currentLeague = userLeagues.find(league => league.id === leagueId);
  
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

  const filteredStocks = draftableStocks.filter(stock => {
    const matchesSearch = stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         stock.company.toLowerCase().includes(searchQuery.toLowerCase());
    const notDrafted = !draftedStocks.some(drafted => drafted.id === stock.id);
    return matchesSearch && notDrafted;
  });

  const handleDraftStock = (stock: Stock) => {
    const pickData = {
      pick: currentPick,
      team: teams[currentTeamIndex].name,
      stock: stock
    };
    
    setDraftedStocks(prev => [...prev, stock]);
    setDraftPicks(prev => [...prev, pickData]);
    setCurrentPick(prev => prev + 1);
    setCurrentTeamIndex(prev => (prev + 1) % teams.length);
    setTimeRemaining(90); // Reset timer for next pick
    
    // Check if draft is complete
    if (currentPick >= teams.length * 5) {
      setDraftStatus('completed');
    }
  };

  const startDraft = () => {
    setDraftStatus('active');
  };

  const pauseDraft = () => {
    setDraftStatus('paused');
  };

  const resumeDraft = () => {
    setDraftStatus('active');
  };

  const resetDraft = () => {
    setDraftStatus('waiting');
    setCurrentPick(1);
    setCurrentTeamIndex(0);
    setDraftedStocks([]);
    setDraftPicks([]);
    setTimeRemaining(90);
  };

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (draftStatus === 'active' && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Auto-pick the highest available stock when time runs out
            const availableStocks = draftableStocks.filter(stock => 
              !draftedStocks.some(drafted => drafted.id === stock.id)
            );
            if (availableStocks.length > 0) {
              const highestStock = availableStocks.reduce((highest, current) => 
                current.totalScore > highest.totalScore ? current : highest
              );
              handleDraftStock(highestStock);
            }
            return 90;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [draftStatus, timeRemaining, draftedStocks, draftableStocks]);

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
                <p className="text-muted-foreground">Live Draft • Round {Math.ceil(currentPick / teams.length)} • Pick {currentPick}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant={draftStatus === 'active' ? 'default' : 'secondary'}>
                {draftStatus === 'active' ? 'LIVE' : draftStatus === 'paused' ? 'PAUSED' : 'WAITING'}
              </Badge>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="font-mono">{timeRemaining}s</span>
              </div>
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
                      {draftStatus === 'waiting' && 'Ready to start the draft'}
                      {draftStatus === 'active' && `Pick ${currentPick} - ${teams[currentTeamIndex].name} is on the clock`}
                      {draftStatus === 'paused' && 'Draft is paused'}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {draftStatus === 'waiting' && (
                      <Button onClick={startDraft} className="bg-green-600 hover:bg-green-700">
                        <Play className="h-4 w-4 mr-2" />
                        Start Draft
                      </Button>
                    )}
                    {draftStatus === 'active' && (
                      <Button onClick={pauseDraft} variant="outline">
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </Button>
                    )}
                    {draftStatus === 'paused' && (
                      <Button onClick={resumeDraft} className="bg-green-600 hover:bg-green-700">
                        <Play className="h-4 w-4 mr-2" />
                        Resume
                      </Button>
                    )}
                    <Button onClick={resetDraft} variant="outline">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {draftStatus === 'active' && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{teams[currentTeamIndex].name}</strong> is on the clock with {timeRemaining} seconds remaining.
                    </AlertDescription>
                  </Alert>
                )}
                {draftStatus === 'completed' && (
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
                      {filteredStocks.length} stocks available to draft
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
                          disabled={draftStatus !== 'active'}
                          className="w-full"
                        >
                          Draft
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
                        index === currentTeamIndex && draftStatus === 'active' 
                          ? 'bg-primary/10 border-primary border' 
                          : 'bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold">{index + 1}</span>
                        </div>
                        <div>
                          <div className="font-medium">{team.name}</div>
                          <div className="text-xs text-muted-foreground">{team.owner}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-mono">{team.picks.length}/5</div>
                        {index === currentTeamIndex && draftStatus === 'active' && (
                          <div className="flex items-center gap-1 text-primary text-xs">
                            <Clock className="h-3 w-3" />
                            On Clock
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
