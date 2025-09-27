import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useLeague } from "@/contexts/LeagueContext";
import { useToast } from "@/hooks/use-toast";
import { LeagueSelector } from "@/components/LeagueSelector";
import { 
  Users, 
  Trophy, 
  Target, 
  Settings,
  Home,
  BarChart3,
  LogOut,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navigation = [
  { name: "ROSTER", to: "/roster", icon: Home },
  { name: "MATCHUP", to: "/matchup", icon: Target },
  { name: "PLAYERS", to: "/players", icon: Users },
  { name: "LEAGUE", to: "/league", icon: Trophy },
];

export const AppNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { hasLeagues } = useLeague();
  const { toast } = useToast();
  
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
  
  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* League/Team Info */}
          <div className="flex items-center gap-3">
            {hasLeagues ? (
              <LeagueSelector />
            ) : (
              <>
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="font-bold text-lg">Fantasy Stocks</h1>
                  <p className="text-xs text-muted-foreground">Join a league to get started</p>
                </div>
              </>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex">
            {hasLeagues ? (
              navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                
                return (
                  <NavLink
                    key={item.name}
                    to={item.to}
                      className={cn(
                        "relative px-6 py-4 text-sm font-medium transition-colors duration-200",
                        "border-b-2 border-transparent",
                        isActive 
                          ? "text-primary border-primary" 
                          : "text-muted-foreground hover:text-foreground hover:border-border"
                      )}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {item.name}
                    </div>
                  </NavLink>
                );
              })
            ) : (
              <NavLink
                to="/league"
                className={cn(
                  "relative px-6 py-4 text-sm font-medium transition-colors duration-200",
                  "border-b-2 border-transparent",
                  location.pathname === "/league"
                    ? "text-primary border-primary" 
                    : "text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  LEAGUES
                </div>
              </NavLink>
            )}
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
    </nav>
  );
};