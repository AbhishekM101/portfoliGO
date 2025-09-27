import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AppNavigation } from "@/components/AppNavigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { TrendingUp, TrendingDown, Minus, BarChart3, Calendar, AlertCircle, RefreshCw, Trash2 } from "lucide-react";
import { useRoster } from "@/contexts/RosterContext";
import { Stock } from "@/types/roster";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface RosterProps {
  onNavigateToPlayers?: () => void;
}

const Roster = ({ onNavigateToPlayers }: RosterProps) => {
  const { team, roster, stats, isLoading, error, refetch, removeStockFromRoster } = useRoster();
  const navigate = useNavigate();
  const { toast } = useToast();

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

  const handleRemoveStock = async (stock: Stock) => {
    try {
      await removeStockFromRoster(stock.id);
      
      toast({
        title: "Stock Removed",
        description: `${stock.symbol} has been removed from your roster and is now available.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove stock from roster. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto p-6">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
              <div className="text-right">
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="bg-gradient-card border-border/50">
                  <CardContent className="p-4">
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={refetch}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6">
        {/* Team Overview */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {team?.name || "Your Team"}
              </h1>
              <p className="text-muted-foreground">Your fantasy stock portfolio</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-success">
                {stats?.averageScore?.toFixed(1) || "0.0"}
              </div>
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
                    <p className="text-2xl font-bold">{roster.length}</p>
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
                    <p className="text-2xl font-bold text-neutral">
                      {stats?.thisWeekChange ? `${stats.thisWeekChange > 0 ? '+' : ''}${stats.thisWeekChange.toFixed(1)}` : '-'}
                    </p>
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
                    <p className="text-2xl font-bold">
                      {stats?.record ? `${stats.record.wins}-${stats.record.losses}` : '0-0'}
                    </p>
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
                    <p className="text-2xl font-bold">
                      #{stats?.rank || 'N/A'}
                    </p>
                  </div>
                  <Badge className="bg-gradient-success">
                    {stats?.rank ? `${stats.rank}${stats.rank === 1 ? 'st' : stats.rank === 2 ? 'nd' : stats.rank === 3 ? 'rd' : 'th'}` : 'N/A'}
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
            {roster.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No stocks in your roster</h3>
                <p className="text-muted-foreground mb-4">
                  Start building your fantasy stock portfolio by adding stocks.
                </p>
                <Button onClick={() => onNavigateToPlayers ? onNavigateToPlayers() : navigate('/players')}>
                  Add Stocks
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {roster.map((stock, index) => (
                    <div 
                      key={stock.id || stock.symbol}
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
                        <div className={`flex items-center gap-1 justify-end ${getChangeColor(stock.change)} mb-4`}>
                          {getChangeIcon(stock.change)}
                          <span className="font-mono text-sm">
                            {stock.change > 0 ? '+' : ''}{stock.change.toFixed(1)} 
                            ({stock.changePercent > 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                          </span>
                        </div>
                        
                        {/* Remove Stock Button */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Stock from Roster</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove <strong>{stock.symbol}</strong> from your roster? 
                                This stock will become available for other teams to add to their rosters.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleRemoveStock(stock)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remove Stock
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
                      {stats?.averageScore?.toFixed(1) || "0.0"}
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Roster;