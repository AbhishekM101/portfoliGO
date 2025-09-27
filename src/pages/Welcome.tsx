import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Users, Trophy, Target } from "lucide-react";
import heroImage from "@/assets/fantasy-stocks-hero.jpg";

const Welcome = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async (type: 'login' | 'register') => {
    setIsLoading(true);
    // TODO: Implement authentication with Supabase
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-background/80" />
        </div>
        
        <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
          <div className="mb-8">
            <h1 className="text-6xl md:text-8xl font-bold mb-6">
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Fantasy
              </span>{" "}
              <span className="text-foreground">Stocks</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Draft your stock portfolio, compete with friends, and dominate the markets in the ultimate fantasy trading experience.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-card/80 rounded-xl p-6 shadow-lg border border-border/50">
              <TrendingUp className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Smart Scoring</h3>
              <p className="text-sm text-muted-foreground">
                ML-powered stock analysis with growth, value, and risk scores
              </p>
            </div>
            
            <div className="bg-card/80 rounded-xl p-6 shadow-lg border border-border/50">
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">League Play</h3>
              <p className="text-sm text-muted-foreground">
                Create leagues, draft stocks, and compete in weekly matchups
              </p>
            </div>
            
            <div className="bg-card/80 rounded-xl p-6 shadow-lg border border-border/50">
              <Trophy className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Real Rewards</h3>
              <p className="text-sm text-muted-foreground">
                Track performance with real market data and daily updates
              </p>
            </div>
          </div>

          <Card className="max-w-md mx-auto bg-card/90 shadow-xl border-border/50">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Get Started</CardTitle>
              <CardDescription>
                Join thousands of traders competing in fantasy stock leagues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="Enter your email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" placeholder="Enter your password" />
                  </div>
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90 transition-all duration-300" 
                    onClick={() => handleAuth('login')}
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </TabsContent>
                
                <TabsContent value="register" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Team Name</Label>
                    <Input id="name" placeholder="Enter your team name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">Email</Label>
                    <Input id="reg-email" type="email" placeholder="Enter your email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Password</Label>
                    <Input id="reg-password" type="password" placeholder="Create a password" />
                  </div>
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90 transition-all duration-300"
                    onClick={() => handleAuth('register')}
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Welcome;