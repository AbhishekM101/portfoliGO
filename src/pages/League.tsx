import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Settings, Trophy, Target } from "lucide-react";
import { AppNavigation } from "@/components/AppNavigation";

// Mock data for demonstration
const mockLeague = {
  name: "Tech Stock Warriors",
  code: "TSW2024",
  players: 8,
  maxPlayers: 10,
  isGameMaster: true,
  status: "draft_pending"
};

const mockStandings = [
  { rank: 1, team: "Bull Market Bulls", owner: "You", record: "0-0-0", points: 0.0 },
  { rank: 2, team: "Bear Slayers", owner: "Alex Chen", record: "0-0-0", points: 0.0 },
  { rank: 3, team: "Diamond Hands", owner: "Sarah Kim", record: "0-0-0", points: 0.0 },
  { rank: 4, team: "Moon Shooters", owner: "Mike Johnson", record: "0-0-0", points: 0.0 },
];

const League = () => {
  const [showCreateLeague, setShowCreateLeague] = useState(false);
  const [showJoinLeague, setShowJoinLeague] = useState(false);
  const [leagueSettings, setLeagueSettings] = useState({
    name: "",
    maxPlayers: 10,
    rosterSize: 8,
    // Scoring weights (must sum to 100)
    riskWeight: 20,
    growthWeight: 40,
    valueWeight: 40,
  });

  const handleWeightChange = (type: 'risk' | 'growth' | 'value', value: number) => {
    const newWeights = { ...leagueSettings };
    const oldValue = newWeights[`${type}Weight`];
    const difference = value - oldValue;
    
    // Adjust other weights proportionally
    if (type === 'risk') {
      const remaining = 100 - value;
      const growthRatio = newWeights.growthWeight / (newWeights.growthWeight + newWeights.valueWeight);
      newWeights.riskWeight = value;
      newWeights.growthWeight = Math.round(remaining * growthRatio);
      newWeights.valueWeight = remaining - newWeights.growthWeight;
    } else if (type === 'growth') {
      const remaining = 100 - value;
      const riskRatio = newWeights.riskWeight / (newWeights.riskWeight + newWeights.valueWeight);
      newWeights.growthWeight = value;
      newWeights.riskWeight = Math.round(remaining * riskRatio);
      newWeights.valueWeight = remaining - newWeights.riskWeight;
    } else {
      const remaining = 100 - value;
      const riskRatio = newWeights.riskWeight / (newWeights.riskWeight + newWeights.growthWeight);
      newWeights.valueWeight = value;
      newWeights.riskWeight = Math.round(remaining * riskRatio);
      newWeights.growthWeight = remaining - newWeights.riskWeight;
    }
    
    setLeagueSettings(newWeights);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppNavigation />
      
      <div className="max-w-6xl mx-auto p-6">
        {/* League Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">{mockLeague.name}</h1>
              <p className="text-muted-foreground">League Code: {mockLeague.code}</p>
            </div>
            <div className="flex gap-3">
              <Dialog open={showJoinLeague} onOpenChange={setShowJoinLeague}>
                <DialogTrigger asChild>
                  <Button variant="outline">Join League</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Join a League</DialogTitle>
                    <DialogDescription>
                      Enter the league code to join an existing fantasy stocks league.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="league-code">League Code</Label>
                      <Input id="league-code" placeholder="Enter league code" className="mt-2" />
                    </div>
                    <Button className="bg-primary hover:bg-primary/90">Join League</Button>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Dialog open={showCreateLeague} onOpenChange={setShowCreateLeague}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Create League
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New League</DialogTitle>
                    <DialogDescription>
                      Set up your fantasy stocks league with custom scoring rules.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6 py-4">
                    <div>
                      <Label htmlFor="league-name">League Name</Label>
                      <Input 
                        id="league-name" 
                        value={leagueSettings.name}
                        onChange={(e) => setLeagueSettings({ ...leagueSettings, name: e.target.value })}
                        placeholder="Enter league name" 
                        className="mt-2" 
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Max Players</Label>
                        <div className="mt-2">
                          <Slider
                            value={[leagueSettings.maxPlayers]}
                            onValueChange={(value) => setLeagueSettings({ ...leagueSettings, maxPlayers: value[0] })}
                            max={16}
                            min={4}
                            step={2}
                          />
                          <div className="text-center mt-2 text-sm text-muted-foreground">
                            {leagueSettings.maxPlayers} players
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <Label>Roster Size</Label>
                        <div className="mt-2">
                          <Slider
                            value={[leagueSettings.rosterSize]}
                            onValueChange={(value) => setLeagueSettings({ ...leagueSettings, rosterSize: value[0] })}
                            max={12}
                            min={5}
                            step={1}
                          />
                          <div className="text-center mt-2 text-sm text-muted-foreground">
                            {leagueSettings.rosterSize} stocks per team
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Scoring Weights */}
                    <div>
                      <Label className="text-base font-semibold">Scoring Weights</Label>
                      <p className="text-sm text-muted-foreground mb-4">
                        Adjust how much each factor contributes to stock scores (must total 100%)
                      </p>
                      
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <Label>Risk Score</Label>
                            <Badge variant="outline">{leagueSettings.riskWeight}%</Badge>
                          </div>
                          <Slider
                            value={[leagueSettings.riskWeight]}
                            onValueChange={(value) => handleWeightChange('risk', value[0])}
                            max={80}
                            min={10}
                            step={5}
                            className="text-bear"
                          />
                        </div>
                        
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <Label>Growth Score</Label>
                            <Badge variant="outline">{leagueSettings.growthWeight}%</Badge>
                          </div>
                          <Slider
                            value={[leagueSettings.growthWeight]}
                            onValueChange={(value) => handleWeightChange('growth', value[0])}
                            max={80}
                            min={10}
                            step={5}
                            className="text-success"
                          />
                        </div>
                        
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <Label>Value Score</Label>
                            <Badge variant="outline">{leagueSettings.valueWeight}%</Badge>
                          </div>
                          <Slider
                            value={[leagueSettings.valueWeight]}
                            onValueChange={(value) => handleWeightChange('value', value[0])}
                            max={80}
                            min={10}
                            step={5}
                            className="text-primary"
                          />
                        </div>
                        
                        <div className="bg-muted rounded-lg p-3">
                          <p className="text-sm">
                            <strong>Total Score Formula:</strong> (Growth × {leagueSettings.growthWeight}%) + 
                            (Risk × {leagueSettings.riskWeight}%) + (Value × {leagueSettings.valueWeight}%) × 100
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <Button className="w-full bg-primary hover:bg-primary/90">Create League</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {/* League Stats */}
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{mockLeague.players}/{mockLeague.maxPlayers} Players</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline">Draft Pending</Badge>
            </div>
          </div>
        </div>

        {/* Standings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              League Standings
            </CardTitle>
            <CardDescription>Current season standings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockStandings.map((team) => (
                <div 
                  key={team.rank} 
                  className="flex items-center justify-between p-4 rounded-lg bg-card/80 border border-border/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold text-muted-foreground w-8">
                      {team.rank}
                    </div>
                    <div>
                      <h3 className="font-semibold">{team.team}</h3>
                      <p className="text-sm text-muted-foreground">{team.owner}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8 text-right">
                    <div>
                      <div className="text-sm text-muted-foreground">Record</div>
                      <div className="font-mono">{team.record}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Points</div>
                      <div className="font-mono text-xl">{team.points.toFixed(1)}</div>
                    </div>
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

export default League;