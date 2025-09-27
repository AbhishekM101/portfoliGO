import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Minus, Trophy, Target, Calendar } from "lucide-react";

// Mock matchup data
const currentWeek = 1;
const matchupData = {
  myTeam: {
    name: "Bull Market Bulls",
    owner: "You",
    score: 87.3,
    record: "0-0",
    stocks: [
      { symbol: "AAPL", score: 87.5, change: 2.3 },
      { symbol: "MSFT", score: 91.2, change: -1.8 },
      { symbol: "GOOGL", score: 78.9, change: 0.0 },
      { symbol: "TSLA", score: 65.4, change: 12.7 },
      { symbol: "NVDA", score: 93.1, change: 5.4 },
    ]
  },
  opponent: {
    name: "Diamond Hands",
    owner: "Sarah Kim", 
    score: 82.1,
    record: "0-0",
    stocks: [
      { symbol: "AMZN", score: 89.2, change: 1.5 },
      { symbol: "META", score: 76.8, change: -3.2 },
      { symbol: "NFLX", score: 84.3, change: 2.1 },
      { symbol: "AMD", score: 79.5, change: -0.8 },
      { symbol: "CRM", score: 80.7, change: 4.2 },
    ]
  }
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
  const scoreGap = Math.abs(matchupData.myTeam.score - matchupData.opponent.score);
  const isWinning = matchupData.myTeam.score > matchupData.opponent.score;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* Week Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <span className="text-lg font-semibold">Week {currentWeek}</span>
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
              <Badge variant="outline" className="mt-2">{matchupData.myTeam.record}</Badge>
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
              <Badge variant="outline" className="mt-2">{matchupData.opponent.record}</Badge>
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
                {matchupData.myTeam.score.toFixed(1)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {matchupData.myTeam.stocks.map((stock) => (
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
                {matchupData.opponent.score.toFixed(1)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {matchupData.opponent.stocks.map((stock) => (
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

        {/* Progress Bar */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium">Week Progress</span>
              <span className="text-sm text-muted-foreground">Day 1 of 5</span>
            </div>
            <Progress value={20} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>Monday</span>
              <span>Tuesday</span>
              <span>Wednesday</span>
              <span>Thursday</span>
              <span>Friday</span>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              This Week's Schedule
            </CardTitle>
            <CardDescription>
              Scores update daily at market close (4:00 PM ET)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day, index) => (
                <div key={day} className={`text-center p-4 rounded-lg ${index === 0 ? 'bg-primary/10 border border-primary/20' : 'bg-muted'}`}>
                  <div className="font-semibold text-sm">{day}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {index === 0 ? 'In Progress' : 'Pending'}
                  </div>
                  <div className="text-2xl font-bold mt-2">
                    {index === 0 ? '-' : '-'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Matchup;