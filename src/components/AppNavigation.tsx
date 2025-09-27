import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  Users, 
  Trophy, 
  Target, 
  Settings,
  Home,
  BarChart3
} from "lucide-react";

const navigation = [
  { name: "ROSTER", to: "/roster", icon: Home },
  { name: "MATCHUP", to: "/matchup", icon: Target },
  { name: "PLAYERS", to: "/players", icon: Users },
  { name: "LEAGUE", to: "/league", icon: Trophy },
];

export const AppNavigation = () => {
  const location = useLocation();
  
  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Team Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Bull Market Bulls</h1>
              <p className="text-xs text-muted-foreground">Your Team</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex">
            {navigation.map((item) => {
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
            })}
          </div>

          {/* Settings */}
          <button className="p-2 rounded-lg hover:bg-muted transition-colors">
            <Settings className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </nav>
  );
};