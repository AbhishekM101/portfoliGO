import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Trophy, Target, Users, BarChart3, Settings, AlertCircle, Save } from "lucide-react";
import { useLeague } from "@/contexts/LeagueContext";
import { useRoster } from "@/contexts/RosterContext";
import { useAuth } from "@/contexts/AuthContext";
import { LeagueService } from "@/services/leagueService";
import { useToast } from "@/hooks/use-toast";
import Roster from "./Roster";
import Matchup from "./Matchup";
import Players from "./Players";

const LeagueDetails = () => {
  const { leagueId } = useParams();
  const navigate = useNavigate();
  const { userLeagues, refreshLeagues } = useLeague();
  const { team } = useRoster();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("roster");
  const [settingsData, setSettingsData] = useState({
    name: '',
    description: '',
    is_public: false,
    max_players: 10,
    roster_size: 8,
    risk_weight: 30,
    growth_weight: 40,
    value_weight: 30
  });
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Find the current league
  const currentLeague = userLeagues.find(league => league.id === leagueId);
  
  // Check if current user is admin/commissioner
  const isAdmin = currentLeague?.members?.find(member => member.user_id === user?.id)?.is_commissioner;
  
  // Initialize settings data when league changes
  useEffect(() => {
    if (currentLeague) {
      // Get the actual saved weights from the database
      const savedRiskWeight = currentLeague.settings?.risk_weight || 0.3;
      const savedGrowthWeight = currentLeague.settings?.growth_weight || 0.4;
      const savedValueWeight = currentLeague.settings?.value_weight || 0.3;
      
      setSettingsData({
        name: currentLeague.name,
        description: currentLeague.description || '',
        is_public: currentLeague.is_public,
        max_players: currentLeague.max_players,
        roster_size: currentLeague.roster_size,
        risk_weight: Math.round(savedRiskWeight * 100),
        growth_weight: Math.round(savedGrowthWeight * 100),
        value_weight: Math.round(savedValueWeight * 100)
      });
    }
  }, [currentLeague]);
  
  const handleSaveSettings = async () => {
    if (!currentLeague) return;
    
    setIsSaving(true);
    setSettingsError(null);
    
    try {
      // Convert percentage weights back to decimal for database
      const settingsToSave = {
        ...settingsData,
        risk_weight: settingsData.risk_weight / 100,
        growth_weight: settingsData.growth_weight / 100,
        value_weight: settingsData.value_weight / 100
      };
      
      await LeagueService.updateLeagueSettings(currentLeague.id, settingsToSave);
      
      // Refresh league data to show updated settings
      await refreshLeagues();
      
      toast({
        title: "Settings Saved",
        description: "League settings have been updated successfully.",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save settings';
      setSettingsError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  
  if (!currentLeague) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto p-6">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">League Not Found</h1>
            <p className="text-muted-foreground mb-4">
              The league you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* League Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/home')}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{currentLeague.name}</h1>
                <p className="text-muted-foreground">{currentLeague.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                onClick={() => navigate(`/league/${leagueId}/draft`)}
                className="bg-primary hover:bg-primary/90"
              >
                {localStorage.getItem(`draft_completed_${leagueId}`) === 'true' ? 'View Draft' : 'Start Draft'}
              </Button>
              <div className="text-sm text-muted-foreground">
                {currentLeague.member_count || 0}/{currentLeague.max_players} Players
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* League Navigation Tabs */}
      <div className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-5' : 'grid-cols-4'}`}>
              <TabsTrigger value="roster" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Roster
              </TabsTrigger>
              <TabsTrigger value="matchup" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Matchup
              </TabsTrigger>
              <TabsTrigger value="players" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Players
              </TabsTrigger>
              <TabsTrigger value="standings" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Standings
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </TabsTrigger>
              )}
            </TabsList>

            <div className="max-w-6xl mx-auto p-6">
              <TabsContent value="roster" className="mt-0">
                <Roster onNavigateToPlayers={() => setActiveTab("players")} />
              </TabsContent>

              <TabsContent value="matchup" className="mt-0">
                <Matchup />
              </TabsContent>

              <TabsContent value="players" className="mt-0">
                <Players />
              </TabsContent>

              <TabsContent value="standings" className="mt-0">
                <div className="space-y-6">
                  {/* League Members Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle>League Members</CardTitle>
                      <CardDescription>
                        Current members in {currentLeague.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {currentLeague.members && currentLeague.members.length > 0 ? (
                          currentLeague.members.map((member, index) => (
                            <div 
                              key={member.id}
                              className="flex items-center justify-between p-4 rounded-lg bg-gradient-card border border-border/50"
                            >
                              <div className="flex items-center gap-4">
                                <div className="text-center">
                                  <div className="text-xs text-muted-foreground">#</div>
                                  <div className="text-lg font-bold">{index + 1}</div>
                                </div>
                                
                                <div>
                                  <h3 className="text-lg font-bold">{member.team_name}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    {member.is_commissioner ? 'Commissioner' : 'Member'} • Joined {new Date(member.joined_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="text-right">
                                {member.is_commissioner && (
                                  <Badge variant="default" className="bg-yellow-500 text-white">
                                    Admin
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-12">
                            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Members Yet</h3>
                            <p className="text-muted-foreground">
                              This league doesn't have any members yet.
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Overall Standings Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Overall Standings</CardTitle>
                      <CardDescription>
                        League rankings and statistics
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12">
                        <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Standings Coming Soon</h3>
                        <p className="text-muted-foreground">
                          League standings and rankings will be available here.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              {isAdmin && (
                <TabsContent value="settings" className="mt-0">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>League Settings</CardTitle>
                        <CardDescription>
                          Configure your league settings and scoring rules
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {settingsError && (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{settingsError}</AlertDescription>
                          </Alert>
                        )}
                        
                        <div>
                          <Label htmlFor="league-name">League Name</Label>
                          <Input 
                            id="league-name" 
                            value={settingsData.name}
                            onChange={(e) => setSettingsData({ ...settingsData, name: e.target.value })}
                            placeholder="Enter league name" 
                            className="mt-2" 
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="league-description">Description (Optional)</Label>
                          <Input 
                            id="league-description" 
                            value={settingsData.description}
                            onChange={(e) => setSettingsData({ ...settingsData, description: e.target.value })}
                            placeholder="Enter league description" 
                            className="mt-2" 
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="public-league"
                            checked={settingsData.is_public}
                            onCheckedChange={(checked) => setSettingsData({ ...settingsData, is_public: checked })}
                          />
                          <Label htmlFor="public-league">Make this league public</Label>
                        </div>

                        <div>
                          <Label>Max Players</Label>
                          <div className="mt-2">
                            <Slider
                              value={[settingsData.max_players]}
                              onValueChange={(value) => setSettingsData({ ...settingsData, max_players: value[0] })}
                              max={16}
                              min={4}
                              step={2}
                            />
                            <div className="text-center mt-2 text-sm text-muted-foreground">
                              {settingsData.max_players} players
                            </div>
                          </div>
                        </div>

                        <div>
                          <Label>Roster Size</Label>
                          <div className="mt-2">
                            <Slider
                              value={[settingsData.roster_size]}
                              onValueChange={(value) => setSettingsData({ ...settingsData, roster_size: value[0] })}
                              max={12}
                              min={5}
                              step={1}
                            />
                            <div className="text-center mt-2 text-sm text-muted-foreground">
                              {settingsData.roster_size} stocks per team
                            </div>
                          </div>
                        </div>

                        <div>
                          <Label className="text-base font-semibold">Scoring Weights</Label>
                          <p className="text-sm text-muted-foreground mb-4">
                            Adjust how much each factor contributes to stock scores (must total 100%)
                          </p>
                          
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <Label>Risk Score</Label>
                                <Badge variant="outline">{settingsData.risk_weight}%</Badge>
                              </div>
                              <Slider
                                value={[settingsData.risk_weight]}
                                onValueChange={(value) => {
                                  const newRisk = value[0];
                                  const remaining = 100 - newRisk;
                                  const growthRatio = settingsData.growth_weight / (settingsData.growth_weight + settingsData.value_weight);
                                  setSettingsData({
                                    ...settingsData,
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
                                <Badge variant="outline">{settingsData.growth_weight}%</Badge>
                              </div>
                              <Slider
                                value={[settingsData.growth_weight]}
                                onValueChange={(value) => {
                                  const newGrowth = value[0];
                                  const remaining = 100 - newGrowth;
                                  const riskRatio = settingsData.risk_weight / (settingsData.risk_weight + settingsData.value_weight);
                                  setSettingsData({
                                    ...settingsData,
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
                                <Badge variant="outline">{settingsData.value_weight}%</Badge>
                              </div>
                              <Slider
                                value={[settingsData.value_weight]}
                                onValueChange={(value) => {
                                  const newValue = value[0];
                                  const remaining = 100 - newValue;
                                  const riskRatio = settingsData.risk_weight / (settingsData.risk_weight + settingsData.growth_weight);
                                  setSettingsData({
                                    ...settingsData,
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
                            
                            <div className="text-center p-3 bg-muted rounded-lg">
                              <span className="text-sm font-medium">
                                Total: {settingsData.risk_weight + settingsData.growth_weight + settingsData.value_weight}%
                              </span>
                            </div>
                          </div>
                        </div>

                        <Button 
                          onClick={handleSaveSettings}
                          disabled={isSaving}
                          className="w-full"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {isSaving ? 'Saving...' : 'Save Settings'}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              )}
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default LeagueDetails;
