import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  ChevronDown, 
  Users, 
  Target, 
  Globe,
  Check
} from 'lucide-react';
import { useLeague } from '@/contexts/LeagueContext';

export const LeagueSelector: React.FC = () => {
  const { currentLeague, userLeagues, setCurrentLeague } = useLeague();

  if (!currentLeague) return null;

  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
        <Users className="h-6 w-6 text-primary-foreground" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h1 className="font-bold text-lg">{currentLeague.name}</h1>
          {currentLeague.is_public && <Globe className="h-4 w-4 text-blue-500" />}
          {userLeagues.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                {userLeagues.map((league) => (
                  <DropdownMenuItem
                    key={league.id}
                    onClick={() => setCurrentLeague(league)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{league.name}</span>
                      {league.is_public && <Globe className="h-3 w-3 text-blue-500" />}
                    </div>
                    {league.id === currentLeague.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{currentLeague.member_count}/{currentLeague.max_players} Players</span>
          <span>{currentLeague.roster_size} stocks per team</span>
          <Badge variant="outline" className="text-xs">
            {currentLeague.status.replace('_', ' ')}
          </Badge>
        </div>
      </div>
    </div>
  );
};
