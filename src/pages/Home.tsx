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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Globe,
  Eye,
  User
} from "lucide-react";
import { DatabaseSetupCard } from "@/components/DatabaseSetupCard";
import { SupabaseConnectionTest } from "@/components/SupabaseConnectionTest";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useAuth } from "@/contexts/AuthContext";
import { useLeague } from "@/contexts/LeagueContext";
import { useToast } from "@/hooks/use-toast";
import { LeagueService, type LeagueWithMembers, type CreateLeagueData, type JoinLeagueData } from "@/services/leagueService";
import { supabase } from "@/integrations/supabase/client";

const Home = () => {
  const { user, signOut } = useAuth();
  const { userLeagues, refreshLeagues, currentLeague, setCurrentLeague } = useLeague();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [publicLeagues, setPublicLeagues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDatabaseSetup, setShowDatabaseSetup] = useState(false);
  
  // Create League State
  const [showCreateLeague, setShowCreateLeague] = useState(false);
  const [createLeagueData, setCreateLeagueData] = useState<CreateLeagueData>({
    name: "",
    description: "",
    max_players: 8,
    roster_size: 5,
    is_public: false,
    risk_weight: 30,
    growth_weight: 40,
    value_weight: 30
  });
  const [createLoading, setCreateLoading] = useState(false);
  
  // Join League State
  const [showJoinLeague, setShowJoinLeague] = useState(false);
  const [joinLeagueData, setJoinLeagueData] = useState<JoinLeagueData>({
    code: "",
    team_name: ""
  });
  const [joinLoading, setJoinLoading] = useState(false);
  
  // Search
  const [searchTerm, setSearchTerm] = useState("");

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You've been successfully signed out.",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getUserInitials = () => {
    if (user?.user_metadata?.team_name) {
      return user.user_metadata.team_name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  useEffect(() => {
    loadPublicLeagues();
    testSupabaseConnection();
  }, []);

  const testSupabaseConnection = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.log('Auth error (expected if not logged in):', error);
      }
      console.log('Supabase connection test - User:', user ? 'Logged in' : 'Not logged in');
    } catch (err) {
      console.error('Supabase connection failed:', err);
    }
  };

  const loadPublicLeagues = async () => {
    try {
      setLoading(true);
      setError(null);
      const leagues = await LeagueService.getPublicLeagues();
      setPublicLeagues(leagues);
    } catch (err) {
      console.error('Error loading public leagues:', err);
      setError('Failed to load public leagues');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLeague = async () => {
    try {
      setCreateLoading(true);
      const newLeague = await LeagueService.createLeague(createLeagueData);
      
      toast({
        title: "League Created",
        description: `Successfully created "${newLeague.name}"`,
      });
      
      setShowCreateLeague(false);
      setCreateLeagueData({
        name: "",
        description: "",
        max_players: 8,
        roster_size: 5,
        is_public: false,
        risk_weight: 30,
        growth_weight: 40,
        value_weight: 30
      });
      
      await refreshLeagues();
    } catch (err) {
      console.error('Error creating league:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create league",
        variant: "destructive",
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoinLeague = async () => {
    try {
      setJoinLoading(true);
      const league = await LeagueService.joinLeague(joinLeagueData);
      
      toast({
        title: "Joined League",
        description: `Successfully joined the league`,
      });
      
      setShowJoinLeague(false);
      setJoinLeagueData({ code: "", team_name: "" });
      
      await refreshLeagues();
    } catch (err) {
      console.error('Error joining league:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to join league",
        variant: "destructive",
      });
    } finally {
      setJoinLoading(false);
    }
  };

  const handleJoinPublicLeague = async (league: any) => {
    try {
      const teamName = prompt(`Enter your team name for ${league.name}:`);
      if (!teamName) return;
      
      await LeagueService.joinLeague({
        code: league.code,
        team_name: teamName
      });
      
      toast({
        title: "Joined League",
        description: `Successfully joined "${league.name}"`,
      });
      
      await refreshLeagues();
    } catch (err) {
      console.error('Error joining public league:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to join league",
        variant: "destructive",
      });
    }
  };

  const handleViewLeagueDetails = (league: LeagueWithMembers) => {
    setCurrentLeague(league);
    navigate(`/league/${league.id}`);
  };

  const filteredPublicLeagues = publicLeagues.filter(league =>
    league.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    league.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-64 mb-4"></div>
            <div className="grid gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src="/logo.png" 
                alt="PortfoliGO Logo" 
                className="h-16 w-16 object-contain"
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
              />
              <div>
                <h1 className="text-3xl font-bold mb-2"><span className="text-white">Portfolio</span><span className="text-green-500">GO</span></h1>
                <p className="text-muted-foreground">Manage your leagues and compete with friends</p>
              </div>
            </div>
            
            {/* User Menu */}
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user?.user_metadata?.team_name || "User"}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="my-leagues" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="my-leagues">My Leagues</TabsTrigger>
            <TabsTrigger value="join-league">Join League</TabsTrigger>
            <TabsTrigger value="public-leagues">Public Leagues</TabsTrigger>
          </TabsList>

          <TabsContent value="my-leagues" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Your Leagues</h2>
              <Dialog open={showCreateLeague} onOpenChange={setShowCreateLeague}>
                <DialogTrigger asChild>
                  <Button>
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
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={createLeagueData.risk_weight}
                                onChange={(e) => {
                                  const newRisk = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                                  const remaining = 100 - newRisk;
                                  const growthRatio = createLeagueData.growth_weight / (createLeagueData.growth_weight + createLeagueData.value_weight);
                                  setCreateLeagueData({
                                    ...createLeagueData,
                                    risk_weight: newRisk,
                                    growth_weight: Math.round(remaining * growthRatio),
                                    value_weight: remaining - Math.round(remaining * growthRatio)
                                  });
                                }}
                                className="w-16 h-8 text-center"
                                min="0"
                                max="100"
                              />
                              <span className="text-sm text-muted-foreground">%</span>
                            </div>
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
                            max={100}
                            min={0}
                            step={1}
                          />
                        </div>
                        
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <Label>Growth Score</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={createLeagueData.growth_weight}
                                onChange={(e) => {
                                  const newGrowth = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                                  const remaining = 100 - newGrowth;
                                  const riskRatio = createLeagueData.risk_weight / (createLeagueData.risk_weight + createLeagueData.value_weight);
                                  setCreateLeagueData({
                                    ...createLeagueData,
                                    growth_weight: newGrowth,
                                    risk_weight: Math.round(remaining * riskRatio),
                                    value_weight: remaining - Math.round(remaining * riskRatio)
                                  });
                                }}
                                className="w-16 h-8 text-center"
                                min="0"
                                max="100"
                              />
                              <span className="text-sm text-muted-foreground">%</span>
                            </div>
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
                            max={100}
                            min={0}
                            step={1}
                          />
                        </div>
                        
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <Label>Value Score</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={createLeagueData.value_weight}
                                onChange={(e) => {
                                  const newValue = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                                  const remaining = 100 - newValue;
                                  const riskRatio = createLeagueData.risk_weight / (createLeagueData.risk_weight + createLeagueData.growth_weight);
                                  setCreateLeagueData({
                                    ...createLeagueData,
                                    value_weight: newValue,
                                    risk_weight: Math.round(remaining * riskRatio),
                                    growth_weight: remaining - Math.round(remaining * riskRatio)
                                  });
                                }}
                                className="w-16 h-8 text-center"
                                min="0"
                                max="100"
                              />
                              <span className="text-sm text-muted-foreground">%</span>
                            </div>
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
                            max={100}
                            min={0}
                            step={1}
                          />
                        </div>
                        
                        <div className="bg-muted rounded-lg p-3">
                          <p className="text-sm">
                            <strong>Total Score Formula:</strong> ((Growth × {createLeagueData.growth_weight}%) + 
                            (Risk × {createLeagueData.risk_weight}%) + (Value × {createLeagueData.value_weight}%)) × 3
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90" 
                      onClick={handleCreateLeague}
                      disabled={createLoading || !createLeagueData.name}
                    >
                      {createLoading ? "Creating..." : "Create League"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {userLeagues.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Leagues Yet</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Create a new league or join an existing one to get started.
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={() => setShowCreateLeague(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create League
                    </Button>
                    <Button variant="outline" onClick={() => setShowJoinLeague(true)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Join League
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
                        onClick={() => handleViewLeagueDetails(league)}
                        className="w-full"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View League Details
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="join-league" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Join League
                </CardTitle>
                <CardDescription>
                  Join an existing league with a code
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="league-code">League Code</Label>
                  <Input
                    id="league-code"
                    placeholder="Enter league code"
                    value={joinLeagueData.code}
                    onChange={(e) => setJoinLeagueData({...joinLeagueData, code: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="team-name">Team Name</Label>
                  <Input
                    id="team-name"
                    placeholder="Enter your team name"
                    value={joinLeagueData.team_name}
                    onChange={(e) => setJoinLeagueData({...joinLeagueData, team_name: e.target.value})}
                  />
                </div>
                <Button 
                  onClick={handleJoinLeague}
                  disabled={joinLoading || !joinLeagueData.code || !joinLeagueData.team_name}
                  className="w-full"
                >
                  {joinLoading ? "Joining..." : "Join League"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="public-leagues" className="space-y-6">
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
    </ErrorBoundary>
  );
};

export default Home;
