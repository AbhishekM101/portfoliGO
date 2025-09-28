import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Search, 
  Filter, 
  BarChart3, 
  Plus,
  LineChart
} from "lucide-react";
import { Stock } from "@/types/roster";
import { useToast } from "@/hooks/use-toast";
import { useRoster } from "@/contexts/RosterContext";




const Players = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState("All");
  const { toast } = useToast();
  const { roster, availableStocks, addStockToRoster } = useRoster();

  // Get top performing stocks for trending section
  const trendingStocks = availableStocks
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 5);

  const sectors = ["All", "Technology", "Healthcare", "Financial", "Consumer Discretionary", "Communication Services", "Automotive"];

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
    const matchesSector = selectedSector === "All" || stock.sector === selectedSector;
    
    // Check if stock is currently in the user's roster
    // (Other teams' rosters are managed separately and don't affect availability)
    const isInUserRoster = roster.some(rosteredStock => rosteredStock.id === stock.id);
    
    return matchesSearch && matchesSector && !isInUserRoster;
  });

  const handleAddToRoster = async (stock: Stock) => {
    try {
      // Add stock to roster using shared context
      await addStockToRoster(stock);
      
      // Show success message
      toast({
        title: "Stock Added",
        description: `${stock.symbol} has been added to your roster.`,
      });
      
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add stock to roster. Please try again.",
        variant: "destructive",
      });
    }
  };


  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Free Agents</h1>
          <p className="text-muted-foreground">Available stocks to add to your roster</p>
          
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search stocks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>

          {/* Sector Filters */}
          <div className="flex flex-wrap gap-2">
            {sectors.map((sector) => (
              <Button
                key={sector}
                variant={selectedSector === sector ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSector(sector)}
                className="text-xs"
              >
                {sector}
              </Button>
            ))}
          </div>
        </div>

        {/* Top Performers Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">TOP PERFORMERS</CardTitle>
              <LineChart className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {trendingStocks.map((stock) => (
                <Card key={stock.id} className="bg-gradient-card border-border/50 flex-shrink-0 w-80">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-lg">{stock.symbol}</h3>
                        <p className="text-sm text-muted-foreground">{stock.company}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {stock.sector}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      {/* ML Metrics */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <div className="text-lg font-bold text-green-600">{stock.growthScore}</div>
                          <div className="text-xs text-muted-foreground">Growth</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-red-600">{stock.riskScore}</div>
                          <div className="text-xs text-muted-foreground">Risk</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-blue-600">{stock.valueScore}</div>
                          <div className="text-xs text-muted-foreground">Value</div>
                        </div>
                      </div>
                      
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold mb-1">
                        {stock.totalScore.toFixed(1)}
                      </div>
                      <div className="text-xs text-muted-foreground">Preference-Based Average</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* All Stocks Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">ALL STOCKS</CardTitle>
              <LineChart className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardDescription>
              {filteredStocks.length} stocks available to add to your roster
              {filteredStocks.length === 0 && " (All stocks have been drafted)"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredStocks.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No stocks available</h3>
                <p className="text-muted-foreground">
                  All stocks have been drafted by teams in the league.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredStocks.map((stock) => (
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
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold">{stock.symbol}</h3>
                          <Badge variant="outline" className="text-xs">
                            {stock.sector}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{stock.company}</p>
                        
                        {/* Score Breakdown */}
                        <div className="grid grid-cols-3 gap-4">
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
                      <Button 
                        onClick={() => handleAddToRoster(stock)}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add to Roster
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Players;
