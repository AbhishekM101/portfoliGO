import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Trophy, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRoster } from "@/contexts/RosterContext";
import { Stock } from "@/types/roster";

// Same teams from draft
const getMockTeams = (userTeamName: string) => [
  { id: "1", name: userTeamName, owner: "You" },
  { id: "2", name: "Growth Gurus", owner: "Jane Smith" },
  { id: "3", name: "Value Vault", owner: "Mike Johnson" },
  { id: "4", name: "Risk Raiders", owner: "Sarah Wilson" }
];

// Generate weekly matchups with real draft data
const generateWeeklyMatchups = (teams: any[], userRoster: Stock[], teamPicks: {[teamId: string]: Stock[]}) => {
  const userTeam = teams[0]; // First team is always the user
  const otherTeams = teams.slice(1); // Other teams
  
  return otherTeams.map((opponent, index) => {
    // Get user's roster (from RosterContext)
    const myStocks = userRoster || [];
    
    // Get opponent's drafted stocks
    const opponentStocks = teamPicks[opponent.id] || [];
    
    // Calculate scores based on actual stocks
    const myScore = myStocks.reduce((sum, stock) => sum + (stock.totalScore || 0), 0);
    const opponentScore = opponentStocks.reduce((sum, stock) => sum + (stock.totalScore || 0), 0);
    
    return {
      week: index + 1,
      myTeam: userTeam,
      opponent: opponent,
      myScore: myScore || Math.random() * 50 + 50, // Fallback to random if no stocks
      opponentScore: opponentScore || Math.random() * 50 + 50,
      myRecord: `${index}-0`, // User's record up to this week
      opponentRecord: `${index}-0`, // Opponent's record
      stocks: myStocks.map(stock => ({
        symbol: stock.symbol,
        score: stock.totalScore || 0,
        change: (Math.random() - 0.5) * 10 // Random change for now
      })),
      opponentStocks: opponentStocks.map(stock => ({
        symbol: stock.symbol,
        score: stock.totalScore || 0,
        change: (Math.random() - 0.5) * 10 // Random change for now
      }))
    };
  });
};

const getChangeIcon = (change: number) => {
  if (change > 0) return <TrendingUp className="h-3 w-3 text-bull" />;
  if (change < 0) return <TrendingDown className="h-3 w-3 text-bear" />;
  return <Minus className="h-3 w-3 text-neutral" />;
};

const getChangeColor = (change: number) => {
  if (change > 0) return "text-bull";
  if (change < 0) return "text-bear";
  return "text-neutral";
};

const Matchup = () => {
  const { user } = useAuth();
  const { roster } = useRoster();
  const [currentWeek, setCurrentWeek] = useState(1);
  const [teamPicks, setTeamPicks] = useState<{[teamId: string]: Stock[]}>({});
  
  // Load draft data from localStorage
  useEffect(() => {
    const savedTeamPicks = localStorage.getItem('draft_team_picks');
    if (savedTeamPicks) {
      try {
        setTeamPicks(JSON.parse(savedTeamPicks));
      } catch (error) {
        console.error('Error parsing saved team picks:', error);
      }
    }
  }, []);
  
  // Generate teams and matchups
  const teams = getMockTeams(user?.user_metadata?.team_name || "Your Team");
  const weeklyMatchups = generateWeeklyMatchups(teams, roster, teamPicks);
  
  // Get current matchup data
  const matchupData = weeklyMatchups[currentWeek - 1];
  const scoreGap = Math.abs(matchupData.myScore - matchupData.opponentScore);
  const isWinning = matchupData.myScore > matchupData.opponentScore;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* Week Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWeek(Math.max(1, currentWeek - 1))}
              disabled={currentWeek === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span className="text-lg font-semibold">Week {currentWeek}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWeek(Math.min(3, currentWeek + 1))}
              disabled={currentWeek === 3}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h1 className="text-3xl font-bold mb-2">Weekly Matchup</h1>
          <p className="text-muted-foreground">Battle it out with your weekly opponent</p>
        </div>

        {/* Matchup Header */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-8">
            <div className="text-center">
              <div className="text-2xl font-bold">{matchupData.myTeam.name}</div>
              <div className="text-sm text-muted-foreground">{matchupData.myTeam.owner}</div>
              <Badge variant="outline" className="mt-2">{matchupData.myRecord}</Badge>
            </div>
            
            <div className="text-center">
              <div className="text-4xl font-bold text-muted-foreground">VS</div>
              <div className="text-sm text-muted-foreground mt-2">
                {isWinning ? "Leading" : "Trailing"} by {scoreGap.toFixed(1)}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">{matchupData.opponent.name}</div>
              <div className="text-sm text-muted-foreground">{matchupData.opponent.owner}</div>
              <Badge variant="outline" className="mt-2">{matchupData.opponentRecord}</Badge>
            </div>
          </div>
        </div>

        {/* Score Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* My Team */}
          <Card className={`bg-gradient-card border-2 ${isWinning ? 'border-success' : 'border-border/50'}`}>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                {isWinning && <Trophy className="h-5 w-5 text-success" />}
                {matchupData.myTeam.name}
              </CardTitle>
              <div className="text-4xl font-bold text-success">
                {matchupData.myScore.toFixed(1)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {matchupData.stocks.map((stock) => (
                  <div key={stock.symbol} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <div className="font-semibold">{stock.symbol}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{stock.score.toFixed(1)}</div>
                      <div className={`text-xs flex items-center gap-1 ${getChangeColor(stock.change)}`}>
                        {getChangeIcon(stock.change)}
                        {stock.change > 0 ? '+' : ''}{stock.change.toFixed(1)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Opponent Team */}
          <Card className={`bg-gradient-card border-2 ${!isWinning ? 'border-success' : 'border-border/50'}`}>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                {!isWinning && <Trophy className="h-5 w-5 text-success" />}
                {matchupData.opponent.name}
              </CardTitle>
              <div className="text-4xl font-bold text-success">
                {matchupData.opponentScore.toFixed(1)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {matchupData.opponentStocks.map((stock) => (
                  <div key={stock.symbol} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <div className="font-semibold">{stock.symbol}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{stock.score.toFixed(1)}</div>
                      <div className={`text-xs flex items-center gap-1 ${getChangeColor(stock.change)}`}>
                        {getChangeIcon(stock.change)}
                        {stock.change > 0 ? '+' : ''}{stock.change.toFixed(1)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default Matchup;