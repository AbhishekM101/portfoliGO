import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Plus, Globe, ArrowRight, Trophy } from 'lucide-react';
import { useLeague } from '@/contexts/LeagueContext';

export const NoLeagueState: React.FC = () => {
  const navigate = useNavigate();
  const { hasLeagues, userLeagues } = useLeague();

  // If user has leagues but no active league selected
  if (hasLeagues && userLeagues.length > 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Trophy className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl">Select a League</CardTitle>
            <CardDescription className="text-base">
              You're a member of {userLeagues.length} league{userLeagues.length > 1 ? 's' : ''}. 
              Please select which league you'd like to access.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {userLeagues.map((league) => (
                <div key={league.id} className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Trophy className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{league.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {league.member_count} member{league.member_count > 1 ? 's' : ''} • Code: {league.code}
                    </p>
                  </div>
                  <Button onClick={() => navigate('/league')}>
                    Select League
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user has no leagues at all
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">Join a League to Get Started</CardTitle>
          <CardDescription className="text-base">
            Fantasy Stocks is all about competing in leagues! You need to join or create a league 
            to access your roster, matchups, and player stats.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Create Your Own League</h3>
                <p className="text-sm text-muted-foreground">
                  Set up custom scoring rules and invite friends to compete
                </p>
              </div>
              <Button onClick={() => navigate('/league')}>
                Create League
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
            
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Globe className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Join Public Leagues</h3>
                <p className="text-sm text-muted-foreground">
                  Discover and join leagues created by other players
                </p>
              </div>
              <Button variant="outline" onClick={() => navigate('/league')}>
                Browse Leagues
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Once you're in a league, you'll be able to access all the fantasy trading features!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
