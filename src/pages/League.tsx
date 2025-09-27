import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Users, 
  Settings, 
  Trophy, 
  Target, 
  Search,
  Copy,
  LogOut,
  AlertCircle,
  CheckCircle,
  UserPlus,
  Globe
} from "lucide-react";
import { AppNavigation } from "@/components/AppNavigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { LeagueService, type LeagueWithMembers, type CreateLeagueData, type JoinLeagueData } from "@/services/leagueService";

const League = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [userLeagues, setUserLeagues] = useState<LeagueWithMembers[]>([]);
  const [publicLeagues, setPublicLeagues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Create League State
  const [showCreateLeague, setShowCreateLeague] = useState(false);
  const [createLeagueData, setCreateLeagueData] = useState<CreateLeagueData>({
    name: "",
    description: "",
    is_public: false,
    max_players: 10,
    roster_size: 8,
    risk_weight: 20,
    growth_weight: 40,
    value_weight: 40,
  });
  const [creatingLeague, setCreatingLeague] = useState(false);
  
  // Join League State
  const [showJoinLeague, setShowJoinLeague] = useState(false);
  const [joinLeagueData, setJoinLeagueData] = useState<JoinLeagueData>({
    code: "",
    team_name: user?.user_metadata?.team_name || "",
  });
  const [joiningLeague, setJoiningLeague] = useState(false);
  
  // Public Leagues State
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadUserLeagues();
    loadPublicLeagues();
  }, []);

  const loadUserLeagues = async () => {
    try {
      const leagues = await LeagueService.getUserLeagues();
      setUserLeagues(leagues);
    } catch (err) {
      console.error('Error loading user leagues:', err);
      setError('Failed to load your leagues');
    }
  };

  const loadPublicLeagues = async () => {
    try {
      const leagues = await LeagueService.getPublicLeagues();
      setPublicLeagues(leagues);
    } catch (err) {
      console.error('Error loading public leagues:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLeague = async () => {
    if (!createLeagueData.name.trim()) {
      setError("Please enter a league name");
      return;
    }

    if (createLeagueData.risk_weight + createLeagueData.growth_weight + createLeagueData.value_weight !== 100) {
      setError("Scoring weights must total 100%");
      return;
    }

    setCreatingLeague(true);
    setError(null);

    try {
      const newLeague = await LeagueService.createLeague(createLeagueData);
      setUserLeagues(prev => [...prev, newLeague]);
      setShowCreateLeague(false);
      
      toast({
        title: "League Created!",
        description: `"${newLeague.name}" has been created successfully.`,
      });

      // Reset form
      setCreateLeagueData({
        name: "",
        description: "",
        is_public: false,
        max_players: 10,
        roster_size: 8,
        risk_weight: 20,
        growth_weight: 40,
        value_weight: 40,
      });
    } catch (err: any) {
      setError(err.message || "Failed to create league");
    } finally {
      setCreatingLeague(false);
    }
  };

  const handleJoinLeague = async () => {
    if (!joinLeagueData.code.trim()) {
      setError("Please enter a league code");
      return;
    }

    if (!joinLeagueData.team_name.trim()) {
      setError("Please enter a team name");
      return;
    }

    setJoiningLeague(true);
    setError(null);

    try {
      await LeagueService.joinLeague(joinLeagueData);
      await loadUserLeagues(); // Refresh user leagues
      setShowJoinLeague(false);
      
      toast({
        title: "Joined League!",
        description: "You've successfully joined the league.",
      });

      // Reset form
      setJoinLeagueData({
        code: "",
        team_name: user?.user_metadata?.team_name || "",
      });
    } catch (err: any) {
      setError(err.message || "Failed to join league");
    } finally {
      setJoiningLeague(false);
    }
  };

  const handleJoinPublicLeague = async (league: any) => {
    setJoinLeagueData(prev => ({ ...prev, code: league.code }));
    setShowJoinLeague(true);
  };

  const handleLeaveLeague = async (leagueId: string) => {
    try {
      await LeagueService.leaveLeague(leagueId);
      await loadUserLeagues(); // Refresh user leagues
      
      toast({
        title: "Left League",
        description: "You've successfully left the league.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to leave league",
        variant: "destructive",
      });
    }
  };

  const copyLeagueCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      description: "League code copied to clipboard.",
    });
  };

  const filteredPublicLeagues = publicLeagues.filter(league =>
    league.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    league.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppNavigation />
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading leagues...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNavigation />
      
      <div className="max-w-6xl mx-auto p-6">
        <Tabs defaultValue="my-leagues" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="my-leagues">My Leagues</TabsTrigger>
            <TabsTrigger value="join-league">Join League</TabsTrigger>
            <TabsTrigger value="public-leagues">Public Leagues</TabsTrigger>
          </TabsList>

          <TabsContent value="my-leagues" className="space-y-6">
            {/* My Leagues Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">My Leagues</h1>
                <p className="text-muted-foreground">Manage your fantasy stock leagues</p>
              </div>
              <Dialog open={showCreateLeague} onOpenChange={setShowCreateLeague}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Create League
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New League</DialogTitle>
                    <DialogDescription>
                      Set up your fantasy stocks league with custom scoring rules.
                    </DialogDescription>
                  </DialogHeader>
                  
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-6 py-4">
                    <div>
                      <Label htmlFor="league-name">League Name</Label>
                      <Input 
                        id="league-name" 
                        value={createLeagueData.name}
                        onChange={(e) => setCreateLeagueData({ ...createLeagueData, name: e.target.value })}
                        placeholder="Enter league name" 
                        className="mt-2" 
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="league-description">Description (Optional)</Label>
                      <Input 
                        id="league-description" 
                        value={createLeagueData.description}
                        onChange={(e) => setCreateLeagueData({ ...createLeagueData, description: e.target.value })}
                        placeholder="Enter league description" 
                        className="mt-2" 
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="is-public"
                        checked={createLeagueData.is_public}
                        onChange={(e) => setCreateLeagueData({ ...createLeagueData, is_public: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="is-public">Make this league public (others can discover and join)</Label>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Max Players</Label>
                        <div className="mt-2">
                          <Slider
                            value={[createLeagueData.max_players]}
                            onValueChange={(value) => setCreateLeagueData({ ...createLeagueData, max_players: value[0] })}
                            max={16}
                            min={4}
                            step={2}
                          />
                          <div className="text-center mt-2 text-sm text-muted-foreground">
                            {createLeagueData.max_players} players
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <Label>Roster Size</Label>
                        <div className="mt-2">
                          <Slider
                            value={[createLeagueData.roster_size]}
                            onValueChange={(value) => setCreateLeagueData({ ...createLeagueData, roster_size: value[0] })}
                            max={12}
                            min={5}
                            step={1}
                          />
                          <div className="text-center mt-2 text-sm text-muted-foreground">
                            {createLeagueData.roster_size} stocks per team
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
                            <Badge variant="outline">{createLeagueData.risk_weight}%</Badge>
                          </div>
                          <Slider
                            value={[createLeagueData.risk_weight]}
                            onValueChange={(value) => {
                              const newRisk = value[0];
                              const remaining = 100 - newRisk;
                              const growthRatio = createLeagueData.growth_weight / (createLeagueData.growth_weight + createLeagueData.value_weight);
                              setCreateLeagueData({
                                ...createLeagueData,
                                risk_weight: newRisk,
                                growth_weight: Math.round(remaining * growthRatio),
                                value_weight: remaining - Math.round(remaining * growthRatio)
                              });
                            }}
                            max={80}
                            min={10}
                            step={5}
                          />
                        </div>
                        
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <Label>Growth Score</Label>
                            <Badge variant="outline">{createLeagueData.growth_weight}%</Badge>
                          </div>
                          <Slider
                            value={[createLeagueData.growth_weight]}
                            onValueChange={(value) => {
                              const newGrowth = value[0];
                              const remaining = 100 - newGrowth;
                              const riskRatio = createLeagueData.risk_weight / (createLeagueData.risk_weight + createLeagueData.value_weight);
                              setCreateLeagueData({
                                ...createLeagueData,
                                growth_weight: newGrowth,
                                risk_weight: Math.round(remaining * riskRatio),
                                value_weight: remaining - Math.round(remaining * riskRatio)
                              });
                            }}
                            max={80}
                            min={10}
                            step={5}
                          />
                        </div>
                        
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <Label>Value Score</Label>
                            <Badge variant="outline">{createLeagueData.value_weight}%</Badge>
                          </div>
                          <Slider
                            value={[createLeagueData.value_weight]}
                            onValueChange={(value) => {
                              const newValue = value[0];
                              const remaining = 100 - newValue;
                              const riskRatio = createLeagueData.risk_weight / (createLeagueData.risk_weight + createLeagueData.growth_weight);
                              setCreateLeagueData({
                                ...createLeagueData,
                                value_weight: newValue,
                                risk_weight: Math.round(remaining * riskRatio),
                                growth_weight: remaining - Math.round(remaining * riskRatio)
                              });
                            }}
                            max={80}
                            min={10}
                            step={5}
                          />
                        </div>
                        
                        <div className="bg-muted rounded-lg p-3">
                          <p className="text-sm">
                            <strong>Total Score Formula:</strong> (Growth × {createLeagueData.growth_weight}%) + 
                            (Risk × {createLeagueData.risk_weight}%) + (Value × {createLeagueData.value_weight}%) × 100
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90" 
                      onClick={handleCreateLeague}
                      disabled={creatingLeague}
                    >
                      {creatingLeague ? "Creating..." : "Create League"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* User's Leagues */}
            {userLeagues.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Leagues Yet</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    You haven't joined any leagues yet. Create a new league or join an existing one to get started!
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={() => setShowCreateLeague(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create League
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/league')}>
                      Browse Public Leagues
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {userLeagues.map((league) => (
                  <Card key={league.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {league.name}
                            {league.is_public && <Globe className="h-4 w-4 text-blue-500" />}
                          </CardTitle>
                          <CardDescription>
                            League Code: {league.code}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyLeagueCode(league.code)}
                              className="ml-2 h-6 w-6 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{league.status.replace('_', ' ')}</Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleLeaveLeague(league.id)}
                          >
                            <LogOut className="h-4 w-4 mr-1" />
                            Leave
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-6 text-sm mb-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{league.member_count}/{league.max_players} Players</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-muted-foreground" />
                          <span>{league.roster_size} stocks per team</span>
                        </div>
                      </div>
                      {league.description && (
                        <p className="text-sm text-muted-foreground mb-4">{league.description}</p>
                      )}
                      <Button 
                        onClick={() => navigate(`/league/${league.id}`)}
                        className="w-full"
                      >
                        View League Details
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="join-league" className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Join League</h1>
              <p className="text-muted-foreground mb-6">Enter a league code to join an existing league</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Join by League Code</CardTitle>
                <CardDescription>
                  Enter the league code provided by the league commissioner
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div>
                  <Label htmlFor="league-code">League Code</Label>
                  <Input 
                    id="league-code" 
                    value={joinLeagueData.code}
                    onChange={(e) => setJoinLeagueData({ ...joinLeagueData, code: e.target.value.toUpperCase() })}
                    placeholder="Enter league code" 
                    className="mt-2" 
                  />
                </div>
                
                <div>
                  <Label htmlFor="team-name">Your Team Name</Label>
                  <Input 
                    id="team-name" 
                    value={joinLeagueData.team_name}
                    onChange={(e) => setJoinLeagueData({ ...joinLeagueData, team_name: e.target.value })}
                    placeholder="Enter your team name" 
                    className="mt-2" 
                  />
                </div>
                
                <Button 
                  className="w-full bg-primary hover:bg-primary/90" 
                  onClick={handleJoinLeague}
                  disabled={joiningLeague}
                >
                  {joiningLeague ? "Joining..." : "Join League"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="public-leagues" className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Public Leagues</h1>
              <p className="text-muted-foreground mb-6">Discover and join public leagues</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search leagues..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {filteredPublicLeagues.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Globe className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Public Leagues Found</h3>
                  <p className="text-muted-foreground text-center">
                    {searchTerm ? "No leagues match your search criteria." : "There are no public leagues available at the moment."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredPublicLeagues.map((league) => (
                  <Card key={league.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {league.name}
                            <Globe className="h-4 w-4 text-blue-500" />
                          </CardTitle>
                          <CardDescription>
                            League Code: {league.code}
                          </CardDescription>
                        </div>
                        <Badge variant="outline">{league.status.replace('_', ' ')}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-6 text-sm mb-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{league.member_count || 0}/{league.max_players} Players</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-muted-foreground" />
                          <span>{league.roster_size} stocks per team</span>
                        </div>
                      </div>
                      {league.description && (
                        <p className="text-sm text-muted-foreground mb-4">{league.description}</p>
                      )}
                      <Button 
                        onClick={() => handleJoinPublicLeague(league)}
                        className="w-full"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Join League
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default League;