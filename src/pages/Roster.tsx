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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TrendingUp, TrendingDown, Minus, BarChart3, Calendar, AlertCircle, RefreshCw, Trash2, BarChart, Filter } from "lucide-react";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { useRoster } from "@/contexts/RosterContext";
import { Stock } from "@/types/roster";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface RosterProps {
  onNavigateToPlayers?: () => void;
}

const Roster = ({ onNavigateToPlayers }: RosterProps) => {
  const { team, roster, stats, isLoading, error, refetch, removeStockFromRoster } = useRoster();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedMetric, setSelectedMetric] = useState<'all' | 'growth' | 'value' | 'risk' | 'overall'>('all');

  // Prepare data for visualization
  const getVisualizationData = () => {
    if (!roster.length) return { barData: [], pieData: [], radarData: [] };

    // Bar chart data for individual stocks
    const barData = roster.map(stock => ({
      symbol: stock.symbol,
      growth: stock.growthScore,
      value: stock.valueScore,
      risk: stock.riskScore,
      total: stock.totalScore
    }));

    // Pie chart data for overall portfolio composition
    const totalGrowth = roster.reduce((sum, stock) => sum + stock.growthScore, 0);
    const totalValue = roster.reduce((sum, stock) => sum + stock.valueScore, 0);
    const totalRisk = roster.reduce((sum, stock) => sum + stock.riskScore, 0);
    const totalOverall = roster.reduce((sum, stock) => sum + stock.totalScore, 0);

    const pieData = [
      { name: 'Growth', value: totalGrowth, color: '#10b981' },
      { name: 'Value', value: totalValue, color: '#3b82f6' },
      { name: 'Risk', value: totalRisk, color: '#ef4444' },
      { name: 'Overall', value: totalOverall, color: '#8b5cf6' }
    ];

    // Radar chart data for portfolio balance
    const avgGrowth = totalGrowth / roster.length;
    const avgValue = totalValue / roster.length;
    const avgRisk = totalRisk / roster.length;
    const avgOverall = totalOverall / roster.length;

    const radarData = [
      { metric: 'Growth', value: avgGrowth, fullMark: 100 },
      { metric: 'Value', value: avgValue, fullMark: 100 },
      { metric: 'Risk', value: avgRisk, fullMark: 100 },
      { metric: 'Overall', value: avgOverall, fullMark: 100 }
    ];

    return { barData, pieData, radarData };
  };

  const { barData, pieData, radarData } = getVisualizationData();

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
            <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {team?.name || "Your Team"}
              </h1>
                <p className="text-muted-foreground">Your PortfoliGO stock portfolio</p>
              </div>
              {roster.length > 0 && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <BarChart className="h-4 w-4" />
                      Visualize Portfolio
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold">
                        Portfolio Analytics Dashboard
                      </DialogTitle>
                      <DialogDescription className="text-lg">
                        Comprehensive analysis of your {roster.length} stock portfolio
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-8">
                      {/* Portfolio Overview Cards */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="bg-gradient-card border-border/50">
                          <CardContent className="p-4 text-center">
                            <div className="text-3xl font-bold text-green-600">
                              {pieData[0]?.value.toFixed(1) || '0.0'}
                            </div>
                            <div className="text-sm text-muted-foreground font-medium">Total Growth</div>
                            <div className="text-xs text-muted-foreground">
                              Avg: {(pieData[0]?.value / roster.length || 0).toFixed(1)}
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="bg-gradient-card border-border/50">
                          <CardContent className="p-4 text-center">
                            <div className="text-3xl font-bold text-blue-600">
                              {pieData[1]?.value.toFixed(1) || '0.0'}
                            </div>
                            <div className="text-sm text-muted-foreground font-medium">Total Value</div>
                            <div className="text-xs text-muted-foreground">
                              Avg: {(pieData[1]?.value / roster.length || 0).toFixed(1)}
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="bg-gradient-card border-border/50">
                          <CardContent className="p-4 text-center">
                            <div className="text-3xl font-bold text-red-600">
                              {pieData[2]?.value.toFixed(1) || '0.0'}
                            </div>
                            <div className="text-sm text-muted-foreground font-medium">Total Risk</div>
                            <div className="text-xs text-muted-foreground">
                              Avg: {(pieData[2]?.value / roster.length || 0).toFixed(1)}
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="bg-gradient-card border-border/50">
                          <CardContent className="p-4 text-center">
                            <div className="text-3xl font-bold text-primary">
                              {pieData[3]?.value.toFixed(1) || '0.0'}
                            </div>
                            <div className="text-sm text-muted-foreground font-medium">Total Overall</div>
                            <div className="text-xs text-muted-foreground">
                              Avg: {(pieData[3]?.value / roster.length || 0).toFixed(1)}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Individual Stock Performance */}
                      <Card className="bg-gradient-card border-border/50">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-xl">Individual Stock Performance</CardTitle>
                              <CardDescription>Detailed breakdown of each stock's scores</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              <Filter className="h-4 w-4 text-muted-foreground" />
                              <div className="flex gap-1">
                                {[
                                  { key: 'all', label: 'All', color: 'bg-muted' },
                                  { key: 'growth', label: 'Growth', color: 'bg-green-500' },
                                  { key: 'value', label: 'Value', color: 'bg-blue-500' },
                                  { key: 'risk', label: 'Risk', color: 'bg-red-500' },
                                  { key: 'overall', label: 'Overall', color: 'bg-primary' }
                                ].map((metric) => (
                                  <Button
                                    key={metric.key}
                                    variant={selectedMetric === metric.key ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setSelectedMetric(metric.key as any)}
                                    className="text-xs"
                                  >
                                    {metric.label}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="h-96">
                            <ResponsiveContainer width="100%" height="100%">
                              <RechartsBarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis 
                                  dataKey="symbol" 
                                  angle={-45}
                                  textAnchor="end"
                                  height={80}
                                  fontSize={12}
                                  stroke="#64748b"
                                />
                                <YAxis 
                                  domain={[0, 100]}
                                  fontSize={12}
                                  stroke="#64748b"
                                />
                                <Tooltip 
                                  contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                  }}
                                />
                                {selectedMetric === 'all' && (
                                  <>
                                    <Bar dataKey="growth" fill="#10b981" name="Growth" radius={[2, 2, 0, 0]} />
                                    <Bar dataKey="value" fill="#3b82f6" name="Value" radius={[2, 2, 0, 0]} />
                                    <Bar dataKey="risk" fill="#ef4444" name="Risk" radius={[2, 2, 0, 0]} />
                                    <Bar dataKey="total" fill="#8b5cf6" name="Total" radius={[2, 2, 0, 0]} />
                                  </>
                                )}
                                {selectedMetric === 'growth' && (
                                  <Bar dataKey="growth" fill="#10b981" name="Growth" radius={[2, 2, 0, 0]} />
                                )}
                                {selectedMetric === 'value' && (
                                  <Bar dataKey="value" fill="#3b82f6" name="Value" radius={[2, 2, 0, 0]} />
                                )}
                                {selectedMetric === 'risk' && (
                                  <Bar dataKey="risk" fill="#ef4444" name="Risk" radius={[2, 2, 0, 0]} />
                                )}
                                {selectedMetric === 'overall' && (
                                  <Bar dataKey="total" fill="#8b5cf6" name="Total" radius={[2, 2, 0, 0]} />
                                )}
                              </RechartsBarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Portfolio Composition */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="bg-gradient-card border-border/50">
                          <CardHeader>
                            <CardTitle className="text-xl">Portfolio Composition</CardTitle>
                            <CardDescription>Distribution of scores across your portfolio</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="h-80">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                  >
                                    {pieData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                  </Pie>
                                  <Tooltip 
                                    contentStyle={{
                                      backgroundColor: 'white',
                                      border: '1px solid #e2e8f0',
                                      borderRadius: '8px',
                                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Portfolio Balance Radar */}
                        <Card className="bg-gradient-card border-border/50">
                          <CardHeader>
                            <CardTitle className="text-xl">Portfolio Balance</CardTitle>
                            <CardDescription>Overall balance across all metrics</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="h-80">
                              <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={radarData}>
                                  <PolarGrid stroke="#e2e8f0" />
                                  <PolarAngleAxis dataKey="metric" fontSize={12} stroke="#64748b" />
                                  <PolarRadiusAxis angle={90} domain={[0, 100]} fontSize={10} stroke="#64748b" />
                                  <Radar
                                    name="Portfolio"
                                    dataKey="value"
                                    stroke="#8b5cf6"
                                    fill="#8b5cf6"
                                    fillOpacity={0.3}
                                    strokeWidth={2}
                                  />
                                  <Tooltip 
                                    contentStyle={{
                                      backgroundColor: 'white',
                                      border: '1px solid #e2e8f0',
                                      borderRadius: '8px',
                                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                  />
                                </RadarChart>
                              </ResponsiveContainer>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Top Performers */}
                      <Card className="bg-gradient-card border-border/50">
                        <CardHeader>
                          <CardTitle className="text-xl">Top Performers</CardTitle>
                          <CardDescription>Your best performing stocks</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {roster
                              .sort((a, b) => b.totalScore - a.totalScore)
                              .slice(0, 3)
                              .map((stock, index) => (
                                <div key={stock.symbol} className="p-4 bg-card rounded-lg border border-border/50">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-bold text-lg">{stock.symbol}</h4>
                                    <Badge variant="outline">
                                      #{index + 1}
                                    </Badge>
                                  </div>
                                  <div className="text-2xl font-bold text-primary mb-1">
                                    {stock.totalScore.toFixed(1)}
                                  </div>
                                  <div className="text-sm text-muted-foreground">{stock.company}</div>
                                  <div className="flex justify-between text-xs mt-2">
                                    <span className="text-green-600">G: {stock.growthScore}</span>
                                    <span className="text-blue-600">V: {stock.valueScore}</span>
                                    <span className="text-red-600">R: {stock.riskScore}</span>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
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
                            <span className="text-lg font-bold text-green-600">{stock.growthScore}</span>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Value</div>
                            <span className="text-lg font-bold text-blue-600">{stock.valueScore}</span>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Risk</div>
                            <span className="text-lg font-bold text-red-600">{stock.riskScore}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-3xl font-bold mb-1">
                          {stock.totalScore.toFixed(1)}
                        </div>
                        <div className="text-xs text-muted-foreground mb-4">Preference-Based Average</div>
                        
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