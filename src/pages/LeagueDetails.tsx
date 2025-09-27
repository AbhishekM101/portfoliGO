import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Trophy, Target, Users, BarChart3 } from "lucide-react";
import { useLeague } from "@/contexts/LeagueContext";
import { useRoster } from "@/contexts/RosterContext";
import Roster from "./Roster";
import Matchup from "./Matchup";
import Players from "./Players";

const LeagueDetails = () => {
  const { leagueId } = useParams();
  const navigate = useNavigate();
  const { userLeagues } = useLeague();
  const { team } = useRoster();
  const [activeTab, setActiveTab] = useState("roster");
  
  // Find the current league
  const currentLeague = userLeagues.find(league => league.id === leagueId);
  
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
              <Badge variant="outline">{currentLeague.status.replace('_', ' ')}</Badge>
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
            <TabsList className="grid w-full grid-cols-4">
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
                <Card>
                  <CardHeader>
                    <CardTitle>League Standings</CardTitle>
                    <CardDescription>
                      Current standings for {currentLeague.name}
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
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default LeagueDetails;
