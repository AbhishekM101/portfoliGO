import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AppNavigation } from "@/components/AppNavigation";
import { TrendingUp, TrendingDown, Minus, BarChart3, Calendar } from "lucide-react";

// Mock roster data
const mockRoster = [
  {
    symbol: "AAPL",
    company: "Apple Inc.",
    sector: "Technology",
    totalScore: 87.5,
    growthScore: 82,
    valueScore: 88,
    riskScore: 92,
    change: 2.3,
    changePercent: 1.45,
    draftPosition: 1,
  },
  {
    symbol: "MSFT", 
    company: "Microsoft Corporation",
    sector: "Technology",
    totalScore: 91.2,
    growthScore: 89,
    valueScore: 94,
    riskScore: 87,
    change: -1.8,
    changePercent: -0.52,
    draftPosition: 2,
  },
  {
    symbol: "GOOGL",
    company: "Alphabet Inc.",
    sector: "Technology", 
    totalScore: 78.9,
    growthScore: 85,
    valueScore: 72,
    riskScore: 81,
    change: 0.0,
    changePercent: 0.0,
    draftPosition: 3,
  },
  {
    symbol: "TSLA",
    company: "Tesla Inc.",
    sector: "Consumer Cyclical",
    totalScore: 65.4,
    growthScore: 95,
    valueScore: 45,
    riskScore: 55,
    change: 12.7,
    changePercent: 4.82,
    draftPosition: 4,
  },
  {
    symbol: "NVDA",
    company: "NVIDIA Corporation", 
    sector: "Technology",
    totalScore: 93.1,
    growthScore: 98,
    valueScore: 85,
    riskScore: 88,
    change: 5.4,
    changePercent: 2.1,
    draftPosition: 5,
  },
];

const Roster = () => {
  const totalTeamScore = mockRoster.reduce((sum, stock) => sum + stock.totalScore, 0);
  const averageScore = totalTeamScore / mockRoster.length;

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-bull" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-bear" />;
    return <Minus className="h-4 w-4 text-neutral" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return "text-bull";
    if (change < 0) return "text-bear";
    return "text-neutral";
  };

  return (
    <div className="min-h-screen bg-background">
      <AppNavigation />
      
      <div className="max-w-6xl mx-auto p-6">
        {/* Team Overview */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Bull Market Bulls</h1>
              <p className="text-muted-foreground">Your fantasy stock portfolio</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-success">{averageScore.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">Team Score</div>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Roster Size</p>
                    <p className="text-2xl font-bold">{mockRoster.length}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">This Week</p>
                    <p className="text-2xl font-bold text-neutral">-</p>
                  </div>
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Record</p>
                    <p className="text-2xl font-bold">0-0</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-success" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Rank</p>
                    <p className="text-2xl font-bold">#1</p>
                  </div>
                  <Badge className="bg-gradient-success">
                    1st
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Roster */}
        <Card>
          <CardHeader>
            <CardTitle>Your Stocks</CardTitle>
            <CardDescription>
              Your drafted portfolio with real-time ML scoring
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockRoster.map((stock, index) => (
                <div 
                  key={stock.symbol}
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
                      
                      {/* Score Breakdown */}
                      <div className="grid grid-cols-3 gap-4 mt-4">
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
                    <div className={`flex items-center gap-1 justify-end ${getChangeColor(stock.change)}`}>
                      {getChangeIcon(stock.change)}
                      <span className="font-mono text-sm">
                        {stock.change > 0 ? '+' : ''}{stock.change.toFixed(1)} 
                        ({stock.changePercent > 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold">Team Total Score</h4>
                  <p className="text-sm text-muted-foreground">
                    Average of all stock scores in your portfolio
                  </p>
                </div>
                <div className="text-3xl font-bold text-success">
                  {averageScore.toFixed(1)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Roster;